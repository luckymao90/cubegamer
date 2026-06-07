import * as THREE from 'three';
import type { CubeState, Move, SolveRecord } from '../cube/types';
import { createSolvedCube, applyMove, applyMoves } from '../cube/CubeState';
import { isSolved } from '../cube/facelet';
import { CubeView } from '../render/CubeView';
import { TurnAnimator } from '../render/turnAnimator';
import { MoveQueue } from './MoveQueue';
import { History, type HistorySnapshot } from './History';
import { Timer } from './Timer';
import { generateScramble } from '../scramble/scrambler';
import { rewindSolve } from '../solve/rewindSolver';
import { solveKociemba3x3 } from '../solve/kociemba';
import { type Palette } from '../render/cubieFactory';

export type MovePhase = 'scramble' | 'play' | 'internal' | 'solve';
interface MoveMeta {
  phase: MovePhase;
}

export interface MoveAppliedInfo {
  move: Move;
  phase: MovePhase;
  solved: boolean;
}

/**
 * 集成主轴：协调 逻辑状态 / 渲染 / 动画队列 / 历史 / 还原检测。
 */
export class GameController {
  state: CubeState;
  readonly view: CubeView;
  readonly history = new History();
  private animator: TurnAnimator;
  private queue: MoveQueue;
  private timer = new Timer();

  /** 每个转动“逻辑完成”后触发（含还原检测结果）。 */
  onMoveApplied?: (info: MoveAppliedInfo) => void;
  /** 用户正式操作使魔方还原时触发，附本次成绩。 */
  onSolved?: (record: SolveRecord) => void;
  /** 动画队列清空时触发。 */
  onIdle?: () => void;
  /** 复位/重建后触发。 */
  onReset?: () => void;
  /** 阶数切换后触发（N 为新阶数），供外部重设相机取景。 */
  onSizeChanged?: (N: number) => void;
  /** 回放还原播放完成（魔方已回到已解）后触发。 */
  onSolveComplete?: () => void;
  /** 开始/结束“求解计算”时触发（用于“求解中…”指示）。 */
  onSolveStart?: () => void;
  onSolveEnd?: () => void;

  private pendingSolveReset = false;
  private solving = false;
  private isScrambling = false;

  constructor(scene: THREE.Scene, N: number, palette?: Palette) {
    this.state = createSolvedCube(N);
    this.view = new CubeView(scene, palette);
    this.view.build(this.state);
    this.animator = new TurnAnimator(this.view.group);
    this.queue = new MoveQueue(
      (move, dur, meta) => this.step(move, dur, meta),
      () => this.animator.abort(),
    );
    this.queue.onIdle = () => {
      this.isScrambling = false;
      if (this.pendingSolveReset) {
        this.pendingSolveReset = false;
        this.history.reset();
        this.timer.reset();
        this.onReset?.();
        this.onSolveComplete?.();
      }
      this.onIdle?.();
    };
  }

  tick(dt: number): void {
    this.animator.update(dt);
  }

  get busy(): boolean {
    return this.queue.busy || this.solving;
  }
  get N(): number {
    return this.state.N;
  }
  get solved(): boolean {
    return isSolved(this.state);
  }
  get playMoveCount(): number {
    return this.history.playMoveCount;
  }
  get canUndo(): boolean {
    return this.history.canUndo;
  }
  get canRedo(): boolean {
    return this.history.canRedo;
  }
  get hasScramble(): boolean {
    return this.history.hasScramble;
  }
  get scrambling(): boolean {
    return this.isScrambling;
  }
  get isTiming(): boolean {
    return this.timer.isRunning;
  }
  elapsedMs(): number {
    return this.timer.elapsed(performance.now());
  }
  set speedMs(v: number) {
    this.queue.speedMs = v;
  }
  get speedMs(): number {
    return this.queue.speedMs;
  }

  enqueue(moves: Move | Move[], opts?: { durationMs?: number; phase?: MovePhase }): void {
    const meta: MoveMeta = { phase: opts?.phase ?? 'internal' };
    this.queue.enqueue(moves, { durationMs: opts?.durationMs, meta });
  }

  /** 用户拖拽/键盘产生的一步（计入正式操作）。 */
  userTurn(move: Move): void {
    this.enqueue(move, { phase: 'play' });
  }

  /** 打乱：先即时复位到已解，再播放随机打乱序列。 */
  scramble(): void {
    if (this.busy) return;
    this.resetToSolved();
    this.isScrambling = true;
    const moves = generateScramble(this.state.N);
    this.enqueue(moves, { phase: 'scramble' });
  }

  /** 停止正在播放的打乱（中途暂停）。已完成的打乱步数保留。 */
  cancelScramble(): void {
    if (!this.isScrambling) return;
    this.queue.cancelAll();
    this.isScrambling = false;
    this.onIdle?.();
  }

  undo(): void {
    if (this.busy) return;
    const m = this.history.undo();
    if (m) this.enqueue(m, { phase: 'internal' });
  }

  redo(): void {
    if (this.busy) return;
    const m = this.history.redo();
    if (m) this.enqueue(m, { phase: 'internal' });
  }

  /**
   * 一键还原：3 阶优先用 Kociemba 求“短解”（带克隆验证），失败/非 3 阶回退到回放逆操作。
   * 任意情况下都保证回到已解。播放完成后清空历史。
   */
  async solve(durationMs?: number): Promise<void> {
    if (this.busy) return;
    const path = this.history.effectivePath();
    let solution: Move[] | null = null;
    if (this.state.N === 3 && path.length > 0) {
      this.solving = true;
      this.onSolveStart?.();
      try {
        solution = await solveKociemba3x3(this.state, path);
      } catch {
        solution = null;
      } finally {
        this.solving = false;
        this.onSolveEnd?.();
      }
    }
    if (!solution) solution = rewindSolve(path);
    if (solution.length === 0) return;
    this.pendingSolveReset = true;
    this.enqueue(solution, { phase: 'solve', durationMs });
  }

  /** 即时复位到已解魔方并清空历史。 */
  resetToSolved(): void {
    this.state = createSolvedCube(this.state.N);
    this.view.build(this.state);
    this.history.reset();
    this.timer.reset();
    this.onReset?.();
  }

  /** 切换阶数：重建为新阶的已解魔方并清空历史。 */
  setSize(N: number): void {
    if (this.busy || N === this.state.N) return;
    this.state = createSolvedCube(N);
    this.view.build(this.state);
    this.history.reset();
    this.timer.reset();
    this.onReset?.();
    this.onSizeChanged?.(N);
  }

  /** 从存档恢复：按 N 重建，回放历史到当前态。 */
  restoreFrom(N: number, snapshot: HistorySnapshot | null): void {
    this.state = createSolvedCube(N);
    if (snapshot) {
      this.history.restore(snapshot);
      applyMoves(this.state, this.history.effectivePath());
    } else {
      this.history.reset();
    }
    this.view.build(this.state);
    this.timer.reset();
    this.onReset?.();
    this.onSizeChanged?.(N);
  }

  // --- 拾取辅助 ---
  getRaycastTargets(): THREE.Object3D[] {
    return this.view.allCubieMeshes();
  }

  resolveCubiePos(obj: THREE.Object3D | null): [number, number, number] | null {
    let o = obj;
    while (o) {
      const id = o.userData?.['cubieId'];
      if (typeof id === 'number') {
        const c = this.state.cubies.find((cb) => cb.id === id);
        return c ? [c.pos[0], c.pos[1], c.pos[2]] : null;
      }
      o = o.parent;
    }
    return null;
  }

  private async step(move: Move, durationMs: number, meta: unknown): Promise<void> {
    const meshes: THREE.Object3D[] = [];
    for (const c of this.state.cubies) {
      if (move.layers.includes(c.pos[move.axis])) {
        const mesh = this.view.getCubieMesh(c.id);
        if (mesh) meshes.push(mesh);
      }
    }
    await this.animator.animate(move, meshes, durationMs);
    applyMove(this.state, move);

    const now = performance.now();
    const phase = (meta as MoveMeta | undefined)?.phase ?? 'internal';
    if (phase === 'scramble') {
      this.history.pushScramble(move);
    } else if (phase === 'play') {
      this.history.pushPlay(move);
      // 打乱之后的第一步正式操作启动计时。
      if (this.history.hasScramble && !this.timer.isRunning && this.timer.elapsed(now) === 0) {
        this.timer.start(now);
      }
    }

    const solved = isSolved(this.state);
    if (solved && phase === 'play') {
      this.timer.stop(now);
      this.onSolved?.({
        dateMs: Date.now(),
        N: this.state.N,
        timeMs: this.timer.elapsed(now),
        moves: this.history.playMoveCount,
      });
    }
    this.onMoveApplied?.({ move, phase, solved });
  }

  dispose(): void {
    this.view.dispose();
  }
}
