import { describe, it, expect } from 'vitest';
import { createSolvedCube, applyMove, applyMoves } from '../src/cube/CubeState';
import { invertMoves } from '../src/cube/moves';
import { isSolved } from '../src/cube/facelet';
import { generateScramble } from '../src/scramble/scrambler';
import { latticeCoords } from '../src/cube/permutation';
import type { Axis, Move } from '../src/cube/types';

function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

describe('还原检测 isSolved', () => {
  it('已解魔方为已解', () => {
    for (const N of [2, 3, 4, 5]) expect(isSolved(createSolvedCube(N))).toBe(true);
  });

  it('单步之后不再是已解', () => {
    for (const N of [2, 3, 4, 5]) {
      const s = createSolvedCube(N);
      applyMove(s, { axis: 0, layers: [N - 1], dir: 1 });
      expect(isSolved(s)).toBe(false);
    }
  });

  it('整体旋转后的已解魔方仍判为已解（4 阶无中心关键用例）', () => {
    for (const N of [2, 3, 4, 5]) {
      const all = latticeCoords(N);
      for (const axis of [0, 1, 2] as Axis[]) {
        const s = createSolvedCube(N);
        applyMove(s, { axis, layers: all, dir: 1 }); // 整体旋转 = 所有层一起转
        expect(isSolved(s)).toBe(true);
      }
    }
  });

  it('打乱后非已解，整体反向后回到已解', () => {
    for (const N of [2, 3, 4, 5]) {
      const s = createSolvedCube(N);
      const moves: Move[] = generateScramble(N, makeRng(2024 + N));
      applyMoves(s, moves);
      expect(isSolved(s)).toBe(false);
      applyMoves(s, invertMoves(moves));
      expect(isSolved(s)).toBe(true);
    }
  });
});
