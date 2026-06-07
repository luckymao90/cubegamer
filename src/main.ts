import './styles/tokens.css';
import './styles/main.css';
import { createScene } from './render/scene';
import { GameController } from './game/GameController';
import { DragController } from './interaction/dragToTurn';
import { KeyboardController } from './interaction/keyboard';
import { formatTime } from './game/Timer';
import { warmKociemba } from './solve/kociemba';
import { computeStats } from './game/Stats';
import { faceMove, ALL_FACES } from './cube/notation';
import { THEMES, themeById, applyTheme } from './ui/themes';
import { TRIVIA } from './content/trivia';
import { loadSave, writeSave, debounce, SAVE_SCHEMA } from './persistence/storage';
import type { SolveRecord } from './cube/types';

// ── bootstrap ────────────────────────────────────────────────────────────────
const canvas = document.getElementById('cube-canvas') as HTMLCanvasElement;
const ctx = createScene(canvas);
const save = loadSave();
const initN = save?.settings?.N ?? 3;
const initThemeId = save?.settings?.themeId ?? 'dark';
const initSpeed = save?.settings?.speedMs ?? 200;

const game = new GameController(ctx.scene, initN);
game.speedMs = initSpeed;

// 从存档恢复（或全新开始）
if (save?.history) {
  try {
    game.restoreFrom(initN, save.history);
  } catch {
    game.restoreFrom(initN, null);
  }
}

ctx.frameCube(initN);
ctx.onFrame((dt) => game.tick(dt));
warmKociemba();

// ── 持久化 ────────────────────────────────────────────────────────────────────
let solveRecords: SolveRecord[] = save?.stats ?? [];
const saveGame = debounce(() => {
  writeSave({
    schemaVersion: SAVE_SCHEMA,
    settings: { N: game.N, themeId: currentThemeId, speedMs: game.speedMs },
    history: game.history.snapshot(),
    stats: solveRecords,
  });
}, 400);

// ── 主题 ──────────────────────────────────────────────────────────────────────
let currentThemeId = initThemeId;
function setTheme(id: string) {
  currentThemeId = id;
  applyTheme(themeById(id), game.view);
}
setTheme(currentThemeId);

// ── DOM refs ─────────────────────────────────────────────────────────────────
const timeEl = document.getElementById('time')!;
const movesEl = document.getElementById('moves')!;
const stBest = document.getElementById('st-best')!;
const stLast = document.getElementById('st-last')!;
const stAo5 = document.getElementById('st-ao5')!;
const stAo12 = document.getElementById('st-ao12')!;
const toast = document.getElementById('toast')!;
const solvingEl = document.getElementById('solving')!;
const sizeSeg = document.getElementById('size-seg')!;
const triviaModal = document.getElementById('trivia-modal')!;
const tvTitle = document.getElementById('tv-title')!;
const tvText = document.getElementById('tv-text')!;
const tvCount = document.getElementById('tv-count')!;
const btnScramble = document.getElementById('btn-scramble') as HTMLButtonElement;
const btnSolve = document.getElementById('btn-solve') as HTMLButtonElement;
const btnReset = document.getElementById('btn-reset') as HTMLButtonElement;
const btnUndo = document.getElementById('btn-undo') as HTMLButtonElement;
const btnRedo = document.getElementById('btn-redo') as HTMLButtonElement;
const speedInput = document.getElementById('speed') as HTMLInputElement;

// ── 速度滑块 ──────────────────────────────────────────────────────────────────
// slider 1(慢)→10(快) → durationMs 400→50
function speedToDuration(v: number) { return Math.round(400 - (v - 1) * (350 / 9)); }
function durationToSpeed(ms: number) { return Math.round(1 + (400 - ms) * (9 / 350)); }
speedInput.value = String(durationToSpeed(initSpeed));
speedInput.addEventListener('input', () => {
  game.speedMs = speedToDuration(Number(speedInput.value));
  saveGame();
});

// ── 阶数分段控件 ──────────────────────────────────────────────────────────────
const sizeBtns: HTMLButtonElement[] = [];
for (const n of [3, 4, 5]) {
  const b = document.createElement('button');
  b.textContent = `${n}阶`;
  b.setAttribute('role', 'tab');
  b.onclick = () => { game.setSize(n); updateSeg(); };
  sizeSeg.appendChild(b);
  sizeBtns.push(b);
}
function updateSeg() {
  sizeBtns.forEach((b, i) => b.classList.toggle('active', [3,4,5][i] === game.N));
}
updateSeg();

// ── HUD 刷新 ──────────────────────────────────────────────────────────────────
function fmt(ms: number | null) { return ms == null ? '—' : formatTime(ms); }
function refreshStats() {
  const s = computeStats(solveRecords, game.N);
  stBest.textContent = fmt(s.best);
  stLast.textContent = fmt(s.last);
  stAo5.textContent = fmt(s.ao5);
  stAo12.textContent = fmt(s.ao12);
}
function refreshHud() {
  movesEl.textContent = String(game.playMoveCount);
  btnUndo.disabled = !game.canUndo;
  btnRedo.disabled = !game.canRedo;
  btnScramble.disabled = game.busy;
  btnSolve.disabled = game.busy || !game.hasScramble;
  saveGame();
}
refreshHud();
refreshStats();

// 计时器每帧刷新
ctx.onFrame(() => { timeEl.textContent = formatTime(game.elapsedMs()); });

function updateScrambleBtn() {
  if (game.scrambling) {
    btnScramble.textContent = '停止打乱';
    btnScramble.classList.add('danger');
  } else {
    btnScramble.textContent = '打乱';
    btnScramble.classList.remove('danger');
  }
}

// ── toast / 求解中 ────────────────────────────────────────────────────────────
let toastTimer = 0;
function showToast(msg: string) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 1800);
}

// ── 游戏回调 ──────────────────────────────────────────────────────────────────
game.onMoveApplied = () => { refreshHud(); updateScrambleBtn(); };
game.onReset = () => { refreshHud(); refreshStats(); updateSeg(); updateScrambleBtn(); };
game.onSizeChanged = (n) => { ctx.frameCube(n); updateSeg(); buildTurnButtons(); };
game.onSolved = (record) => {
  solveRecords.push(record);
  refreshStats();
  showToast('已还原 🎉');
  saveGame();
};
game.onSolveComplete = () => { showToast('已还原 🎉'); refreshHud(); };
game.onSolveStart = () => solvingEl.classList.add('show');
game.onSolveEnd = () => solvingEl.classList.remove('show');
game.onIdle = () => updateScrambleBtn();

// ── 按钮 ──────────────────────────────────────────────────────────────────────
btnScramble.onclick = () => {
  if (game.scrambling) game.cancelScramble();
  else game.scramble();
};
btnSolve.onclick = () => { void game.solve(150); };
btnReset.onclick = () => game.resetToSolved();
btnUndo.onclick = () => game.undo();
btnRedo.onclick = () => game.redo();

// 面转动按键（U R F D L B / 逆时针）
const turnRow = document.getElementById('turn-row')!;
function buildTurnButtons() {
  turnRow.innerHTML = '';
  for (const face of ALL_FACES) {
    const pair = document.createElement('span');
    pair.className = 'turn-pair';
    const cw = document.createElement('button');
    cw.className = 'turn-btn cw';
    cw.textContent = face;
    cw.title = `${face} 顺时针`;
    cw.onclick = () => game.userTurn(faceMove(face, game.N));
    const ccw = document.createElement('button');
    ccw.className = 'turn-btn ccw';
    ccw.textContent = `${face}'`;
    ccw.title = `${face} 逆时针`;
    ccw.onclick = () => game.userTurn(faceMove(face, game.N, true));
    pair.append(cw, ccw);
    turnRow.appendChild(pair);
  }
}
buildTurnButtons();

document.getElementById('theme-btn')!.onclick = () => {
  const idx = THEMES.findIndex(t => t.id === currentThemeId);
  setTheme(THEMES[(idx + 1) % THEMES.length].id);
  saveGame();
};

// ── 交互 ─────────────────────────────────────────────────────────────────────
new DragController({
  canvas,
  camera: ctx.camera,
  controls: ctx.controls,
  getTargets: () => game.getRaycastTargets(),
  resolveCubiePos: (o) => game.resolveCubiePos(o),
  isBusy: () => game.busy,
  onMove: (m) => game.userTurn(m),
});
new KeyboardController({
  getN: () => game.N,
  isBusy: () => game.busy,
  onMove: (m) => game.userTurn(m),
});

// ── 小知识弹窗 ────────────────────────────────────────────────────────────────
let tvIdx = 0;
function showTrivia(i: number) {
  tvIdx = ((i % TRIVIA.length) + TRIVIA.length) % TRIVIA.length;
  tvTitle.textContent = TRIVIA[tvIdx].title;
  tvText.textContent = TRIVIA[tvIdx].text;
  tvCount.textContent = `${tvIdx + 1} / ${TRIVIA.length}`;
}
showTrivia(Math.floor(Math.random() * TRIVIA.length));
document.getElementById('trivia-btn')!.onclick = () => triviaModal.classList.remove('hidden');
document.getElementById('trivia-close')!.onclick = () => triviaModal.classList.add('hidden');
triviaModal.addEventListener('click', (e) => { if (e.target === triviaModal) triviaModal.classList.add('hidden'); });
document.getElementById('tv-prev')!.onclick = () => showTrivia(tvIdx - 1);
document.getElementById('tv-next')!.onclick = () => showTrivia(tvIdx + 1);
