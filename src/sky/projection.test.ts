import { describe, expect, it } from "vite-plus/test";
import { layoutSky, reach } from "./projection";
import { starForPath } from "./stars";

describe("sky layout", () => {
  it("keeps the four destinations on screen at desktop and phone sizes", () => {
    for (const [w, h] of [
      [1440, 900],
      [1100, 720],
      [390, 720],
    ] as const) {
      const geo = layoutSky(w, h);
      for (const p of Object.values(geo.stars)) {
        expect(p.x).toBeGreaterThan(24);
        expect(p.x).toBeLessThan(w - 24);
        expect(p.y).toBeGreaterThan(24);
        expect(p.y).toBeLessThan(h * 0.8);
      }
    }
  });

  it("puts Gacrux at the top of the cross and Acrux at the foot", () => {
    const { stars } = layoutSky(1280, 800);
    expect(stars.lab.y).toBeLessThan(stars.safety.y);
    expect(stars.mission.y).toBeGreaterThan(stars.library.y);
    expect(stars.safety.x).toBeLessThan(stars.library.x);
  });

  it("stacks labels on narrow viewports", () => {
    expect(layoutSky(390, 720).stack).toBe(true);
    expect(layoutSky(1280, 800).stack).toBe(false);
  });

  it("reaches the farthest corner", () => {
    expect(reach({ x: 0, y: 0 }, 300, 400)).toBe(500);
  });
});

describe("routes", () => {
  it("maps each path to its star", () => {
    expect(starForPath("/flame-lab")?.star).toBe("Gacrux");
    expect(starForPath("/fire-safety/")?.star).toBe("Mimosa");
    expect(starForPath("/")).toBeNull();
  });
});
