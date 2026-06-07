import type { Move } from '../cube/types';
import { invertMoves, sameLayers } from '../cube/moves';

interface Acc {
  axis: Move['axis'];
  layers: number[];
  amount: number; // 顺时针 90° 的次数 (mod 4)
}

/**
 * 相邻“同轴同层”消除：用栈合并相邻同轴同层转动（按 90° 次数 mod 4）。
 * 净 0 → 删除；净 1/3 → 单个 +1/-1 四分之一转；净 2 → 两个同向四分之一转(180°)。
 * 只做相邻合并（安全、保持净置换不变），不做跨步群论约简。
 */
export function cancelAdjacent(moves: readonly Move[]): Move[] {
  const stack: Acc[] = [];
  for (const m of moves) {
    const q = m.dir === 1 ? 1 : 3;
    const top = stack[stack.length - 1];
    if (top && top.axis === m.axis && sameLayers(top.layers, m.layers)) {
      top.amount = (top.amount + q) % 4;
      if (top.amount === 0) stack.pop();
    } else {
      stack.push({ axis: m.axis, layers: [...m.layers], amount: q });
    }
  }
  const out: Move[] = [];
  for (const a of stack) {
    if (a.amount === 1) out.push({ axis: a.axis, layers: [...a.layers], dir: 1 });
    else if (a.amount === 3) out.push({ axis: a.axis, layers: [...a.layers], dir: -1 });
    else if (a.amount === 2) {
      out.push({ axis: a.axis, layers: [...a.layers], dir: 1 });
      out.push({ axis: a.axis, layers: [...a.layers], dir: 1 });
    }
  }
  return out;
}

/**
 * 回放还原：对“当前生效路径”取逆序逆方向，再做相邻消除。
 * 对任意阶都保证：应用到当前状态后回到已解。
 */
export function rewindSolve(path: readonly Move[]): Move[] {
  return cancelAdjacent(invertMoves(path));
}
