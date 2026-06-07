import { describe, it, expect } from 'vitest';
import { createSolvedCube, applyMove, applyMoves } from '../src/cube/CubeState';
import { invertMove, invertMoves } from '../src/cube/moves';
import { latticeCoords } from '../src/cube/permutation';
import type { Axis, CubeState, Dir, Move } from '../src/cube/types';

/** 把状态序列化成可比较的规范字符串。 */
function canon(s: CubeState): string {
  return s.cubies
    .slice()
    .sort((a, b) => a.id - b.id)
    .map((c) => {
      const st = (Object.keys(c.stickers) as Array<keyof typeof c.stickers>)
        .sort()
        .map((k) => `${k}=${c.stickers[k]}`)
        .join(',');
      return `${c.id}@${c.pos.join(',')}|${st}`;
    })
    .join(';');
}

/** 确定性伪随机数（LCG），保证测试可复现。 */
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

const SIZES = [3, 4, 5];

describe('applyMove 基础正确性', () => {
  it('每个单层转动后再反向 == 恒等', () => {
    for (const N of SIZES) {
      const coords = latticeCoords(N);
      for (const axis of [0, 1, 2] as Axis[]) {
        for (const layer of coords) {
          for (const dir of [1, -1] as Dir[]) {
            const s = createSolvedCube(N);
            const before = canon(s);
            const m: Move = { axis, layers: [layer], dir };
            applyMove(s, m);
            expect(canon(s)).not.toBe(before); // 确实改变了
            applyMove(s, invertMove(m));
            expect(canon(s)).toBe(before);
          }
        }
      }
    }
  });

  it('同一转动连续 4 次 == 恒等', () => {
    for (const N of SIZES) {
      const coords = latticeCoords(N);
      for (const axis of [0, 1, 2] as Axis[]) {
        for (const layer of coords) {
          const s = createSolvedCube(N);
          const before = canon(s);
          const m: Move = { axis, layers: [layer], dir: 1 };
          for (let i = 0; i < 4; i++) applyMove(s, m);
          expect(canon(s)).toBe(before);
        }
      }
    }
  });

  it('随机序列后整体反向 == 恒等', () => {
    for (const N of SIZES) {
      const coords = latticeCoords(N);
      const rng = makeRng(12345 + N);
      const s = createSolvedCube(N);
      const before = canon(s);
      const moves: Move[] = [];
      for (let i = 0; i < 200; i++) {
        const axis = Math.floor(rng() * 3) as Axis;
        const layer = coords[Math.floor(rng() * coords.length)];
        const dir = (rng() < 0.5 ? 1 : -1) as Dir;
        moves.push({ axis, layers: [layer], dir });
      }
      applyMoves(s, moves);
      expect(canon(s)).not.toBe(before);
      applyMoves(s, invertMoves(moves));
      expect(canon(s)).toBe(before);
    }
  });

  it('已解魔方的贴纸数正确 (6 * N^2)', () => {
    for (const N of SIZES) {
      const s = createSolvedCube(N);
      const stickerCount = s.cubies.reduce(
        (acc, c) => acc + Object.keys(c.stickers).length,
        0,
      );
      expect(stickerCount).toBe(6 * N * N);
      expect(s.cubies.length).toBe(N * N * N);
    }
  });
});
