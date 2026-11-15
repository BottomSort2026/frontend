import { describe, expect, it } from "vite-plus/test";
import type { LabModelInfo, LabPredictResponse } from "../api/types";
import { conditionsLine, labCitations, labHistoryContent, predictionStatement } from "./labMessage";

const MODEL: LabModelInfo = {
  inputs: {
    fuel: { type: "enum", values: ["methanol", "heptane"] },
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
    droplet_d0_mm: { type: "float", min: 1.1, max: 4.7, unit: "mm" },
  },
};

const REFERENCE = {
  fuel: "methanol",
  pressure_atm: 1,
  o2: 0.21,
  suppressant: "none",
  suppressant_fraction: 0,
  droplet_d0_mm: 3,
};

const PREDICTION: LabPredictResponse["prediction"] = {
  outcome: {
    outcome: "extinction",
    probabilities: { extinction: 0.587, no_extinction: 0.413 },
    confidence: "medium",
    in_tested_range: true,
  },
  extinction: {
    extinction_diameter_ratio: 0.445,
    extinction_diameter_mm: 1.336,
    fuel_burned_fraction: 0.912,
  },
};

describe("conditions line", () => {
  it("reads the request in model-info's order", () => {
    expect(conditionsLine(MODEL, REFERENCE)).toBe(
      "methanol · 1.00 atm · 21 % O₂ · no suppressant · D₀ 3.00 mm",
    );
  });

  it("folds the gas into its amount", () => {
    expect(
      conditionsLine(MODEL, { ...REFERENCE, suppressant: "co2", suppressant_fraction: 0.1 }),
    ).toContain("21 % O₂ · 10 % CO₂ · D₀");
    expect(
      conditionsLine(MODEL, {
        ...REFERENCE,
        fuel: "heptane",
        suppressant: "he",
        suppressant_fraction: 0.15,
      }),
    ).toBe("heptane · 1.00 atm · 21 % O₂ · 15 % helium · D₀ 3.00 mm");
  });

  it("leaves out what was not sent", () => {
    expect(conditionsLine(MODEL, { fuel: "methanol", o2: 0.3 })).toBe("methanol · 30 % O₂");
  });
});

describe("prediction statement", () => {
  it("states the verdict, its probability and the droplet, from the prediction object", () => {
    expect(predictionStatement(PREDICTION)).toBe(
      "Predicted: the flame goes out on its own (59 %), medium confidence; droplet diameter at extinction 1.34 mm, 91 % of the fuel burned first.",
    );
  });

  it("gives no diameter when the flame does not go out", () => {
    const line = predictionStatement({
      ...PREDICTION,
      outcome: {
        outcome: "no_extinction",
        probabilities: { extinction: 0.3, no_extinction: 0.7 },
        in_tested_range: false,
      },
    });
    expect(line).toBe(
      "Predicted: the droplet burns out or breaks apart (70 %), outside the tested conditions.",
    );
  });

  it("copes with a bare prediction", () => {
    expect(predictionStatement({ outcome: { outcome: "extinction" } })).toBe(
      "Predicted: the flame goes out on its own.",
    );
  });
});

describe("history content", () => {
  it("is the conditions, the statement and the explanation, one per line", () => {
    const content = labHistoryContent("methanol · 1.00 atm", PREDICTION, "  It goes out.  ");
    expect(content.split("\n")).toEqual([
      "Flame Lab prediction for methanol · 1.00 atm.",
      predictionStatement(PREDICTION),
      "It goes out.",
    ]);
  });

  it("says so when there was no explanation", () => {
    expect(labHistoryContent("x", PREDICTION, null).split("\n")[2]).toBe(
      "No explanation was available for this prediction.",
    );
  });
});

describe("cited tests as citations", () => {
  it("names the TestSheet and links the investigation page", () => {
    expect(
      labCitations([
        {
          testsheet_id: "FLEX-007",
          investigation_url: "https://psi.nasa.gov/physci/repo/data/investigations/PSI-69",
        },
        {
          testsheet_id: null,
          cir_id: "205R001",
          investigation_url: "https://s3.example/file.txt?sig=x",
        },
        { testsheet_id: null, investigation_url: "x" },
      ]),
    ).toEqual([
      {
        doc_title: "FLEX-007 TestSheet",
        acronym: "FLEX",
        accession: "PSI-69",
        psi_folder: "Raw Data",
        investigation_url: "https://psi.nasa.gov/physci/repo/data/investigations/PSI-69",
      },
      {
        doc_title: "CIR test 205R001",
        acronym: "FLEX",
        accession: "PSI-69",
        psi_folder: "Raw Data",
        investigation_url: "https://psi.nasa.gov/physci/repo/data/investigations/PSI-69",
      },
    ]);
  });

  it("is empty when nothing was cited", () => {
    expect(labCitations(undefined)).toEqual([]);
  });
});
