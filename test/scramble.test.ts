import { describe, it, expect } from 'vitest';
import { generateScramble, defaultScrambleLength } from '../src/scramble/scrambler';
import { latticeCoords } from '../src/cube/permutation';

function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

describe('打乱生成', () => {
  for (const N of [2, 3, 4, 5]) {
    it(`N=${N}: 长度符合默认值且无连续同轴`, () => {
      const moves = generateScramble(N, makeRng(99 + N));
      expect(moves.length).toBe(defaultScrambleLength(N));
      const valid = new Set(latticeCoords(N));
      for (let i = 0; i < moves.length; i++) {
        expect(moves[i].layers.length).toBe(1);
        expect(valid.has(moves[i].layers[0])).toBe(true);
        expect([1, -1]).toContain(moves[i].dir);
        if (i > 0) expect(moves[i].axis).not.toBe(moves[i - 1].axis);
      }
    });
  }

  it('大魔方打乱包含内层（不止外两层）', () => {
    const moves = generateScramble(5, makeRng(7));
    const innerCoords = [-2, 0, 2]; // 5 阶内层坐标
    const usesInner = moves.some((m) => innerCoords.includes(m.layers[0]));
    expect(usesInner).toBe(true);
  });
});
