import { describe, expect, it } from "vite-plus/test";
import {
  dataBasis,
  describeFlame,
  flameState,
  ILLUSTRATIVE_O2_LIMIT,
  PRESETS,
  samePreset,
} from "./flameModel";

describe("flame model", () => {
  it("draws a diffusion-fed sphere in free fall with still air", () => {
    const d = describeFlame({ gravity: 0, oxygen: 21, airflow: 0 });
    expect(d).toMatchObject({
      lit: true,
      shape: "Spherical",
      transport: "Diffusion",
      basis: "microgravity",
    });
  });

  it("draws a buoyant, sooty teardrop on Earth", () => {
    const d = describeFlame({ gravity: 1, oxygen: 21, airflow: 0 });
    expect(d).toMatchObject({
      shape: "Teardrop",
      transport: "Buoyant convection",
      colour: "Yellow, sooty",
      basis: "normal-gravity",
    });
  });

  it("stretches a free-fall flame downstream when air moves", () => {
    expect(describeFlame({ gravity: 0, oxygen: 21, airflow: 20 }).shape).toBe(
      "Stretched downstream",
    );
  });

  it("marks every partial-gravity result as interpolated", () => {
    expect(dataBasis(0.17)).toBe("interpolated");
    expect(dataBasis(0.38)).toBe("interpolated");
    expect(dataBasis(0)).toBe("microgravity");
    expect(dataBasis(1)).toBe("normal-gravity");
  });

  it("goes out below the illustrative oxygen limit", () => {
    expect(describeFlame({ gravity: 0, oxygen: ILLUSTRATIVE_O2_LIMIT - 1, airflow: 0 }).lit).toBe(
      false,
    );
  });

  it("gets sootier with gravity", () => {
    const free = flameState({ gravity: 0, oxygen: 21, airflow: 0 }).soot;
    const earth = flameState({ gravity: 1, oxygen: 21, airflow: 0 }).soot;
    expect(earth).toBeGreaterThan(free);
  });

  it("recognises its own presets", () => {
    for (const p of PRESETS) expect(samePreset(p.params, { ...p.params })).toBe(true);
    expect(samePreset(PRESETS[0]!.params, PRESETS[4]!.params)).toBe(false);
  });
});
