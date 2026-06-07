import { Color } from '../cube/types';
import type { Palette } from '../render/cubieFactory';
import type { CubeView } from '../render/CubeView';

export interface Theme {
  id: string;
  name: string;
  palette: Palette;
  /** 覆盖到 :root 的 CSS 变量（UI 与透明画布背后的渐变背景）。 */
  vars: Record<string, string>;
}

const LIGHT_VARS: Record<string, string> = {
  '--bg-0': '#f8fafc',
  '--bg-1': '#eef2f7',
  '--card': '#ffffff',
  '--card-2': '#f8fafc',
  '--card-border': 'rgba(15,23,42,0.07)',
  '--shadow-card': '0 4px 20px rgba(15,23,42,0.06)',
  '--shadow-hover': '0 10px 30px rgba(15,23,42,0.12)',
  '--text-strong': '#0f172a',
  '--text': '#334155',
  '--text-muted': '#64748b',
  '--accent': '#2563eb',
  '--accent-strong': '#1d4ed8',
  '--accent-soft': 'rgba(37,99,235,0.10)',
  '--accent-contrast': '#ffffff',
};

const CLASSIC_PALETTE: Palette = {
  [Color.U]: 0xffffff,
  [Color.R]: 0xc41e3a,
  [Color.F]: 0x00a651,
  [Color.D]: 0xfdd835,
  [Color.L]: 0xff8c1a,
  [Color.B]: 0x0051ba,
};

export const THEMES: Theme[] = [
  {
    id: 'classic',
    name: '经典',
    palette: CLASSIC_PALETTE,
    vars: { ...LIGHT_VARS },
  },
  {
    id: 'vivid',
    name: '高对比',
    palette: {
      [Color.U]: 0xffffff,
      [Color.R]: 0xff0936,
      [Color.F]: 0x00d24a,
      [Color.D]: 0xffe600,
      [Color.L]: 0xff7a00,
      [Color.B]: 0x0a5bff,
    },
    vars: { ...LIGHT_VARS, '--accent': '#0ea5e9', '--accent-strong': '#0284c7' },
  },
  {
    id: 'dark',
    name: '暗黑',
    palette: CLASSIC_PALETTE,
    vars: {
      '--bg-0': '#0b1020',
      '--bg-1': '#0f172a',
      '--card': '#1e293b',
      '--card-2': '#243043',
      '--card-border': 'rgba(255,255,255,0.08)',
      '--shadow-card': '0 6px 24px rgba(0,0,0,0.45)',
      '--shadow-hover': '0 12px 34px rgba(0,0,0,0.55)',
      '--text-strong': '#f8fafc',
      '--text': '#e2e8f0',
      '--text-muted': '#94a3b8',
      '--accent': '#3b82f6',
      '--accent-strong': '#2563eb',
      '--accent-soft': 'rgba(59,130,246,0.18)',
      '--accent-contrast': '#ffffff',
    },
  },
];

export function themeById(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function applyTheme(theme: Theme, view: CubeView): void {
  view.applyPalette(theme.palette);
  const root = document.documentElement;
  for (const [k, v] of Object.entries(theme.vars)) root.style.setProperty(k, v);
}
