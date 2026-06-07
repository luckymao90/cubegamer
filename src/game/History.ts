import type { HistoryEntry, Move } from '../cube/types';
import { invertMove } from '../cube/moves';

export interface HistorySnapshot {
  entries: HistoryEntry[];
  cursor: number;
  scrambleBoundary: number;
}

/**
 * 一份历史驱动：打乱（不可变初始）+ 正式操作 + 撤销/重做游标 + 回放路径。
 * - cursor：最后“已应用”的条目下标。
 * - scrambleBoundary：打乱区间的末尾下标（撤销不可越过它）。
 */
export class History {
  private entries: HistoryEntry[] = [];
  private cursor = -1;
  private boundary = -1;

  reset(): void {
    this.entries = [];
    this.cursor = -1;
    this.boundary = -1;
  }

  pushScramble(move: Move): void {
    this.entries.push({ move, phase: 'scramble' });
    this.cursor++;
    this.boundary = this.cursor;
  }

  pushPlay(move: Move): void {
    this.entries.length = this.cursor + 1; // 截断 redo 尾
    this.entries.push({ move, phase: 'play' });
    this.cursor++;
  }

  get canUndo(): boolean {
    return this.cursor > this.boundary;
  }
  get canRedo(): boolean {
    return this.cursor < this.entries.length - 1;
  }

  /** 返回应执行的“逆转动”并回退游标（保留条目以便重做）。 */
  undo(): Move | null {
    if (!this.canUndo) return null;
    const m = this.entries[this.cursor].move;
    this.cursor--;
    return invertMove(m);
  }

  /** 返回应执行的转动并前进游标。 */
  redo(): Move | null {
    if (!this.canRedo) return null;
    this.cursor++;
    return this.entries[this.cursor].move;
  }

  /** 当前生效路径（打乱 + 到 cursor 的正式操作），供回放还原。 */
  effectivePath(): Move[] {
    return this.entries.slice(0, this.cursor + 1).map((e) => e.move);
  }

  /** 正式阶段净步数。 */
  get playMoveCount(): number {
    return this.cursor - this.boundary;
  }

  get hasScramble(): boolean {
    return this.boundary >= 0;
  }

  get isAtSolvedStart(): boolean {
    return this.cursor < 0;
  }

  snapshot(): HistorySnapshot {
    return {
      entries: this.entries.map((e) => ({
        move: { axis: e.move.axis, layers: [...e.move.layers], dir: e.move.dir },
        phase: e.phase,
      })),
      cursor: this.cursor,
      scrambleBoundary: this.boundary,
    };
  }

  restore(s: HistorySnapshot): void {
    this.entries = s.entries.map((e) => ({
      move: { axis: e.move.axis, layers: [...e.move.layers], dir: e.move.dir },
      phase: e.phase,
    }));
    this.cursor = s.cursor;
    this.boundary = s.scrambleBoundary;
  }
}
