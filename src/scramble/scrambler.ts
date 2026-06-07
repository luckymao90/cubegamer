import type { Axis, Dir, Move } from '../cube/types';
import { latticeCoords } from '../cube/permutation';

/** 默认打乱步数：按阶数缩放。 */
export function defaultScrambleLength(N: number): number {
  if (N <= 3) return 25;
  if (N === 4) return 40;
  if (N === 5) return 60;
  return 20 + N * 8;
}

/**
 * 生成 N 阶随机打乱（单层四分之一转序列）。
 * 过滤：避免与上一步同轴（防止平凡堆叠/抵消）。
 * 大魔方包含内层，故能真正打乱中心与棱。
 */
export function generateScramble(
  N: number,
  rng: () => number = Math.random,
  length: number = defaultScrambleLength(N),
): Move[] {
  const coords = latticeCoords(N);
  const moves: Move[] = [];
  let lastAxis = -1;
  while (moves.length < length) {
    let axis = Math.floor(rng() * 3) as Axis;
    if (axis === lastAxis) {
      axis = ((axis + 1 + Math.floor(rng() * 2)) % 3) as Axis; // 换一个不同轴
    }
    const layer = coords[Math.floor(rng() * coords.length)];
    const dir: Dir = rng() < 0.5 ? 1 : -1;
    moves.push({ axis, layers: [layer], dir });
    lastAxis = axis;
  }
  return moves;
}
