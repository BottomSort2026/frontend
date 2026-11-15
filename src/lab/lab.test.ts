import { describe, expect, it } from "vite-plus/test";
import type { FloatInput, LabModelInfo, LabPredictResponse, NearestTest } from "../api/types";
import {
  buildInputs,
  confidenceWording,
  defaultValues,
  displaySpec,
  fromDisplay,
  nearestTests,
  normalizeValues,
  rangeOf,
  rangeWording,
  sameInputs,
  selectorOf,
  sourceLine,
  testConditions,
  supportSentence,
} from "./lab";

const AMOUNT: FloatInput = {
  type: "float",
  min: 0,
  max: 0.5,
  unit: "mole fraction",
  default: 0,
  by_selector: {
    none: { min: 0, max: 0 },
    co2: { min: 0.05, max: 0.5 },
    he: { min: 0.05, max: 0.45 },
  },
};

const INFO: LabModelInfo = {
  inputs: {
    fuel: { type: "enum", values: ["methanol", "heptane"] },
    pressure_atm: { type: "float", min: 0.69, max: 1.02, unit: "atm", default: 1 },
    o2: { type: "float", min: 0.12, max: 0.34, unit: "mole fraction", default: 0.21 },
    suppressant: { type: "enum", values: ["none", "co2", "he"], default: "none" },
    suppressant_fraction: AMOUNT,
    droplet_d0_mm: { type: "float", min: 1.1, max: 4.7, unit: "mm", default: 3 },
  },
};

describe("the amount slider", () => {
  it("finds its selector by the values, not by a name", () => {
    expect(selectorOf(INFO, AMOUNT)).toBe("suppressant");
    expect(selectorOf(INFO, { ...AMOUNT, selector: "suppressant" })).toBe("suppressant");
    expect(selectorOf(INFO, INFO.inputs.o2 as FloatInput)).toBeUndefined();
  });

  it("takes its range from the chosen gas", () => {
    const v = defaultValues(INFO);
    expect(rangeOf(INFO, AMOUNT, { ...v, suppressant: "co2" })).toEqual({
      min: 0.05,
      max: 0.5,
      disabled: false,
    });
    expect(rangeOf(INFO, AMOUNT, { ...v, suppressant: "he" })).toEqual({
      min: 0.05,
      max: 0.45,
      disabled: false,
    });
    expect(rangeOf(INFO, AMOUNT, { ...v, suppressant: "none" }).disabled).toBe(true);
  });

  it("is disabled for a gas model-info does not list", () => {
    expect(rangeOf(INFO, AMOUNT, { suppressant: "argon" }).disabled).toBe(true);
  });

  it("clamps into the new range when the gas changes", () => {
    const co2 = normalizeValues(INFO, {
      ...defaultValues(INFO),
      suppressant: "co2",
      suppressant_fraction: 0.5,
    });
    expect(co2.suppressant_fraction).toBe(0.5);
    const he = normalizeValues(INFO, { ...co2, suppressant: "he" }, "suppressant");
    expect(he.suppressant_fraction).toBe(0.45);
    const fromNone = normalizeValues(
      INFO,
      { ...defaultValues(INFO), suppressant: "co2" },
      "suppressant",
    );
    expect(fromNone.suppressant_fraction).toBe(0.05);
  });

  it("is 0 with no suppressant", () => {
    const v = normalizeValues(INFO, {
      ...defaultValues(INFO),
      suppressant: "none",
      suppressant_fraction: 0.3,
    });
    expect(v.suppressant_fraction).toBe(0);
  });

  it("keeps the mole fractions at or under 1 for the one being moved", () => {
    const wide: LabModelInfo = {
      inputs: {
        ...INFO.inputs,
        o2: { type: "float", min: 0.1, max: 0.9, unit: "mole fraction" },
      },
    };
    const v = normalizeValues(
      wide,
      { ...defaultValues(wide), o2: 0.8, suppressant: "co2", suppressant_fraction: 0.4 },
      "suppressant_fraction",
    );
    expect(v.suppressant_fraction).toBe(0.2);
    expect(v.o2).toBe(0.8);
  });
});

describe("mole fractions on screen", () => {
  it("shows a mole fraction as a percentage, decided by the unit", () => {
    expect(displaySpec(INFO.inputs.o2 as FloatInput)).toMatchObject({
      scale: 100,
      unit: "%",
      digits: 0,
    });
    expect(displaySpec({ type: "float", min: 0, max: 1, unit: "Mole Fraction" }).scale).toBe(100);
    expect(displaySpec(INFO.inputs.pressure_atm as FloatInput)).toMatchObject({
      scale: 1,
      unit: "atm",
    });
  });

  it("sends the fraction back without float noise", () => {
    const spec = displaySpec(INFO.inputs.o2 as FloatInput);
    expect(fromDisplay(21, spec)).toBe(0.21);
    expect(fromDisplay(29, spec)).toBe(0.29);
    expect(fromDisplay(3, displaySpec(INFO.inputs.droplet_d0_mm as FloatInput))).toBe(3);
  });
});

describe("the request", () => {
  it("sends every input model-info declares, with the defaults", () => {
    expect(buildInputs(INFO, defaultValues(INFO))).toEqual({
      fuel: "methanol",
      pressure_atm: 1,
      o2: 0.21,
      suppressant: "none",
      suppressant_fraction: 0,
      droplet_d0_mm: 3,
    });
  });

  it("sends 0 for the amount when no suppressant is chosen", () => {
    const req = buildInputs(INFO, {
      ...defaultValues(INFO),
      suppressant: "none",
      suppressant_fraction: 0.3,
    });
    expect(req.suppressant_fraction).toBe(0);
  });

  it("drops values model-info does not know", () => {
    expect(buildInputs(INFO, { ...defaultValues(INFO), gravity: 1 })).not.toHaveProperty("gravity");
  });

  it("tells when the conditions changed", () => {
    const a = buildInputs(INFO, defaultValues(INFO));
    expect(sameInputs(a, { ...a })).toBe(true);
    expect(sameInputs(a, { ...a, o2: 0.22 })).toBe(false);
    expect(sameInputs(a, undefined)).toBe(false);
  });
});

const t = (
  testsheet_id: string | null,
  cir_id: string | null,
  test_end = "extinction",
): NearestTest => ({
  testsheet_id,
  cir_id,
  test_end,
  distance: 0.1,
});

function prediction(
  outcome: "extinction" | "no_extinction",
  a: NearestTest[],
  b: NearestTest[],
): LabPredictResponse["prediction"] {
  return {
    outcome: { prediction: { label: outcome }, support: { nearest_tests: a } },
    extinction: { support: { nearest_tests: b } },
  };
}

describe("closest real tests", () => {
  it("lists each test once, in k-NN order, outcome model first, at most five", () => {
    const p = prediction(
      "extinction",
      [t("FLEX-01", "A"), t("FLEX-02", "B"), t("FLEX-03", "C")],
      [t("FLEX-02", "B"), t("FLEX-04", "D"), t("FLEX-05", "E"), t("FLEX-06", "F")],
    );
    expect(nearestTests(p).map((x) => x.testsheet_id)).toEqual([
      "FLEX-01",
      "FLEX-02",
      "FLEX-03",
      "FLEX-04",
      "FLEX-05",
    ]);
  });

  it("falls back to the CIR number when a test has no TestSheet", () => {
    const p = prediction(
      "extinction",
      [t(null, "205R001")],
      [t(null, "205R001"), t(null, "205R002")],
    );
    expect(nearestTests(p).map((x) => x.cir_id)).toEqual(["205R001", "205R002"]);
  });

  it("leaves out the extinction model's tests when its block is not shown", () => {
    const p = prediction("no_extinction", [t("FLEX-01", "A")], [t("FLEX-09", "Z")]);
    expect(nearestTests(p).map((x) => x.testsheet_id)).toEqual(["FLEX-01"]);
  });

  it("copes with missing lists", () => {
    expect(nearestTests({ outcome: { prediction: { label: "extinction" } } })).toEqual([]);
  });
});

describe("starting values without defaults", () => {
  // The inputs GET /lab/model-info really sends: no `default` anywhere.
  const real: LabModelInfo = {
    inputs: {
      fuel: { type: "enum", values: ["heptane", "methanol"] },
      pressure_atm: { type: "float", min: 0.69, max: 1.02, unit: "atm" },
      o2: { type: "float", min: 0.12, max: 0.34, unit: "mole fraction" },
      suppressant: { type: "enum", values: ["none", "co2", "he"] },
      suppressant_fraction: {
        type: "float",
        min: 0,
        max: 0.5,
        unit: "mole fraction",
        by_selector: {
          none: { min: 0, max: 0 },
          co2: { min: 0.05, max: 0.5 },
          he: { min: 0.05, max: 0.45 },
        },
      },
      droplet_d0_mm: { type: "float", min: 1.1, max: 4.67, unit: "mm" },
    },
  };

  it("starts from air at about 1 atm, not from each minimum", () => {
    expect(buildInputs(real, defaultValues(real))).toEqual({
      fuel: "heptane",
      pressure_atm: 1,
      o2: 0.21,
      suppressant: "none",
      suppressant_fraction: 0,
      droplet_d0_mm: 3,
    });
  });

  it("keeps a starting value inside the model's own range", () => {
    const narrow: LabModelInfo = {
      inputs: { pressure_atm: { type: "float", min: 0.5, max: 0.8, unit: "atm" } },
    };
    expect(defaultValues(narrow).pressure_atm).toBe(0.8);
  });
});

describe("a real test's conditions", () => {
  const conditions = {
    fuel: "methanol",
    pressure_atm: 1.0125,
    o2: 0.21,
    co2: 0,
    he: 0,
    d0_mm: 2.78,
  };

  it("reads like the request, so the two can be compared", () => {
    expect(testConditions({ conditions })).toBe(
      "methanol · 1.01 atm · 21 % O₂ · no suppressant · D₀ 2.78 mm",
    );
  });

  it("names the suppressant that was used", () => {
    expect(testConditions({ conditions: { ...conditions, co2: 0.3 } })).toContain("30 % CO₂");
    expect(testConditions({ conditions: { ...conditions, he: 0.05 } })).toContain("5 % helium");
  });

  it("leaves out what the test does not carry", () => {
    expect(testConditions({})).toBe("");
    expect(testConditions({ conditions: { fuel: "heptane", d0_mm: null } })).toBe("heptane");
  });
});

describe("source line", () => {
  const source = (rows: number) => ({
    dataset: "flex_tests",
    accession: "PSI-69",
    sha256: "abc123",
    rows,
  });
  const p: LabPredictResponse["prediction"] = {
    outcome: {
      prediction: { label: "extinction" },
      model: { model_version: "flex-outcome-0.2", training_source: source(251) },
    },
    extinction: { model: { model_version: "flex-extinction-0.2", training_source: source(156) } },
  };

  it("names both models and their training data, never an object or a hash", () => {
    const line = sourceLine(p);
    expect(line).toBe(
      "flex-outcome-0.2 · flex-extinction-0.2 · trained on FLEX (PSI-69), 251 and 156 tests. Valid only within the conditions tested on the ISS.",
    );
    expect(line).not.toContain("[object");
    expect(line).not.toContain("abc123");
  });

  it("survives missing fields", () => {
    expect(sourceLine({ outcome: { prediction: { label: "extinction" } } })).toBe(
      "Valid only within the conditions tested on the ISS.",
    );
  });

  it("says a sample is not a computation, and whether it is the reference case", () => {
    const inputs = {};
    expect(sourceLine(p, { inputs, reference: true })).toMatch(
      /^Sample output: the reference case.*not computed from your inputs/,
    );
    expect(sourceLine(p, { inputs, reference: false })).toMatch(
      /^Sample output: a hand-made variant.*not computed from your inputs/,
    );
  });
});

describe("support wording", () => {
  it("words the confidence and colours it", () => {
    expect(confidenceWording("high")).toEqual({ text: "High confidence", tone: "nominal" });
    expect(confidenceWording("medium")).toEqual({ text: "Medium confidence", tone: "neutral" });
    expect(confidenceWording("low")).toEqual({ text: "Low confidence", tone: "ember" });
    expect(confidenceWording(undefined)).toBeNull();
  });

  it("words the tested range", () => {
    expect(rangeWording(true)?.text).toBe("Inside the tested conditions");
    expect(rangeWording(false)).toEqual({ text: "Outside the tested conditions", tone: "ember" });
    expect(rangeWording(undefined)).toBeNull();
  });

  it("counts the close tests, zero included", () => {
    expect(supportSentence(10)).toBe("10 real tests close to these conditions");
    expect(supportSentence(1)).toBe("1 real test close to these conditions");
    expect(supportSentence(0)).toBe("No real test close to these conditions");
    expect(supportSentence(undefined)).toBeNull();
  });
});
