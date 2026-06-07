<p align="center">
  <h1 align="center">🧩 魔方游戏 · CubeMaster</h1>
  <p align="center">支持 2×2 / 3×3 / 4×4 / 5×5 的交互式魔方游戏<br>Interactive NxN Rubik's Cube Game</p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.6-blue" alt="TS">
  <img src="https://img.shields.io/badge/Three.js-0.169-green" alt="Three.js">
  <img src="https://img.shields.io/badge/license-MIT-brightgreen" alt="MIT">
  <img src="https://img.shields.io/badge/tests-25%20passed-success" alt="tests">
</p>

<p align="center">
  <a href="https://luckymao90.github.io/cubegamer/">🔗 在线体验 · Play Online</a>
</p>

---

[English](#english) | [中文](#中文)

---

## English

### Features

- **4 Cube Sizes** — 2×2 (Pocket Cube), 3×3 (Rubik's Cube), 4×4 (Rubik's Revenge), 5×5 (Professor's Cube)
- **Interactive Turning** — Drag faces to turn, drag empty space to orbit camera
- **One-Click Solve** — 3×3 uses Kociemba algorithm (short solution), 4×4/5×5 uses rewind-inverse (guaranteed correct)
- **Scramble & Reset** — Auto-generate scrambles with inner layers; pause/cancel scramble anytime
- **Timer & Stats** — Timer starts on first play move, stops on solved; tracks best / last / ao5 / ao12
- **Undo / Redo** — Full move history with scramble boundary protection
- **Keyboard Controls** — `R` `U` `F` `L` `D` `B` (hold `Shift` to reverse)
- **Visual Turn Buttons** — Clickable face-turn buttons on screen for touch/mobile
- **3 Themes** — Dark (default), Classic light, High-contrast
- **Cube Trivia** — Fun facts about Rubik's Cube history and speedcubing
- **Save & Restore** — localStorage persistence (state + settings + stats)
- **Responsive** — Mobile touch support, adapts to narrow screens
- **MIT Licensed** — Zero GPL dependencies

### Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript (strict) |
| 3D Engine | Three.js |
| Build | Vite |
| Tests | Vitest |
| 3×3 Solver | [cube-solver](https://www.npmjs.com/package/cube-solver) (MIT, Kociemba two-phase) |
| Deployment | GitHub Pages via GitHub Actions |

### Project Structure

```
src/
  cube/          # Pure logic (no Three.js) — types, permutation, state, facelet, notation
  render/        # Three.js — scene, cubie meshes, turn animation
  interaction/   # Drag-to-turn inference, keyboard, pointer normalization
  game/          # Controller, move queue, history, timer, stats
  scramble/      # Random-move scrambler with axis filtering
  solve/         # Rewind solver + 3×3 Kociemba (Web Worker)
  persistence/   # localStorage save/load with versioned schema
  ui/            # Themes, color palettes
  content/       # Trivia data
  styles/        # Design tokens + responsive CSS
test/            # 25 unit tests
```

### Getting Started

```bash
# Install
npm install

# Development (hot reload)
npm run dev

# Run tests
npm test

# Production build
npm run build
npm run preview
```

---

## 中文

### 功能

- **四种尺寸** — 2×2（口袋魔方）、3×3（标准魔方）、4×4（Rubik's Revenge）、5×5（Professor's Cube）
- **拖拽转面** — 拖动魔方表面转动，拖动空白处旋转视角
- **一键还原** — 3×3 用 Kociemba 算法求短解，4×4/5×5 用回放逆操作（保证还原）
- **打乱 & 暂停** — 自动生成含内层的随机打乱；打乱过程中可随时停止
- **计时 & 统计** — 首步启动计时，还原即停；记录最佳/上次/ao5/ao12
- **撤销 / 重做** — 完整历史记录，不可撤销穿越打乱边界
- **键盘操作** — 按 `R` `U` `F` `L` `D` `B` 转动外层面，按住 `Shift` 反向转动
- **可视转动按键** — 页面上 6 组 12 个面转动按键，适合触屏操作
- **3 套主题** — 暗黑（默认）、经典明亮、高对比
- **魔方小知识** — 包含魔方历史、速拧、WCA 等趣闻
- **进度保存** — localStorage 自动存档（状态 + 设置 + 统计）
- **响应式** — 支持移动端触控，窄屏界面自动适配
- **MIT 开源** — 无 GPL 依赖

### 技术栈

| 层面 | 技术 |
|---|---|
| 语言 | TypeScript (strict) |
| 3D 引擎 | Three.js |
| 构建工具 | Vite |
| 测试 | Vitest |
| 3×3 求解器 | [cube-solver](https://www.npmjs.com/package/cube-solver) (MIT, Kociemba 两阶段) |
| 部署 | GitHub Actions → GitHub Pages |

### 项目结构

```
src/
  cube/          # 纯逻辑 (无 Three.js) — 类型定义、置换数学、状态、面检测、记号
  render/        # Three.js — 场景、cubie 网格、转动动画
  interaction/   # 拖拽转面推断、键盘、指针归一化
  game/          # 控制器、移动队列、历史、计时、统计
  scramble/      # 随机打乱生成器 (同轴过滤)
  solve/         # 回放还原 + 3×3 Kociemba (Web Worker)
  persistence/   # localStorage 存档 (版本化 schema)
  ui/            # 主题配色
  content/       # 小知识数据
  styles/        # 设计令牌 + 响应式 CSS
test/            # 25 个单元测试
```

### 本地开发

```bash
# 安装依赖
npm install

# 开发模式 (热更新)
npm run dev

# 运行测试
npm test

# 生产构建
npm run build
npm run preview
```

---

### License

MIT
