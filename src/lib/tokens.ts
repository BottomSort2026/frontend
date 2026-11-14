// Design tokens at runtime. CSS reads them as var(--name); canvas and Motion read them here,
// so a value changed in tokens.css changes everywhere.

export type Rgb = [number, number, number];
export type Bezier = [number, number, number, number];

export function tok(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function rgb(name: string): Rgb {
  const m = /^#([0-9a-f]{6})$/i.exec(tok(name));
  if (!m) return [136, 136, 136];
  const n = parseInt(m[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgba(c: Rgb, a: number): string {
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
}

/** A duration token ("260ms") in seconds, as Motion expects. */
export function dur(name: string, fallbackMs: number): number {
  const v = parseFloat(tok(name));
  return (Number.isFinite(v) ? v : fallbackMs) / 1000;
}

/** An easing token ("cubic-bezier(...)") as the four numbers Motion expects. */
export function ease(name: string, fallback: Bezier): Bezier {
  const m = /cubic-bezier\(([^)]+)\)/.exec(tok(name));
  const p = m ? m[1]!.split(",").map(Number) : [];
  return p.length === 4 && p.every(Number.isFinite) ? (p as Bezier) : fallback;
}

export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
