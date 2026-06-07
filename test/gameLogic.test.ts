import { describe, it, expect } from 'vitest';
import { Timer, formatTime } from '../src/game/Timer';
import { History } from '../src/game/History';
import { invertMove } from '../src/cube/moves';
import { faceMove } from '../src/cube/notation';
import type { Move } from '../src/cube/types';

describe('Timer', () => {
  it('start/stop/elapsed/reset', () => {
    const t = new Timer();
    expect(t.elapsed(0)).toBe(0);
    t.start(1000);
    expect(t.isRunning).toBe(true);
    expect(t.elapsed(1500)).toBe(500);
    t.stop(2000);
    expect(t.isRunning).toBe(false);
    expect(t.elapsed(9999)).toBe(1000);
    t.reset();
    expect(t.elapsed(5000)).toBe(0);
  });

  it('formatTime', () => {
    expect(formatTime(0)).toBe('0.00');
    expect(formatTime(1500)).toBe('1.50');
    expect(formatTime(1234)).toBe('1.23');
    expect(formatTime(65000)).toBe('1:05.00');
  });
});

describe('History 撤销/重做与边界', () => {
  const s1: Move = { axis: 0, layers: [2], dir: 1 };
  const s2: Move = { axis: 1, layers: [2], dir: 1 };
  const p1: Move = { axis: 2, layers: [2], dir: 1 };
  const p2: Move = { axis: 0, layers: [-2], dir: -1 };

  it('打乱不可撤销；正式操作可撤销/重做；不越界', () => {
    const h = new History();
    h.pushScramble(s1);
    h.pushScramble(s2);
    expect(h.canUndo).toBe(false); // 处于打乱边界
    h.pushPlay(p1);
    expect(h.playMoveCount).toBe(1);
    expect(h.canUndo).toBe(true);

    expect(h.undo()).toEqual(invertMove(p1));
    expect(h.playMoveCount).toBe(0);
    expect(h.canUndo).toBe(false); // 不能撤销进打乱
    expect(h.canRedo).toBe(true);
    expect(h.redo()).toEqual(p1);

    h.undo();
    h.pushPlay(p2); // 截断 redo 尾
    expect(h.canRedo).toBe(false);
    expect(h.effectivePath()).toEqual([s1, s2, p2]);
  });
});

describe('faceMove 记号映射', () => {
  it('外层面轴/层正确，prime 反向', () => {
    expect(faceMove('R', 3)).toMatchObject({ axis: 0, layers: [2] });
    expect(faceMove('L', 3)).toMatchObject({ axis: 0, layers: [-2] });
    expect(faceMove('U', 4)).toMatchObject({ axis: 1, layers: [3] });
    expect(faceMove('D', 5)).toMatchObject({ axis: 1, layers: [-4] });
    const f = faceMove('F', 3);
    const fp = faceMove('F', 3, true);
    expect(fp.dir).toBe((-f.dir) as Move['dir']);
  });
});
