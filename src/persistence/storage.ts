import type { HistorySnapshot } from '../game/History';
import type { SolveRecord } from '../cube/types';

export interface SaveBlob {
  schemaVersion: number;
  settings: { N: number; themeId: string; speedMs: number };
  history: HistorySnapshot | null;
  stats: SolveRecord[];
}

const KEY = 'cubegamer.save';
const SCHEMA = 1;

export function loadSave(): SaveBlob | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const blob = JSON.parse(raw) as SaveBlob;
    if (!blob || blob.schemaVersion !== SCHEMA) return null;
    if (!blob.settings || !Array.isArray(blob.stats)) return null;
    return blob;
  } catch {
    return null; // 损坏的存档 → 优雅复位
  }
}

export function writeSave(blob: SaveBlob): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(blob));
  } catch {
    /* 配额/隐私模式等 → 忽略 */
  }
}

export const SAVE_SCHEMA = SCHEMA;

/** 简单去抖，用于频繁状态变更时节流写盘。 */
export function debounce<T extends (...a: never[]) => void>(fn: T, ms: number): T {
  let timer = 0;
  return ((...args: never[]) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), ms);
  }) as T;
}
