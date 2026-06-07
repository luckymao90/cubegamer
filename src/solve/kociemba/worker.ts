import { solve, initialize } from 'cube-solver';

// 在 Worker 中运行 Kociemba，避免阻塞主线程（剪枝表初始化较慢）。
const ctx = self as unknown as Worker;
let ready = false;

interface Req {
  id: number;
  scramble: string;
}

ctx.onmessage = (e: MessageEvent<Req>): void => {
  const { id, scramble } = e.data;
  try {
    if (!ready) {
      try {
        initialize('kociemba');
      } catch {
        /* 某些版本无需显式初始化 */
      }
      ready = true;
    }
    const sol = solve(scramble, 'kociemba');
    ctx.postMessage({ id, sol });
  } catch (err) {
    ctx.postMessage({ id, error: String(err instanceof Error ? err.message : err) });
  }
};
