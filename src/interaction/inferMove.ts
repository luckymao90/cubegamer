import type { Axis, Dir, Move } from '../cube/types';

type Vec3 = readonly [number, number, number];

/** 轴对齐单位向量的叉积（结果仍为某个 ±轴单位向量）。 */
export function crossVec3(a: Vec3, b: Vec3): [number, number, number] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

/**
 * 由“被抓取面的外法向 n”“拖拽面内切向 t”“被抓 cubie 的点阵坐标 pos”
 * 推断应执行的转动。
 *
 * 原理：旋转轴向量 r = n × t；绕 +r 的正向旋转恰好把 n 转向 t
 * （因为 (n×t)×n = t）。于是 move.axis 取 r 的非零分量所在轴，
 * dir 取该分量符号，layer 取 pos 在该轴上的分量。
 *
 * 纯函数、无 Three.js 依赖，便于单测锁定手性。
 */
export function inferMove(faceNormal: Vec3, tangent: Vec3, pos: Vec3): Move {
  const r = crossVec3(faceNormal, tangent);
  let axis: Axis = 0;
  let comp = 0;
  for (let i = 0; i < 3; i++) {
    if (Math.abs(r[i]) > Math.abs(comp)) {
      comp = r[i];
      axis = i as Axis;
    }
  }
  const dir: Dir = comp >= 0 ? 1 : -1;
  return { axis, layers: [pos[axis]], dir };
}
