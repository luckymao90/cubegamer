import * as THREE from 'three';
import type { Axis, Move } from '../cube/types';

const AXIS_VEC: readonly THREE.Vector3[] = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, 0, 1),
];

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** 把世界坐标分量吸附到最近的 0.5 倍数（点阵世界坐标恒为 0.5 的整数倍）。 */
function snap05(v: number): number {
  return Math.round(v * 2) / 2;
}

/** 24 个立方体朝向四元数的符号规范化键，用于去重。 */
function quatKey(q: THREE.Quaternion): string {
  let sign = 1;
  for (const c of [q.w, q.x, q.y, q.z]) {
    if (Math.abs(c) > 1e-6) {
      sign = c < 0 ? -1 : 1;
      break;
    }
  }
  const r = (v: number) => Math.round(v * sign * 1000) / 1000;
  return `${r(q.x)},${r(q.y)},${r(q.z)},${r(q.w)}`;
}

/** 生成立方体旋转群的 24 个朝向四元数。 */
function generate24(): THREE.Quaternion[] {
  const gens = [
    new THREE.Quaternion().setFromAxisAngle(AXIS_VEC[0], Math.PI / 2),
    new THREE.Quaternion().setFromAxisAngle(AXIS_VEC[1], Math.PI / 2),
  ];
  const out: THREE.Quaternion[] = [];
  const seen = new Set<string>();
  const start = new THREE.Quaternion();
  out.push(start);
  seen.add(quatKey(start));
  const stack = [start];
  while (stack.length) {
    const q = stack.pop()!;
    for (const g of gens) {
      const r = q.clone().premultiply(g);
      const k = quatKey(r);
      if (!seen.has(k)) {
        seen.add(k);
        out.push(r);
        stack.push(r);
      }
    }
  }
  return out;
}

interface ActiveTurn {
  pivot: THREE.Group;
  meshes: THREE.Object3D[];
  axis: Axis;
  target: number;
  duration: number;
  elapsed: number;
  resolve: () => void;
}

/**
 * 转面动画：枢轴 reparent → 动画 90° → 烘焙回写 → 吸附（位置到点阵、朝向到 24 朝向）。
 * 仅做视觉；逻辑状态由调用方用 applyMove 独立更新。两者都精确，故不会漂移。
 */
export class TurnAnimator {
  private active: ActiveTurn | null = null;
  private readonly orientations = generate24();

  /** container 应为 CubeView.group（保持在原点、单位变换）。 */
  constructor(private container: THREE.Object3D) {}

  get busy(): boolean {
    return this.active !== null;
  }

  /** 立即结束当前动画（烘焙回写 + 吸附），用于暂停/取消。 */
  abort(): void {
    if (this.active) this.finish();
  }

  /** 物理旋转给定网格 dir*90°，返回动画完成的 Promise。 */
  animate(move: Move, meshes: THREE.Object3D[], durationMs: number): Promise<void> {
    if (this.active) throw new Error('TurnAnimator 正忙');
    return new Promise<void>((resolve) => {
      const pivot = new THREE.Group();
      this.container.add(pivot);
      this.container.updateMatrixWorld(true);
      for (const m of meshes) pivot.attach(m);
      this.active = {
        pivot,
        meshes,
        axis: move.axis,
        target: move.dir * (Math.PI / 2),
        duration: Math.max(1, durationMs),
        elapsed: 0,
        resolve,
      };
      if (durationMs <= 0) this.finish();
    });
  }

  update(dtSeconds: number): void {
    const a = this.active;
    if (!a) return;
    a.elapsed += dtSeconds * 1000;
    const t = Math.min(1, a.elapsed / a.duration);
    a.pivot.quaternion.setFromAxisAngle(AXIS_VEC[a.axis], a.target * easeInOutQuad(t));
    if (t >= 1) this.finish();
  }

  private finish(): void {
    const a = this.active!;
    a.pivot.quaternion.setFromAxisAngle(AXIS_VEC[a.axis], a.target);
    a.pivot.updateMatrixWorld(true);
    for (const m of a.meshes) {
      this.container.attach(m); // 烘焙世界变换回写到 container 局部坐标
      m.position.set(snap05(m.position.x), snap05(m.position.y), snap05(m.position.z));
      this.snapOrientation(m);
    }
    this.container.remove(a.pivot);
    this.active = null;
    a.resolve();
  }

  private snapOrientation(obj: THREE.Object3D): void {
    let best = this.orientations[0];
    let bestDot = -1;
    for (const o of this.orientations) {
      const d = Math.abs(obj.quaternion.dot(o));
      if (d > bestDot) {
        bestDot = d;
        best = o;
      }
    }
    obj.quaternion.copy(best);
  }
}
