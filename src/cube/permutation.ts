import type { Axis, Dir, DirKey } from './types';

/** 点阵坐标：N 阶在每个轴上的坐标为 2*i-(N-1)，i=0..N-1（居中、全整数、步长 2）。 */
export function latticeCoords(N: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < N; i++) out.push(2 * i - (N - 1));
  return out;
}

/** 点阵坐标 → 世界坐标：相邻小方块中心间距 1.0。 */
export const WORLD_SCALE = 0.5;
export function latticeToWorld(
  p: readonly [number, number, number],
): [number, number, number] {
  return [p[0] * WORLD_SCALE, p[1] * WORLD_SCALE, p[2] * WORLD_SCALE];
}

/**
 * 绕 axis 旋转一个三维向量（只变换平面内两分量，axis 分量不变）。
 * 平面内轴 (u,w) = ((axis+1)%3, (axis+2)%3)，dir=+1 时 (u,w) -> (-w, u)。
 * 此函数同时用于：点阵坐标置换 与 贴纸方向向量旋转。
 */
export function rotateVec3(
  v: readonly [number, number, number],
  axis: Axis,
  dir: Dir,
): [number, number, number] {
  const u = ((axis + 1) % 3) as Axis;
  const w = ((axis + 2) % 3) as Axis;
  const out: [number, number, number] = [v[0], v[1], v[2]];
  // nz：把取反产生的 -0 规范化为 +0，保持坐标序列化（存档回放）干净。
  const nz = (x: number): number => (x === 0 ? 0 : x);
  if (dir === 1) {
    out[u] = nz(-v[w]);
    out[w] = nz(v[u]);
  } else {
    out[u] = nz(v[w]);
    out[w] = nz(-v[u]);
  }
  return out;
}

const DIRKEY_VEC: Record<DirKey, readonly [number, number, number]> = {
  '+x': [1, 0, 0],
  '-x': [-1, 0, 0],
  '+y': [0, 1, 0],
  '-y': [0, -1, 0],
  '+z': [0, 0, 1],
  '-z': [0, 0, -1],
};

const VEC_DIRKEY = new Map<string, DirKey>(
  (Object.entries(DIRKEY_VEC) as [DirKey, readonly [number, number, number]][]).map(
    ([k, v]) => [v.join(','), k],
  ),
);

export function dirKeyToVec(k: DirKey): [number, number, number] {
  const v = DIRKEY_VEC[k];
  return [v[0], v[1], v[2]];
}

export function vecToDirKey(v: readonly [number, number, number]): DirKey {
  const key = VEC_DIRKEY.get(`${v[0]},${v[1]},${v[2]}`);
  if (!key) throw new Error(`不是单位轴向量: ${v.join(',')}`);
  return key;
}

/** 旋转一个方向键（贴纸朝向）。 */
export function rotateDirKey(k: DirKey, axis: Axis, dir: Dir): DirKey {
  return vecToDirKey(rotateVec3(dirKeyToVec(k), axis, dir));
}

export const AXES: readonly Axis[] = [0, 1, 2];

export function axisName(a: Axis): 'x' | 'y' | 'z' {
  return a === 0 ? 'x' : a === 1 ? 'y' : 'z';
}
