import { rgb, rgba, type Rgb } from "../lib/tokens";
import type { SkyGeometry } from "./projection";

// The Elqui night sky on a canvas. Seeded, so every visitor sees the same stars.
// Camera: zoom z about a focus point; nearer stars (depth d) move more, which gives the fly-through.

interface Star {
  x: number;
  y: number;
  d: number;
  s: number;
  a: number;
  tw: number;
  ph: number;
  c: Rgb;
}

export interface Sky {
  layout(geo: SkyGeometry): void;
  camera(x: number, y: number, z: number): void;
  start(): void;
  stop(): void;
  destroy(): void;
}

function seeded(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSky(canvas: HTMLCanvasElement, reducedMotion: boolean): Sky {
  const ctx = canvas.getContext("2d")!;
  let W = 1;
  let H = 1;
  let dpr = 1;
  let stars: Star[] = [];
  let milkyWay: HTMLCanvasElement | null = null;
  const cam = { x: 0, y: 0, z: 1 };
  let prevZ = 1;
  let raf = 0;
  let running = false;
  let wanted = false;
  let visible = true;
  let lastT = 0;

  const INK = rgb("--ink");
  const COOL = rgb("--flame-core");
  const WARM = rgb("--soot");
  const DUST = rgb("--milkyway");
  const COLOURS = [INK, INK, INK, COOL, COOL, WARM];

  function build(g: SkyGeometry): void {
    const r = seeded(20261114);
    const gauss = () => (r() + r() + r() + r() - 2) / 1.15;
    const n = Math.round(Math.max(520, Math.min(2200, (W * H) / 420)));
    const ca = Math.cos(g.band.angle);
    const sa = Math.sin(g.band.angle);
    const span = Math.max(W, H) * 1.1;
    const sig = Math.min(W, H) * 0.1;
    stars = [];
    for (let i = 0; i < n; i++) {
      let x: number;
      let y: number;
      if (i % 5 < 2) {
        // two stars in five crowd the Milky Way
        const t = (r() - 0.5) * 2 * span;
        const o = gauss() * sig;
        x = g.band.x + ca * t - sa * o;
        y = g.band.y + sa * t + ca * o;
      } else {
        x = (r() * 1.7 - 0.35) * W;
        y = (r() * 1.7 - 0.35) * H;
      }
      const m = Math.pow(r(), 5);
      stars.push({
        x,
        y,
        d: 0.2 + 0.8 * r(),
        s: 0.55 + m * 1.7,
        a: 0.3 + 0.45 * r() + 0.25 * m,
        tw: r() < 0.22 ? 0.6 + r() * 1.6 : 0,
        ph: r() * 6.283,
        c: COLOURS[(r() * COLOURS.length) | 0]!,
      });
    }

    // Milky Way: warm dust painted once to an offscreen canvas at half resolution.
    const k = 0.5;
    const mc = document.createElement("canvas");
    mc.width = Math.ceil(W * k);
    mc.height = Math.ceil(H * k);
    const m2 = mc.getContext("2d")!;
    const blob = (x: number, y: number, rad: number, c: Rgb, a: number) => {
      const gr = m2.createRadialGradient(x * k, y * k, 0, x * k, y * k, rad * k);
      gr.addColorStop(0, rgba(c, a));
      gr.addColorStop(1, rgba(c, 0));
      m2.fillStyle = gr;
      m2.fillRect((x - rad) * k, (y - rad) * k, rad * 2 * k, rad * 2 * k);
    };
    m2.globalCompositeOperation = "lighter";
    for (let j = 0; j < 190; j++) {
      const t = (r() - 0.5) * 2 * span;
      const o = gauss() * sig * 0.7;
      blob(
        g.band.x + ca * t - sa * o,
        g.band.y + sa * t + ca * o,
        sig * (0.45 + r() * 0.9),
        r() < 0.7 ? DUST : COOL,
        0.02 + r() * 0.028,
      );
    }
    m2.globalCompositeOperation = "destination-out";
    for (let q = 0; q < 34; q++) {
      // the dark rift along the middle of the band
      const t = (r() - 0.5) * 2 * span;
      const o = gauss() * sig * 0.22;
      blob(
        g.band.x + ca * t - sa * o,
        g.band.y + sa * t + ca * o,
        sig * (0.18 + r() * 0.4),
        [0, 0, 0],
        0.4,
      );
    }
    m2.save();
    m2.translate(g.coalsack.x * k, g.coalsack.y * k);
    m2.scale(1, g.coalsack.ry / g.coalsack.rx);
    const cg = m2.createRadialGradient(0, 0, 0, 0, 0, g.coalsack.rx * k);
    cg.addColorStop(0, "rgba(0,0,0,.8)");
    cg.addColorStop(0.6, "rgba(0,0,0,.5)");
    cg.addColorStop(1, "rgba(0,0,0,0)");
    m2.fillStyle = cg;
    m2.fillRect(
      -g.coalsack.rx * k,
      -g.coalsack.rx * k,
      g.coalsack.rx * 2 * k,
      g.coalsack.rx * 2 * k,
    );
    m2.restore();
    milkyWay = mc;
  }

  function draw(now: number): void {
    const z = cam.z;
    const moving = Math.abs(z - prevZ) > 0.0005;
    const t = now / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (milkyWay) {
      const zm = 1 + (z - 1) * 0.3;
      ctx.globalAlpha = Math.max(0, 1 - (z - 1) / 6);
      ctx.drawImage(milkyWay, cam.x - cam.x * zm, cam.y - cam.y * zm, W * zm, H * zm);
    }
    ctx.lineCap = "round";
    for (const s of stars) {
      const ze = 1 + (z - 1) * s.d;
      const x = cam.x + (s.x - cam.x) * ze;
      const y = cam.y + (s.y - cam.y) * ze;
      if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;
      const a = s.a * (s.tw ? 0.72 + 0.28 * Math.sin(t * s.tw + s.ph) : 1);
      const size = s.s * (1 + (ze - 1) * 0.12);
      ctx.globalAlpha = 1;
      if (moving) {
        // a short streak back along the path the star just travelled
        const zp = 1 + (prevZ - 1) * s.d;
        const k2 = Math.max(-0.45, Math.min(0.45, (zp - ze) * 3));
        ctx.strokeStyle = rgba(s.c, a);
        ctx.lineWidth = size;
        ctx.beginPath();
        ctx.moveTo(x + (s.x - cam.x) * k2, y + (s.y - cam.y) * k2);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (size < 1.1) {
        ctx.fillStyle = rgba(s.c, a);
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      } else {
        ctx.fillStyle = rgba(s.c, a);
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, 6.283);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    prevZ = z;
  }

  function loop(now: number): void {
    if (!running) return;
    // about 30 fps at rest, every frame while the camera moves
    if (now - lastT > 30 || cam.z !== prevZ) {
      lastT = now;
      draw(now);
    }
    raf = requestAnimationFrame(loop);
  }

  function resume(): void {
    if (running || !wanted || !visible || document.hidden) return;
    if (reducedMotion) {
      draw(0);
      return;
    }
    running = true;
    raf = requestAnimationFrame(loop);
  }

  function pause(): void {
    running = false;
    cancelAnimationFrame(raf);
  }

  const io = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? true;
    if (visible) resume();
    else pause();
  });
  io.observe(canvas);
  const onVisibility = () => (document.hidden ? pause() : resume());
  document.addEventListener("visibilitychange", onVisibility);

  return {
    layout(g) {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.max(1, g.width);
      H = Math.max(1, g.height);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      build(g);
      draw(performance.now());
    },
    camera(x, y, z) {
      cam.x = x;
      cam.y = y;
      cam.z = z;
      if (!running) draw(performance.now());
    },
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
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}
