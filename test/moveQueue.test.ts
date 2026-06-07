import { describe, it, expect } from 'vitest';
import { MoveQueue } from '../src/game/MoveQueue';
import type { Move } from '../src/cube/types';

const M: Move = { axis: 0, layers: [2], dir: 1 };

describe('MoveQueue 串行化', () => {
  it('按顺序逐个执行，不重叠', async () => {
    const order: number[] = [];
    let active = 0;
    let maxActive = 0;
    let counter = 0;
    const q = new MoveQueue(async (_move) => {
      active++;
      maxActive = Math.max(maxActive, active);
      const id = counter++;
      await new Promise((r) => setTimeout(r, 5));
      order.push(id);
      active--;
    });
    q.enqueue([M, M, M]);
    q.enqueue(M);
    await new Promise<void>((resolve) => {
      q.onIdle = resolve;
    });
    expect(order).toEqual([0, 1, 2, 3]);
    expect(maxActive).toBe(1); // 任意时刻只有一步在跑
    expect(q.busy).toBe(false);
  });

  it('busy 状态正确', async () => {
    const q = new MoveQueue(async () => {
      await new Promise((r) => setTimeout(r, 5));
    });
    expect(q.busy).toBe(false);
    q.enqueue(M);
    expect(q.busy).toBe(true);
    await new Promise<void>((resolve) => {
      q.onIdle = resolve;
    });
    expect(q.busy).toBe(false);
  });
});
