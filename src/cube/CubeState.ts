import type { CubeState, CubieState, Move, DirKey } from './types';
import { Color } from './types';
import { latticeCoords, rotateVec3, rotateDirKey } from './permutation';

/** 构造一个已解（solved）的 N 阶魔方。 */
export function createSolvedCube(N: number): CubeState {
  const coords = latticeCoords(N);
  const max = N - 1;
  const cubies: CubieState[] = [];
  let id = 0;
  for (let k = 0; k < N; k++) {
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const x = coords[i];
        const y = coords[j];
        const z = coords[k];
        const stickers: Partial<Record<DirKey, Color>> = {};
        if (x === max) stickers['+x'] = Color.R;
        if (x === -max) stickers['-x'] = Color.L;
        if (y === max) stickers['+y'] = Color.U;
        if (y === -max) stickers['-y'] = Color.D;
        if (z === max) stickers['+z'] = Color.F;
        if (z === -max) stickers['-z'] = Color.B;
        cubies.push({ id: id++, pos: [x, y, z], stickers });
      }
    }
  }
  return { N, cubies };
}

export function cloneState(s: CubeState): CubeState {
  return {
    N: s.N,
    cubies: s.cubies.map((c) => ({
      id: c.id,
      pos: [c.pos[0], c.pos[1], c.pos[2]],
      stickers: { ...c.stickers },
    })),
  };
}

/**
 * 应用一次转动（纯整数置换，无浮点）。原地修改并返回 state。
 * 对每个属于该层的 cubie：① 旋转坐标 ② 按方向重映射其贴纸。
 */
export function applyMove(state: CubeState, move: Move): CubeState {
  const layerSet = new Set(move.layers);
  for (const cubie of state.cubies) {
    if (!layerSet.has(cubie.pos[move.axis])) continue;
    cubie.pos = rotateVec3(cubie.pos, move.axis, move.dir);
    const next: Partial<Record<DirKey, Color>> = {};
    for (const key of Object.keys(cubie.stickers) as DirKey[]) {
      next[rotateDirKey(key, move.axis, move.dir)] = cubie.stickers[key];
    }
    cubie.stickers = next;
  }
  return state;
}

export function applyMoves(state: CubeState, moves: readonly Move[]): CubeState {
  for (const m of moves) applyMove(state, m);
  return state;
}
