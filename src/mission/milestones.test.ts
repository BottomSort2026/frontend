import { describe, expect, it } from "vite-plus/test";
import {
  ASSUMPTIONS,
  BRIEF,
  FACTOR_IDS,
  FACTORS,
  type Factor,
  factorFrom,
  GRAVITY_LEVELS,
  lessonHeading,
  MILESTONES,
  milestonesFor,
} from "./milestones";

const MAX_COPY = 320;

function isNasaHttps(url: string): boolean {
  const { protocol, hostname } = new URL(url);
  return protocol === "https:" && (hostname === "nasa.gov" || hostname.endsWith(".nasa.gov"));
}

describe("milestones", () => {
  it("have unique ids and are in order", () => {
    const ids = MILESTONES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (let i = 1; i < MILESTONES.length; i++) {
      expect(MILESTONES[i].order).toBeGreaterThan(MILESTONES[i - 1].order);
    }
  });

  it("cite NASA over https, or the challenge brief by name", () => {
    const sources = [...MILESTONES, ...Object.values(FACTORS), ...ASSUMPTIONS].flatMap(
      (x) => x.sources,
    );
    for (const m of MILESTONES) expect(m.sources.length, m.id).toBeGreaterThan(0);
    for (const s of sources) {
      if (s.url) expect(isNasaHttps(s.url), s.url).toBe(true);
      else expect(s).toBe(BRIEF);
    }
  });

  it("keep what and lesson short", () => {
    for (const m of MILESTONES) {
      expect(m.what.length, m.id).toBeLessThanOrEqual(MAX_COPY);
      expect(m.lesson.length, m.id).toBeLessThanOrEqual(MAX_COPY);
    }
  });

  it("head the lesson by kind", () => {
    expect(lessonHeading("incident")).toBe("What it changed");
    expect(lessonHeading("facility")).toBe("What it taught");
    expect(lessonHeading("experiment")).toBe("What it taught");
    expect(lessonHeading("next")).toBe("What it will answer");
  });
});

describe("factors", () => {
  const factors = Object.keys(FACTORS) as Factor[];

  it("each have a label, a paragraph and a milestone", () => {
    expect(factors).toHaveLength(6);
    for (const f of factors) {
      expect(FACTORS[f].label, f).not.toBe("");
      expect(FACTORS[f].text, f).not.toBe("");
      expect(
        MILESTONES.some((m) => m.factors.includes(f)),
        f,
      ).toBe(true);
    }
  });

  it("filter the milestones, or keep all of them", () => {
    expect(milestonesFor()).toBe(MILESTONES);
    expect(milestonesFor(null)).toBe(MILESTONES);
    const pressure = milestonesFor("pressure");
    expect(pressure.length).toBeGreaterThan(0);
    expect(pressure.length).toBeLessThan(MILESTONES.length);
    expect(pressure.every((m) => m.factors.includes("pressure"))).toBe(true);
    expect(pressure.map((m) => m.id)).toContain("saffire");
  });
});

describe("factor in the URL", () => {
  it("accepts a factor and drops anything else", () => {
    expect(factorFrom("oxygen")).toBe("oxygen");
    expect(factorFrom("Oxygen")).toBeUndefined();
    expect(factorFrom("fuel")).toBeUndefined();
    expect(factorFrom(undefined)).toBeUndefined();
    expect(FACTOR_IDS).toEqual(Object.keys(FACTORS));
  });
});

describe("gravity levels", () => {
  it("say where PSI has combustion data", () => {
    expect(GRAVITY_LEVELS.map((g) => [g.place, g.hasPsiData])).toEqual([
      ["ISS, free fall", true],
      ["Moon", false],
      ["Mars", false],
      ["Earth", true],
    ]);
  });
});
