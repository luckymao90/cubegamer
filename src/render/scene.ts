import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/** 场景上下文：封装 renderer / camera / 灯光 / 控制器 / 渲染循环。 */
export interface SceneContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  /** 注册每帧回调 (dt 秒)，返回取消函数。 */
  onFrame(cb: (dt: number) => void): () => void;
  /** 根据阶数 N 调整相机距离与地面阴影位置。 */
  frameCube(N: number): void;
  dispose(): void;
}

export function createScene(canvas: HTMLCanvasElement): SceneContext {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);

  const ambient = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xffffff, 1.05);
  key.position.set(6, 11, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 60;
  const ext = 12;
  key.shadow.camera.left = -ext;
  key.shadow.camera.right = ext;
  key.shadow.camera.top = ext;
  key.shadow.camera.bottom = -ext;
  key.shadow.bias = -0.0005;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 0.35);
  fill.position.set(-8, 4, -6);
  scene.add(fill);

  // 柔和接触阴影地面
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.ShadowMaterial({ opacity: 0.14 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -3;
  ground.receiveShadow = true;
  scene.add(ground);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.12;
  controls.enablePan = false;
  controls.rotateSpeed = 0.9;

  const frameCallbacks = new Set<(dt: number) => void>();

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  function frameCube(N: number) {
    const H = N / 2 + 0.5;
    const fov = (camera.fov * Math.PI) / 180;
    const dist = (H / Math.tan(fov / 2)) * 1.35;
    const dirv = new THREE.Vector3(1, 0.82, 1.15).normalize();
    camera.position.copy(dirv.multiplyScalar(dist));
    camera.updateProjectionMatrix();
    controls.target.set(0, 0, 0);
    controls.minDistance = dist * 0.5;
    controls.maxDistance = dist * 2.4;
    ground.position.y = -(N / 2 + 0.3);
    controls.update();
  }

  const clock = new THREE.Clock();
  let running = true;
  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    const dt = clock.getDelta();
    for (const cb of frameCallbacks) cb(dt);
    controls.update();
    renderer.render(scene, camera);
  }

  resize();
  frameCube(3);
  loop();

  return {
    scene,
    camera,
    renderer,
    controls,
    onFrame(cb) {
      frameCallbacks.add(cb);
      return () => frameCallbacks.delete(cb);
    },
    frameCube,
    dispose() {
      running = false;
      window.removeEventListener('resize', resize);
      controls.dispose();
      renderer.dispose();
    },
  };
}
