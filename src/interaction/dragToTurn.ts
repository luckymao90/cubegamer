import * as THREE from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Move } from '../cube/types';
import { inferMove } from './inferMove';

type Vec3 = [number, number, number];

export interface DragDeps {
  canvas: HTMLCanvasElement;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  /** 当前可拾取的 cubie 网格（groups）。 */
  getTargets(): THREE.Object3D[];
  /** 由被命中的对象解析其 cubie 的点阵坐标。 */
  resolveCubiePos(obj: THREE.Object3D): Vec3 | null;
  /** 是否正在播放动画（忙时不接受转面手势，仅允许环绕）。 */
  isBusy(): boolean;
  /** 用户拖拽得出的一次转动。 */
  onMove(move: Move): void;
}

interface Gesture {
  pointerId: number;
  startX: number;
  startY: number;
  nVec: Vec3;
  pos: Vec3;
  hitPoint: THREE.Vector3;
  committed: boolean;
}

function snapToAxis(v: THREE.Vector3): Vec3 {
  const ax = Math.abs(v.x);
  const ay = Math.abs(v.y);
  const az = Math.abs(v.z);
  if (ax >= ay && ax >= az) return [v.x >= 0 ? 1 : -1, 0, 0];
  if (ay >= az) return [0, v.y >= 0 ? 1 : -1, 0];
  return [0, 0, v.z >= 0 ? 1 : -1];
}

/**
 * 拖拽转面交互：
 * - 命中 cubie 且空闲 → 转面手势（捕获阶段抢先禁用 OrbitControls）。
 * - 未命中 / 忙碌 → 交给 OrbitControls 做相机环绕。
 * - 触摸/鼠标统一走 PointerEvent。
 */
export class DragController {
  private raycaster = new THREE.Raycaster();
  private gesture: Gesture | null = null;
  private readonly threshold = 9; // 像素

  constructor(private deps: DragDeps) {
    // 捕获阶段：在 OrbitControls 的冒泡监听之前决定是否禁用环绕。
    deps.canvas.addEventListener('pointerdown', this.onDown, true);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('pointercancel', this.onUp);
  }

  dispose(): void {
    this.deps.canvas.removeEventListener('pointerdown', this.onDown, true);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('pointercancel', this.onUp);
  }

  private toNdc(clientX: number, clientY: number): THREE.Vector2 {
    const r = this.deps.canvas.getBoundingClientRect();
    return new THREE.Vector2(
      ((clientX - r.left) / r.width) * 2 - 1,
      -((clientY - r.top) / r.height) * 2 + 1,
    );
  }

  private hitTest(clientX: number, clientY: number): Omit<Gesture, 'pointerId' | 'startX' | 'startY' | 'committed'> | null {
    this.raycaster.setFromCamera(this.toNdc(clientX, clientY), this.deps.camera);
    const hits = this.raycaster.intersectObjects(this.deps.getTargets(), true);
    const hit = hits.find((h) => h.face);
    if (!hit || !hit.face) return null;
    const pos = this.deps.resolveCubiePos(hit.object);
    if (!pos) return null;
    const nWorld = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
    return { nVec: snapToAxis(nWorld), pos, hitPoint: hit.point.clone() };
  }

  private onDown = (e: PointerEvent): void => {
    if (this.gesture) return; // 已有手势（多指）→ 交给 controls
    if (this.deps.isBusy()) return; // 动画中 → 仅允许环绕
    const hit = this.hitTest(e.clientX, e.clientY);
    if (!hit) return; // 未命中 → 环绕
    this.deps.controls.enabled = false; // 抢先禁用，避免本次手势触发环绕
    this.gesture = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      committed: false,
      ...hit,
    };
  };

  private onPointerMove = (e: PointerEvent): void => {
    const g = this.gesture;
    if (!g || e.pointerId !== g.pointerId || g.committed) return;
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    if (Math.hypot(dx, dy) < this.threshold) return;
    const tangent = this.computeTangent(g, dx, dy);
    if (!tangent) return;
    g.committed = true;
    this.deps.onMove(inferMove(g.nVec, tangent, g.pos));
  };

  private onUp = (e: PointerEvent): void => {
    if (!this.gesture || e.pointerId !== this.gesture.pointerId) return;
    this.gesture = null;
    this.deps.controls.enabled = true;
  };

  /** 把屏幕拖拽向量分解到面内两轴，取主导轴作为切向（带符号）。 */
  private computeTangent(g: Gesture, dx: number, dy: number): Vec3 | null {
    const nAxis = g.nVec.findIndex((v) => v !== 0);
    let best: { axis: number; sign: 1 | -1 } | null = null;
    let bestAbs = 0;
    for (let c = 0; c < 3; c++) {
      if (c === nAxis) continue;
      const dir = new THREE.Vector3(c === 0 ? 1 : 0, c === 1 ? 1 : 0, c === 2 ? 1 : 0);
      const sd = this.worldDirToScreen(g.hitPoint, dir);
      const dot = dx * sd.x + dy * sd.y;
      if (Math.abs(dot) > bestAbs) {
        bestAbs = Math.abs(dot);
        best = { axis: c, sign: dot >= 0 ? 1 : -1 };
      }
    }
    if (!best) return null;
    const t: Vec3 = [0, 0, 0];
    t[best.axis] = best.sign;
    return t;
  }

  /** 世界方向 → 屏幕像素方向（y 向下），仅用于方向比较。 */
  private worldDirToScreen(point: THREE.Vector3, dir: THREE.Vector3): THREE.Vector2 {
    const cam = this.deps.camera;
    const p0 = point.clone().project(cam);
    const p1 = point.clone().add(dir).project(cam);
    const r = this.deps.canvas.getBoundingClientRect();
    return new THREE.Vector2((p1.x - p0.x) * 0.5 * r.width, -(p1.y - p0.y) * 0.5 * r.height);
  }
}
