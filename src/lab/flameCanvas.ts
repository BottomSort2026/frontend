import { rgb, rgba, tok, type Rgb } from "../lib/tokens";
import { flameState, type FlameParams, type FlameState } from "./flameModel";

// Draws the illustrative droplet flame as additive particles. Colours come from the tokens
// flame-blue, soot and ember, so the picture follows the design system.

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  r: number;
  k: number;
}

export interface FlameCanvas {
  set(params: FlameParams): void;
  resize(): void;
  start(): void;
  stop(): void;
  destroy(): void;
}

export function createFlame(canvas: HTMLCanvasElement, reducedMotion: boolean): FlameCanvas {
  const ctx = canvas.getContext("2d")!;
  const P: FlameParams = { gravity: 0, oxygen: 21, airflow: 0 };
  let W = 1;
  let H = 1;
  let dpr = 1;
  let parts: Particle[] = [];
  const streaks = Array.from({ length: 22 }, () => ({ x: Math.random(), y: Math.random() }));
  let acc = 0;
  let last = 0;
  let raf = 0;
  let running = false;
  let wanted = false;
  let visible = true;

  const BLUE = rgb("--flame-blue");
  const SOOT = rgb("--soot");
  const EMBER = rgb("--ember");
  const INK = rgb("--ink-muted");
  const DROPLET = tok("--sky-700");

  function sprite(inner: Rgb, outer: Rgb, hot: number): HTMLCanvasElement {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const x = c.getContext("2d")!;
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, rgba(inner, hot));
    g.addColorStop(0.35, rgba(outer, 0.5));
    g.addColorStop(1, rgba(outer, 0));
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
    return c;
  }
  const blueSprite = sprite(BLUE, BLUE, 0.5);
  const warmSprite = sprite(SOOT, EMBER, 0.8);

  function emit(s: FlameState, u: number): void {
    const a = Math.random() * 6.283;
    const sp = (30 + 14 * s.intensity) * (1 - 0.45 * P.gravity) * u * (0.75 + 0.5 * Math.random());
    parts.push({
      x: Math.cos(a) * 5 * u,
      y: Math.sin(a) * 5 * u,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      age: 0,
      life: (1.9 - 0.85 * P.gravity) * (0.75 + 0.5 * Math.random()),
      r: (17 + 9 * s.intensity - P.gravity) * u * (0.8 + 0.4 * Math.random()),
      k: Math.random(),
    });
  }

  function step(dt: number, s: FlameState, u: number): void {
    if (s.lit) {
      acc += dt * (120 + 60 * s.intensity + 30 * P.gravity);
      while (acc > 1) {
        acc -= 1;
        emit(s, u);
      }
    }
    const buoy = -P.gravity * 250 * u;
    const vf = (P.airflow / 40) * 95 * u;
    const drag = 1.25 - 0.45 * P.gravity;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]!;
      p.age += dt;
      if (p.age > p.life) {
        parts.splice(i, 1);
        continue;
      }
      p.vy += (buoy * (1 - (0.5 * p.age) / p.life) - drag * p.vy) * dt;
      // buoyant plumes pinch inward as they rise
      p.vx +=
        ((vf - p.vx) * 1.6 -
          2.6 * P.gravity * (0.3 + (1.7 * p.age) / p.life) * (p.x - vf * p.age * 0.5)) *
        dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    for (const st of streaks) {
      st.x += ((vf * 2.2 + 4) * dt) / W;
      if (st.x > 1.08) {
        st.x = -0.08;
        st.y = Math.random();
      }
    }
  }

  function draw(s: FlameState, u: number): void {
    const cx = W * 0.5 - Math.min(W * 0.16, (P.airflow / 40) * W * 0.16);
    const cy = H * (0.5 + 0.14 * Math.min(1, P.gravity * 1.6));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (P.airflow > 0.5) {
      ctx.strokeStyle = rgba(INK, Math.min(0.3, 0.06 + (P.airflow / 40) * 0.26));
      ctx.lineWidth = 1;
      ctx.beginPath();
      const len = 8 + P.airflow * 1.1;
      for (const st of streaks) {
        const sy = Math.round(st.y * H * 0.72 + H * 0.06) + 0.5;
        ctx.moveTo(st.x * W, sy);
        ctx.lineTo(st.x * W + len, sy);
      }
      ctx.stroke();
    }
    // support fibre
    ctx.strokeStyle = rgba(INK, 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 70 * u, cy);
    ctx.lineTo(cx + 70 * u, cy);
    ctx.stroke();

    ctx.globalCompositeOperation = "lighter";
    if (s.lit) {
      const gr = (90 + 70 * s.intensity) * u;
      const gx = cx + (P.airflow / 40) * 40 * u;
      const gy = cy - P.gravity * 60 * u;
      const tint = s.soot > 0.45 ? EMBER : BLUE;
      const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
      g.addColorStop(0, rgba(tint, 0.1 + 0.06 * s.intensity));
      g.addColorStop(1, rgba(tint, 0));
      ctx.fillStyle = g;
      ctx.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
    }
    const gk = Math.min(1, P.gravity * 2.5);
    for (const p of parts) {
      const t = p.age / p.life;
      // in free fall the young particles are dim: a luminous shell around a darker core
      const rampIn = Math.min(1, t / (0.38 - 0.28 * Math.min(1, P.gravity * 2)));
      const a =
        rampIn *
        Math.pow(1 - t, 1.2) *
        (0.032 + 0.018 * Math.min(1.1, s.intensity)) *
        (1 - 0.22 * Math.sin(gk * Math.PI));
      const r = p.r * (1 + (0.25 - 0.45 * P.gravity) * t);
      const warm = Math.max(
        0,
        Math.min(1, s.soot * (0.25 + 0.75 * gk * gk) * (t * 2.6 - 0.2 + 0.25 * p.k)),
      );
      const x = cx + p.x;
      const y = cy + p.y;
      if (warm < 1) {
        ctx.globalAlpha = a * (1 - warm) * (1 - 0.45 * gk);
        ctx.drawImage(blueSprite, x - r, y - r, r * 2, r * 2);
      }
      if (warm > 0) {
        ctx.globalAlpha = Math.min(1, a * warm * 3.4);
        ctx.drawImage(warmSprite, x - r, y - r, r * 2, r * 2);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    // fuel droplet
    ctx.fillStyle = DROPLET;
    ctx.strokeStyle = rgba(INK, 0.8);
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.arc(cx, cy, 4.5 * u, 0, 6.283);
    ctx.fill();
    ctx.stroke();
  }

  const scale = () => Math.max(0.6, Math.min(1.5, Math.min(W, H) / 300));

  /** One settled frame, for reduced motion and for the moment before the loop starts. */
  function still(): void {
    const s = flameState(P);
    const u = scale();
    parts = [];
    for (let i = 0; i < 150; i++) step(1 / 60, s, u);
    draw(s, u);
  }

  function frame(now: number): void {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const s = flameState(P);
    const u = scale();
    step(dt, s, u);
    draw(s, u);
    raf = requestAnimationFrame(frame);
  }

  function resume(): void {
    if (running || !wanted || !visible || document.hidden || reducedMotion) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function pause(): void {
    running = false;
    cancelAnimationFrame(raf);
  }

  function resize(): void {
    const box = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, box.width);
    H = Math.max(1, box.height);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    if (!running) still();
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  const io = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? true;
    if (visible) resume();
    else pause();
  });
  io.observe(canvas);
  const onVisibility = () => (document.hidden ? pause() : resume());
  document.addEventListener("visibilitychange", onVisibility);
  resize();

  return {
    set(next) {
      P.gravity = next.gravity;
      P.oxygen = next.oxygen;
      P.airflow = next.airflow;
      if (!running) still();
    },
    resize,
    start() {
      wanted = true;
      resume();
    },
    stop() {
      wanted = false;
      pause();
    },
    destroy() {
      pause();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}
