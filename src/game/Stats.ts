import type { SolveRecord } from '../cube/types';

export interface StatLine {
  count: number;
  best: number | null;
  last: number | null;
  ao5: number | null;
  ao12: number | null;
}

/**
 * 取最近 n 次的平均（WCA 规则：去掉 1 个最好和 1 个最差，其余取平均）。
 * 不足 n 次返回 null。
 */
export function averageOfN(times: readonly number[], n: number): number | null {
  if (times.length < n) return null;
  const window = times.slice(times.length - n);
  const sorted = [...window].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, n - 1); // 去掉最好与最差
  const sum = trimmed.reduce((a, b) => a + b, 0);
  return sum / trimmed.length;
}

export function computeStats(records: readonly SolveRecord[], N: number): StatLine {
  const times = records.filter((r) => r.N === N).map((r) => r.timeMs);
  return {
    count: times.length,
    best: times.length ? Math.min(...times) : null,
    last: times.length ? times[times.length - 1] : null,
    ao5: averageOfN(times, 5),
    ao12: averageOfN(times, 12),
  };
}
