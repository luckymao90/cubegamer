import * as THREE from 'three';
import type { CubeState } from '../cube/types';
import { latticeToWorld } from '../cube/permutation';
import {
  createCubieGroup,
  createMaterials,
  DEFAULT_PALETTE,
  type CubeMaterials,
  type Palette,
} from './cubieFactory';

/**
 * 负责把 CubeState 渲染为 Three.js 网格。
 * 持有 cubieId -> 组 的映射，供动画与拾取使用。
 */
export class CubeView {
  readonly group = new THREE.Group();
  private materials: CubeMaterials;
  private cubieMeshes = new Map<number, THREE.Group>();

  constructor(
    private scene: THREE.Scene,
    palette: Palette = DEFAULT_PALETTE,
  ) {
    this.materials = createMaterials(palette);
    this.scene.add(this.group);
  }

  /** 按状态重建全部 cubie 网格。 */
  build(state: CubeState): void {
    this.clearMeshes();
    for (const cubie of state.cubies) {
      const g = createCubieGroup(cubie, this.materials);
      const [x, y, z] = latticeToWorld(cubie.pos);
      g.position.set(x, y, z);
      this.group.add(g);
      this.cubieMeshes.set(cubie.id, g);
    }
  }

  getCubieMesh(id: number): THREE.Group | undefined {
    return this.cubieMeshes.get(id);
  }

  allCubieMeshes(): THREE.Group[] {
    return [...this.cubieMeshes.values()];
  }

  applyPalette(p: Palette): void {
    this.materials.applyPalette(p);
  }

  private clearMeshes(): void {
    for (const m of this.cubieMeshes.values()) this.group.remove(m);
    this.cubieMeshes.clear();
  }

  dispose(): void {
    this.clearMeshes();
    this.scene.remove(this.group);
    this.materials.dispose();
  }
}
