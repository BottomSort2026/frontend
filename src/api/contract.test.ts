import { describe, expect, it } from "vite-plus/test";
import { labCitations, predictionStatement } from "../assistant/labMessage";
import { nearestTests, sourceLine, testConditions } from "../lab/lab";
import { normalizeModelInfo } from "./client";
import type { LabPredictResponse } from "./types";

// A POST /lab/predict answer as the MCP really sends it (captured from the service, shortened to
// two tests per block). If the readers below stop understanding it, the Lab shows nothing.
const RESPONSE: LabPredictResponse = {
  prediction: {
    outcome: {
      prediction: {
        label: "extinction",
        probabilities: { extinction: 0.58712, no_extinction: 0.41288 },
      },
      support: {
        in_tested_range: true,
        out_of_range_fields: [],
        support_n: 10,
        threshold: 0.8300262368157266,
        confidence: "medium",
        nearest_tests: [
          {
            cir_id: "205R001",
            testsheet_id: "FLEX-046",
            test_end: "disruption",
            conditions: {
              fuel: "methanol",
              pressure_atm: 1.0125,
              o2: 0.21,
              co2: 0,
              he: 0,
              d0_mm: 2.78,
            },
            distance: 0.3611,
          },
          {
            cir_id: "N01M201",
            testsheet_id: "FLEX-204",
            test_end: "extinction",
            conditions: {
              fuel: "methanol",
              pressure_atm: 1.00211,
              o2: 0.21,
              co2: 0,
              he: 0,
              d0_mm: 2.75,
            },
            distance: 0.3994,
          },
        ],
      },
      model: {
        model_version: "flex-outcome-0.2",
        training_source: {
          dataset: "flex_tests",
          accession: "PSI-69",
          sha256: "abb213da",
          rows: 251,
        },
      },
    },
    extinction: {
      prediction: {
        extinction_diameter_ratio: 0.44531,
        extinction_diameter_mm: 1.33593,
        fuel_burned_fraction: 0.91169,
      },
      support: {
        in_tested_range: true,
        out_of_range_fields: [],
        support_n: 11,
        threshold: 1.01618202404689,
        confidence: "high",
        nearest_tests: [
          {
            cir_id: "N01M201",
            testsheet_id: "FLEX-204",
            test_end: "extinction",
            conditions: {
              fuel: "methanol",
              pressure_atm: 1.00211,
              o2: 0.21,
              co2: 0,
              he: 0,
              d0_mm: 2.75,
            },
            distance: 0.3983,
          },
          {
            cir_id: "C01M201",
            testsheet_id: "FLEX-145",
            test_end: "extinction",
            conditions: {
              fuel: "methanol",
              pressure_atm: 1.00461,
              o2: 0.2,
              co2: 0.05,
              he: 0,
              d0_mm: 3.33,
            },
            distance: 0.6661,
          },
        ],
      },
      model: {
        model_version: "flex-extinction-0.2",
        training_source: {
          dataset: "flex_tests",
          accession: "PSI-69",
          sha256: "abb213da",
          rows: 156,
        },
      },
    },
  },
  explanation:
    "The flame is likely to go out on its own. The closest real test, FLEX-046, broke apart.",
  cited_tests: [
    {
      testsheet_id: "FLEX-046",
      cir_id: "205R001",
      test_end: "disruption",
      label: '"FLEX-046_TestSheet". FLEX (PSI-69), folder Raw Data.',
      investigation_url: "https://psi.nasa.gov/physci/repo/data/investigations/PSI-69",
    },
  ],
};

describe("the Lab reads the service's real answer", () => {
  const { prediction } = RESPONSE;

  it("states the verdict, its probability, the confidence and the droplet", () => {
    expect(predictionStatement(prediction)).toBe(
      "Predicted: the flame goes out on its own (59 %), medium confidence; droplet diameter at extinction 1.34 mm, 91 % of the fuel burned first.",
    );
  });

  it("lists the closest real tests of both models once, with their conditions", () => {
    const tests = nearestTests(prediction);
    expect(tests.map((t) => t.testsheet_id)).toEqual(["FLEX-046", "FLEX-204", "FLEX-145"]);
    expect(testConditions(tests[0]!)).toBe(
      "methanol · 1.01 atm · 21 % O₂ · no suppressant · D₀ 2.78 mm",
    );
    expect(testConditions(tests[2]!)).toBe("methanol · 1.00 atm · 20 % O₂ · 5 % CO₂ · D₀ 3.33 mm");
  });

  it("names both models and their training data", () => {
    expect(sourceLine(prediction)).toBe(
      "flex-outcome-0.2 · flex-extinction-0.2 · trained on FLEX (PSI-69), 251 and 156 tests. Valid only within the conditions tested on the ISS.",
    );
  });

  it("turns the cited tests into chat citations", () => {
    expect(labCitations(RESPONSE.cited_tests).map((c) => c.doc_title)).toEqual([
      "FLEX-046 TestSheet",
    ]);
  });
});

describe("the Lab reads the service's real model-info", () => {
  it("takes the controls from the top-level inputs, with the range of each suppressant", () => {
    const info = normalizeModelInfo({
      inputs: {
        fuel: { type: "enum", values: ["heptane", "methanol"] },
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
      },
      outcome: { model_version: "flex-outcome-0.2", outputs: ["label", "probabilities"] },
      extinction: { model_version: "flex-extinction-0.2" },
    });
    expect(Object.keys(info.inputs)).toEqual(["fuel", "suppressant", "suppressant_fraction"]);
    const fraction = info.inputs.suppressant_fraction;
    expect(fraction?.type === "float" && fraction.by_selector?.he).toEqual({
      min: 0.05,
      max: 0.45,
    });
  });
});
