import { describe, it, expect } from 'vitest';
import { createSolvedCube, applyMoves } from '../src/cube/CubeState';
import { rewindSolve, cancelAdjacent } from '../src/solve/rewindSolver';
import { isSolved } from '../src/cube/facelet';
import { generateScramble } from '../src/scramble/scrambler';
import type { CubeState, Move } from '../src/cube/types';

function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function canon(s: CubeState): string {
  return s.cubies
    .slice()
    .sort((a, b) => a.id - b.id)
    .map((c) => `${c.id}@${c.pos.join(',')}`)
    .join(';');
}

const R: Move = { axis: 0, layers: [2], dir: 1 };
const Ri: Move = { axis: 0, layers: [2], dir: -1 };

describe('rewindSolve 回放还原', () => {
  it('打乱后回放还原 → 已解 (3/4/5，多个种子)', () => {
    for (const N of [2, 3, 4, 5]) {
      for (const seed of [1, 2, 3, 42, 777]) {
        const s = createSolvedCube(N);
        const moves = generateScramble(N, makeRng(seed));
        applyMoves(s, moves);
        expect(isSolved(s)).toBe(false);
        applyMoves(s, rewindSolve(moves));
        expect(isSolved(s)).toBe(true);
      }
    }
  });

  it('cancelAdjacent 保持净置换不变', () => {
    for (const N of [2, 3, 4, 5]) {
      const moves = generateScramble(N, makeRng(2 * N + 5));
      const a = applyMoves(createSolvedCube(N), moves);
      const b = applyMoves(createSolvedCube(N), cancelAdjacent(moves));
      expect(canon(b)).toBe(canon(a));
    }
  });

  it('基础化简', () => {
    expect(cancelAdjacent([R, Ri])).toEqual([]);
    expect(cancelAdjacent([R, R, R, R])).toEqual([]);
    expect(cancelAdjacent([R, R, R])).toEqual([Ri]); // 3 次 CW == 1 次 CCW
    expect(cancelAdjacent([R, R]).length).toBe(2); // 180° = 两个同向四分之一转
  });
});
