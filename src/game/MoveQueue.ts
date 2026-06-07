import type { Move } from '../cube/types';

interface QueueItem {
  move: Move;
  duration: number;
  meta: unknown;
}

export interface EnqueueOptions {
  durationMs?: number;
  meta?: unknown;
}

/**
 * 串行动画队列：一次只跑一个转动，其余排队。
 * step 回调负责“选层 + 动画 + 更新逻辑 + 回调”，本类只管串行与忙碌状态。
 * meta 透传给 step（用于区分打乱/正式/内部等阶段）。
 */
export class MoveQueue {
  private items: QueueItem[] = [];
  private running = false;
  speedMs = 200;

  /** 当队列从“有任务”变为“全部完成”时触发。 */
  onIdle?: () => void;

  constructor(private step: (move: Move, durationMs: number, meta: unknown) => Promise<void>) {}

  get busy(): boolean {
    return this.running || this.items.length > 0;
  }

  get pending(): number {
    return this.items.length;
  }

  enqueue(moves: Move | Move[], opts?: EnqueueOptions): void {
    const dur = opts?.durationMs ?? this.speedMs;
    const arr = Array.isArray(moves) ? moves : [moves];
    for (const m of arr) this.items.push({ move: m, duration: dur, meta: opts?.meta });
    void this.drain();
  }

  clearPending(): void {
    this.items = [];
  }

  private async drain(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      while (this.items.length) {
        const item = this.items.shift()!;
        await this.step(item.move, item.duration, item.meta);
      }
    } finally {
      this.running = false;
    }
    this.onIdle?.();
  }
}
