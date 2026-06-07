import type { CubeState, Move } from '../../cube/types';
import { cloneState, applyMoves } from '../../cube/CubeState';
import { isSolved } from '../../cube/facelet';
import { formatMoves, parseMoves } from '../../cube/notation';

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, { resolve: (s: string) => void; reject: (e: Error) => void }>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<{ id: number; sol?: string; error?: string }>) => {
      const { id, sol, error } = e.data;
      const p = pending.get(id);
      if (!p) return;
      pending.delete(id);
      if (error) p.reject(new Error(error));
      else p.resolve(sol ?? '');
    };
    worker.onerror = () => {
      /* 留给超时处理 */
    };
  }
  return worker;
}

function solveViaWorker(scramble: string, timeoutMs = 8000): Promise<string> {
  const w = getWorker();
  const id = ++seq;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (pending.delete(id)) reject(new Error('solve timeout'));
    }, timeoutMs);
    pending.set(id, {
      resolve: (s) => {
        clearTimeout(timer);
        resolve(s);
      },
      reject: (e) => {
        clearTimeout(timer);
        reject(e);
      },
    });
    w.postMessage({ id, scramble });
  });
}

/** 预热（提前构建剪枝表）；id<0 的回包会被忽略。 */
export function warmKociemba(): void {
  try {
    getWorker().postMessage({ id: -1, scramble: '' });
  } catch {
    /* 忽略 */
  }
}

/**
 * 3 阶真实求解：把历史作为打乱串交给 cube-solver，解析后“克隆验证”。
 * 验证不通过或出错则返回 null（调用方回退到回放还原），保证绝不播放错误解法。
 */
export async function solveKociemba3x3(
  state: CubeState,
  history: readonly Move[],
): Promise<Move[] | null> {
  if (state.N !== 3) return null;
  const str = formatMoves(history, 3);
  if (str === null) return null;
  let solStr: string;
  try {
    solStr = await solveViaWorker(str);
  } catch {
    return null;
  }
  let sol: Move[];
  try {
    sol = parseMoves(solStr, 3);
  } catch {
    return null;
  }
  const test = cloneState(state);
  applyMoves(test, sol);
  return isSolved(test) ? sol : null;
}
