import type { CubeState, Color, DirKey } from './types';

/**
 * 还原检测：每个方向（面）上的所有贴纸颜色一致即为已解。
 * 对 3/4/5 阶都正确——包括无固定中心的 4 阶（“已解”本就是每面单色，
 * 与整体朝向无关），且不会被整体旋转误判。
 * 关键：按“各方向自身”判断一致，绝不与全局固定颜色比较。
 */
export function isSolved(state: CubeState): boolean {
  const seen: Partial<Record<DirKey, Color>> = {};
  for (const cubie of state.cubies) {
    for (const key of Object.keys(cubie.stickers) as DirKey[]) {
      const color = cubie.stickers[key]!;
      const prev = seen[key];
      if (prev === undefined) seen[key] = color;
      else if (prev !== color) return false;
    }
  }
  return true;
}
