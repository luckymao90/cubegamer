/** 旋转轴：0=x, 1=y, 2=z */
export type Axis = 0 | 1 | 2;

/**
 * 转动方向。约定：dir=+1 表示绕 +axis 的“右手正向”90°
 * （从 +axis 朝原点看去为逆时针）。dir=-1 为反向。
 * 该约定在 permutation（逻辑置换）与 turnAnimator（动画）中必须一致。
 */
export type Dir = 1 | -1;

/** 颜色 / 面 id。面法向约定：U=+y, D=-y, R=+x, L=-x, F=+z, B=-z。 */
export enum Color {
  U = 0,
  R = 1,
  F = 2,
  D = 3,
  L = 4,
  B = 5,
}

/** 方向键：cubie 的某个外露面朝向哪个世界轴向。 */
export type DirKey = '+x' | '-x' | '+y' | '-y' | '+z' | '-z';

/**
 * 一次转动：绕 axis，影响该轴上坐标 ∈ layers 的所有层，转 dir*90°。
 * - 外层 R(N=4): {axis:0, layers:[3], dir}
 * - 宽层 Rw:     {axis:0, layers:[3,1], dir}
 * - 内层(4阶):   {axis:0, layers:[1], dir}
 * - 中层(5阶):   {axis:0, layers:[0], dir}
 */
export interface Move {
  axis: Axis;
  layers: number[];
  dir: Dir;
}

/** 单个小方块：稳定 id + 整数点阵坐标 + 外露面颜色。 */
export interface CubieState {
  id: number;
  pos: [number, number, number];
  stickers: Partial<Record<DirKey, Color>>;
}

/** 魔方逻辑状态（唯一事实源）。 */
export interface CubeState {
  N: number;
  cubies: CubieState[];
}

/** facelet 颜色模型：由 CubeState 派生，用于还原检测与求解器序列化。 */
export interface FaceletModel {
  N: number;
  /** 6 个面（顺序 U,R,F,D,L,B），每个面 N*N 行主序。 */
  faces: Color[][];
}

/** 历史条目：区分“打乱”与“正式操作”两个阶段。 */
export interface HistoryEntry {
  move: Move;
  phase: 'scramble' | 'play';
}

/** 一次成绩记录。 */
export interface SolveRecord {
  dateMs: number;
  N: number;
  timeMs: number;
  moves: number;
}
