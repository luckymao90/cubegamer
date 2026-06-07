/**
 * 计时器：首步启动、还原停止。时间值由外部传入（performance.now()），便于测试。
 */
export class Timer {
  private startMs = 0;
  private accumMs = 0;
  private running = false;

  start(now: number): void {
    if (!this.running) {
      this.running = true;
      this.startMs = now;
    }
  }

  stop(now: number): void {
    if (this.running) {
      this.accumMs += now - this.startMs;
      this.running = false;
    }
  }

  reset(): void {
    this.startMs = 0;
    this.accumMs = 0;
    this.running = false;
  }

  elapsed(now: number): number {
    return this.accumMs + (this.running ? now - this.startMs : 0);
  }

  get isRunning(): boolean {
    return this.running;
  }
}

/** 毫秒 → "m:ss.SS" 或 "s.SS"。 */
export function formatTime(ms: number): string {
  const totalCs = Math.floor(ms / 10); // 厘秒
  const cs = totalCs % 100;
  const totalSec = Math.floor(totalCs / 100);
  const sec = totalSec % 60;
  const min = Math.floor(totalSec / 60);
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return min > 0 ? `${min}:${pad(sec)}.${pad(cs)}` : `${sec}.${pad(cs)}`;
}
