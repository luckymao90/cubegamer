import type { Axis, Dir, Move } from './types';

/** 反转一次转动（同层，方向取反）。 */
export function invertMove(m: Move): Move {
  return { axis: m.axis, layers: [...m.layers], dir: (m.dir === 1 ? -1 : 1) as Dir };
}

/** 反转一串转动：逆序 + 各自取反。 */
export function invertMoves(moves: readonly Move[]): Move[] {
  return moves.slice().reverse().map(invertMove);
}

/** 便捷构造：单层转动。 */
export function layerMove(axis: Axis, layer: number, dir: Dir): Move {
  return { axis, layers: [layer], dir };
}

export function sameLayers(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false;
  const bs = new Set(b);
  return a.every((x) => bs.has(x));
}

export function movesEqual(a: Move, b: Move): boolean {
  return a.axis === b.axis && a.dir === b.dir && sameLayers(a.layers, b.layers);
}

/** 是否同轴同层（方向可不同）——用于相邻消除判定。 */
export function sameAxisAndLayers(a: Move, b: Move): boolean {
  return a.axis === b.axis && sameLayers(a.layers, b.layers);
}
