import { describe, it, expect } from 'vitest';
import { inferMove } from '../src/interaction/inferMove';
import { rotateVec3 } from '../src/cube/permutation';

type Vec3 = [number, number, number];

const AXIS_VECS: Vec3[] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

function inPlane(n: Vec3): Vec3[] {
  return AXIS_VECS.filter((v) => v[0] * n[0] + v[1] * n[1] + v[2] * n[2] === 0);
}

describe('inferMove 手性', () => {
  it('对每个面法向 × 每个面内切向：推断转动恰好把法向转到切向', () => {
    for (const n of AXIS_VECS) {
      for (const t of inPlane(n)) {
        const m = inferMove(n, t, [2, 2, 2]);
        // 关键不变量：绕推断轴/方向转 90° 后，n 应正好落到 t。
        expect(rotateVec3(n, m.axis, m.dir)).toEqual(t);
      }
    }
  });

  it('layer 取自 pos 在旋转轴上的分量', () => {
    const m = inferMove([0, 0, 1], [1, 0, 0], [-1, 3, 2]);
    expect(m.axis).toBe(1); // 绕 y
    expect(m.layers).toEqual([3]); // pos[y] = 3
  });
});
