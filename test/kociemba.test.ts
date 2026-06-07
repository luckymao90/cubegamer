import { describe, it, expect } from 'vitest';
import { solve } from 'cube-solver';
import { faceMove, sliceMove, formatMoves, parseMoves, type Face } from '../src/cube/notation';
import { createSolvedCube, applyMoves } from '../src/cube/CubeState';
import { isSolved } from '../src/cube/facelet';
import type { Axis, Move } from '../src/cube/types';

function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

const FACES: Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];

function faceScramble(rng: () => number, len: number): Move[] {
  const out: Move[] = [];
  for (let i = 0; i < len; i++) {
    out.push(faceMove(FACES[Math.floor(rng() * 6)], 3, rng() < 0.5));
  }
  return out;
}

function mixedScramble(rng: () => number, len: number): Move[] {
  const out: Move[] = [];
  for (let i = 0; i < len; i++) {
    if (rng() < 0.7) out.push(faceMove(FACES[Math.floor(rng() * 6)], 3, rng() < 0.5));
    else out.push(sliceMove(Math.floor(rng() * 3) as Axis, rng() < 0.5));
  }
  return out;
}

/** 契约：我的记号语义与 cube-solver 一致 —— format→solve→parse→apply 应回到已解。 */
describe('cube-solver 3x3 契约', () => {
  it(
    '仅外层打乱：解法应用后已解',
    () => {
      for (const seed of [1, 7, 13, 42, 99, 256]) {
        const moves = faceScramble(makeRng(seed), 22);
        const s = applyMoves(createSolvedCube(3), moves);
        const str = formatMoves(moves, 3);
        expect(str).not.toBeNull();
        const sol = parseMoves(solve(str!, 'kociemba'), 3);
        applyMoves(s, sol);
        expect(isSolved(s)).toBe(true);
      }
    },
    30000,
  );

  it(
    '含中层切片打乱：解法应用后已解',
    () => {
      for (const seed of [3, 21, 88, 500]) {
        const moves = mixedScramble(makeRng(seed), 20);
        const s = applyMoves(createSolvedCube(3), moves);
        const str = formatMoves(moves, 3);
        expect(str).not.toBeNull();
        const sol = parseMoves(solve(str!, 'kociemba'), 3);
        applyMoves(s, sol);
        expect(isSolved(s)).toBe(true);
      }
    },
    30000,
  );
});
