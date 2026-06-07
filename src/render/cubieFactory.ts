import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { CubieState, DirKey } from '../cube/types';
import { Color } from '../cube/types';

/** 每种颜色对应的十六进制色值。 */
export type Palette = Record<Color, number>;

export const ALL_COLORS: readonly Color[] = [
  Color.U,
  Color.R,
  Color.F,
  Color.D,
  Color.L,
  Color.B,
];

/** 默认经典配色（与 tokens.css 的 --cube-* 对应）。 */
export const DEFAULT_PALETTE: Palette = {
  [Color.U]: 0xffffff,
  [Color.R]: 0xc41e3a,
  [Color.F]: 0x00a651,
  [Color.D]: 0xfdd835,
  [Color.L]: 0xff8c1a,
  [Color.B]: 0x0051ba,
};

const BODY = 0.95; // 小方块本体边长（世界单位，中心间距 1.0）
const HALF = BODY / 2;
const STICKER = 0.82; // 贴纸边长
const STICKER_OFF = HALF + 0.002; // 贴纸略微凸出表面

export interface CubeMaterials {
  body: THREE.MeshLambertMaterial;
  stickers: Record<Color, THREE.MeshLambertMaterial>;
  applyPalette(p: Palette): void;
  dispose(): void;
}

export function createMaterials(palette: Palette = DEFAULT_PALETTE): CubeMaterials {
  const body = new THREE.MeshLambertMaterial({ color: 0x161616 });
  const stickers = {} as Record<Color, THREE.MeshLambertMaterial>;
  for (const c of ALL_COLORS) {
    stickers[c] = new THREE.MeshLambertMaterial({ color: palette[c] });
  }
  return {
    body,
    stickers,
    applyPalette(p: Palette) {
      for (const c of ALL_COLORS) stickers[c].color.setHex(p[c]);
    },
    dispose() {
      body.dispose();
      for (const c of ALL_COLORS) stickers[c].dispose();
    },
  };
}

// 共享几何（整个 app 仅各一份）
let bodyGeo: RoundedBoxGeometry | null = null;
let stickerGeo: THREE.PlaneGeometry | null = null;
function getBodyGeo(): RoundedBoxGeometry {
  if (!bodyGeo) bodyGeo = new RoundedBoxGeometry(BODY, BODY, BODY, 3, 0.08);
  return bodyGeo;
}
function getStickerGeo(): THREE.PlaneGeometry {
  if (!stickerGeo) stickerGeo = new THREE.PlaneGeometry(STICKER, STICKER);
  return stickerGeo;
}

const STICKER_TRANSFORM: Record<DirKey, (m: THREE.Mesh) => void> = {
  '+x': (m) => {
    m.position.set(STICKER_OFF, 0, 0);
    m.rotation.y = Math.PI / 2;
  },
  '-x': (m) => {
    m.position.set(-STICKER_OFF, 0, 0);
    m.rotation.y = -Math.PI / 2;
  },
  '+y': (m) => {
    m.position.set(0, STICKER_OFF, 0);
    m.rotation.x = -Math.PI / 2;
  },
  '-y': (m) => {
    m.position.set(0, -STICKER_OFF, 0);
    m.rotation.x = Math.PI / 2;
  },
  '+z': (m) => {
    m.position.set(0, 0, STICKER_OFF);
  },
  '-z': (m) => {
    m.position.set(0, 0, -STICKER_OFF);
    m.rotation.y = Math.PI;
  },
};

/** 创建一个 cubie 组（本体 + 外露贴纸）。位置由调用方设置。 */
export function createCubieGroup(cubie: CubieState, mats: CubeMaterials): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(getBodyGeo(), mats.body);
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);
  for (const key of Object.keys(cubie.stickers) as DirKey[]) {
    const color = cubie.stickers[key]!;
    const s = new THREE.Mesh(getStickerGeo(), mats.stickers[color]);
    STICKER_TRANSFORM[key](s);
    g.add(s);
  }
  g.userData.cubieId = cubie.id;
  return g;
}

export function disposeSharedGeometries(): void {
  bodyGeo?.dispose();
  bodyGeo = null;
  stickerGeo?.dispose();
  stickerGeo = null;
}
