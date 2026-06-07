import type { Axis, Dir, Move } from './types';
import { latticeCoords } from './permutation';

export type Face = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';

interface FaceDef {
  axis: Axis;
  side: 1 | -1; // 外层在该轴的 +(N-1) 还是 -(N-1)
  cw: Dir; // “顺时针”（标准记号）对应的内部 dir
}

/**
 * 面 → 转动定义。cw 为该面标准“顺时针”对应的内部方向。
 * 约定见 types.ts：dir=+1 为绕 +axis 的右手正向。
 * 例：R 是从 +x 外侧看顺时针 = 绕 +x 右手负向 → cw=-1。
 */
const FACES: Record<Face, FaceDef> = {
  R: { axis: 0, side: 1, cw: -1 },
  L: { axis: 0, side: -1, cw: 1 },
  U: { axis: 1, side: 1, cw: -1 },
  D: { axis: 1, side: -1, cw: 1 },
  F: { axis: 2, side: 1, cw: -1 },
  B: { axis: 2, side: -1, cw: 1 },
};

export const ALL_FACES: readonly Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];

/** 中层切片（M/E/S）定义：方向沿用对应外层（M←L, E←D, S←F）。 */
const SLICE: Record<Axis, { letter: 'M' | 'E' | 'S'; cw: Dir }> = {
  0: { letter: 'M', cw: 1 },
  1: { letter: 'E', cw: 1 },
  2: { letter: 'S', cw: -1 },
};

/** 构造一次外层面转动（prime=true 为逆时针）。 */
export function faceMove(face: Face, N: number, prime = false): Move {
  const d = FACES[face];
  const layer = d.side === 1 ? N - 1 : -(N - 1);
  const dir: Dir = prime ? ((-d.cw) as Dir) : d.cw;
  return { axis: d.axis, layers: [layer], dir };
}

/** 中层切片转动（仅奇数阶有真正中层，layer=0）。 */
export function sliceMove(axis: Axis, prime = false): Move {
  const s = SLICE[axis];
  return { axis, layers: [0], dir: prime ? ((-s.cw) as Dir) : s.cw };
}

/** 整体旋转 x/y/z（所有层一起转；方向沿用 R/U/F）。 */
export function rotationMove(axis: Axis, N: number, prime = false): Move {
  const cw: Dir = -1; // x←R, y←U, z←F，三者 cw 均为 -1
  return { axis, layers: latticeCoords(N), dir: prime ? ((-cw) as Dir) : cw };
}

function faceOf(axis: Axis, side: 1 | -1): Face | null {
  for (const f of ALL_FACES) {
    const d = FACES[f];
    if (d.axis === axis && d.side === side) return f;
  }
  return null;
}

/**
 * Move → 记号串（单层转动）。无法表达（多层/4-5阶非中层内层）时返回 null。
 */
export function formatMove(move: Move, N: number): string | null {
  if (move.layers.length !== 1) return null;
  const L = move.layers[0];
  const side: 1 | -1 | 0 = L === N - 1 ? 1 : L === -(N - 1) ? -1 : 0;
  if (side !== 0) {
    const face = faceOf(move.axis, side);
    if (!face) return null;
    const prime = move.dir !== FACES[face].cw;
    return face + (prime ? "'" : '');
  }
  if (L === 0 && N % 2 === 1) {
    const s = SLICE[move.axis];
    const prime = move.dir !== s.cw;
    return s.letter + (prime ? "'" : '');
  }
  return null;
}

/** Move[] → 记号串；任一步无法表达则返回 null。 */
export function formatMoves(moves: readonly Move[], N: number): string | null {
  const toks: string[] = [];
  for (const m of moves) {
    const t = formatMove(m, N);
    if (t === null) return null;
    toks.push(t);
  }
  return toks.join(' ');
}

/** 记号串 → Move[]（U R F D L B / M E S / x y z，带 ' 或 2）。 */
export function parseMoves(str: string, N: number): Move[] {
  const out: Move[] = [];
  for (const raw of str.trim().split(/\s+/)) {
    if (!raw) continue;
    const m = raw.match(/^([URFDLBMESxyz])(2|'|’)?$/);
    if (!m) throw new Error('无法解析记号: ' + raw);
    const sym = m[1];
    const suf = m[2];
    const prime = suf === "'" || suf === '’';
    let base: Move;
    if ('URFDLB'.includes(sym)) base = faceMove(sym as Face, N, prime);
    else if ('MES'.includes(sym)) base = sliceMove(sym === 'M' ? 0 : sym === 'E' ? 1 : 2, prime);
    else base = rotationMove(sym === 'x' ? 0 : sym === 'y' ? 1 : 2, N, prime);
    out.push(base);
    if (suf === '2') out.push({ axis: base.axis, layers: base.layers, dir: base.dir });
  }
  return out;
}
