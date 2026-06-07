import type { Move } from '../cube/types';
import { faceMove, type Face } from '../cube/notation';

export interface KeyboardDeps {
  getN(): number;
  isBusy(): boolean;
  onMove(move: Move): void;
}

const KEY_FACE: Record<string, Face> = {
  r: 'R',
  l: 'L',
  u: 'U',
  d: 'D',
  f: 'F',
  b: 'B',
};

/**
 * 键盘记号操作：r/u/f/l/d/b = 外层顺时针；按住 Shift = 逆时针。
 * （内层/宽层走拖拽；v1 键盘仅外层。）
 */
export class KeyboardController {
  constructor(private deps: KeyboardDeps) {
    window.addEventListener('keydown', this.onKey);
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKey);
  }

  private onKey = (e: KeyboardEvent): void => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
    const face = KEY_FACE[e.key.toLowerCase()];
    if (!face) return;
    if (this.deps.isBusy()) return;
    e.preventDefault();
    this.deps.onMove(faceMove(face, this.deps.getN(), e.shiftKey));
  };
}
