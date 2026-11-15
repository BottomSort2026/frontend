// Sample data so the frontend runs before the services exist. Facts come from the challenge
// brief and ARCHITECTURE.md; scores and predictions are placeholders and are flagged `sample`,
// so the interface can say so.

import { ApiError } from "./errors";
import {
  investigationUrl,
  type Citation,
  type ChatReply,
  type ChatRequest,
  type ExtinctionBlock,
  type LabModelInfo,
  type LabPredictRequest,
  type LabPredictResponse,
  type NearestTest,
  type OutcomeBlock,
  type ProfileList,
} from "./types";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const PROFILES: ProfileList = {
  sample: true,
  profiles: [
    {
      accession: "PSI-25",
      acronym: "BASS-II",
      title: "Burning and Suppression of Solids II",
      pillar: ["prevention", "suppression"],
      hardware: "MSG, SPICE flow duct",
      fuel_type: "solid",
      fuels: ["PMMA", "SIBAL", "Nomex"],
      variables: ["material", "thickness", "flow speed", "O₂"],
      habitat_relevance: { spacecraft: 3, station: 3, moon_base: 3, rover: 2 },
      key_findings: ["129 tests of how solid materials burn and go out in a low-speed flow duct."],
    },
    {
      accession: "PSI-98",
      acronym: "SAFFIRE-I",
      title: "Spacecraft Fire Safety Demonstration",
      pillar: ["prevention"],
      hardware: "Uncrewed Cygnus vehicle",
      fuel_type: "solid",
      habitat_relevance: { spacecraft: 3, station: 3, moon_base: 2, rover: 2 },
      key_findings: [
        "Large-scale fire on an uncrewed vehicle: flammability of solid materials at real scale.",
      ],
    },
    {
      accession: "PSI-69",
      acronym: "FLEX",
      title: "Flame Extinguishment Experiment",
      pillar: ["suppression"],
      hardware: "MDCA in the CIR",
      fuel_type: "liquid droplet",
      fuels: ["methanol", "heptane"],
      o2_range: [0.12, 0.34],
      pressure_range_atm: [0.69, 3.05],
      variables: ["fuel", "pressure", "O₂", "diluent (N₂, CO₂, He)", "droplet diameter"],
      habitat_relevance: { spacecraft: 2, station: 3, moon_base: 3, rover: 2 },
      key_findings: [
        "274 droplet tests of flame extinction while the atmosphere is diluted with carbon dioxide or helium.",
      ],
    },
    {
      accession: "PSI-102",
      acronym: "SAME",
      title: "Smoke and Aerosol Measurement Experiment",
      pillar: ["detection"],
      fuel_type: "smoke and aerosol",
      habitat_relevance: { spacecraft: 3, station: 3, moon_base: 2, rover: 3 },
      key_findings: [
        "Smoke particle measurements in microgravity, the basis for spacecraft smoke detectors.",
      ],
    },
    {
      accession: "PSI-20",
      acronym: "ACME-BRE",
      title: "Burning Rate Emulator",
      pillar: ["prevention"],
      hardware: "ACME modules in the CIR",
      fuel_type: "gas",
      habitat_relevance: { spacecraft: 2, station: 2, moon_base: 2, rover: 1 },
      key_findings: [
        "Gaseous fuel standing in for condensed materials: flammability in still air as a function of material properties.",
      ],
    },
    {
      accession: "PSI-107",
      acronym: "SPICE",
      title: "Smoke Point In Co-flow Experiment",
      pillar: ["detection", "prevention"],
      hardware: "MSG, SPICE flow duct",
      fuel_type: "gas",
      habitat_relevance: { spacecraft: 1, station: 2, moon_base: 1, rover: 1 },
      key_findings: [
        "Smoke point of gas-jet flames in a co-flow of air: when a flame starts to release soot.",
      ],
    },
  ],
};

// Flame Lab. Ranges are the rounded ones of prediction_flow.md §5.1; the real ones come from
// GET /lab/model-info. Predictions are fixtures built from the model cards' reference query
// `iss_like_air` (docs/frontend_flame_lab.md §8). The sample adapter returns a fixture whatever the
// inputs are: it never pretends to depend on them, and the interface says so.
const LAB_MODEL_INFO: LabModelInfo = {
  sample: true,
  inputs: {
    fuel: { type: "enum", values: ["methanol", "heptane"], default: "methanol" },
    pressure_atm: { type: "float", min: 0.69, max: 1.02, unit: "atm", default: 1 },
    o2: { type: "float", min: 0.12, max: 0.34, unit: "mole fraction", default: 0.21 },
    suppressant: { type: "enum", values: ["none", "co2", "he"], default: "none" },
    suppressant_fraction: {
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
    },
    droplet_d0_mm: { type: "float", min: 1.1, max: 4.7, unit: "mm", default: 3 },
  },
  outputs: ["label", "probabilities"],
};

/** The query the fixtures were computed for. */
const REFERENCE_INPUTS = {
  fuel: "methanol",
  pressure_atm: 1,
  o2: 0.21,
  suppressant: "none",
  suppressant_fraction: 0,
  droplet_d0_mm: 3,
};

const SOURCE = { dataset: "flex_tests", accession: "PSI-69", sha256: "sample" };
// Placeholder IDs that look like placeholders. The real ones come from the k-NN.
const near = (n: number, ends: string[]): NearestTest[] =>
  ends.map((test_end, i) => ({
    testsheet_id: `FLEX-0N${n + i}`,
    cir_id: `CIR-0N${n + i}`,
    test_end,
    conditions: {
      fuel: "methanol",
      pressure_atm: 1,
      o2: 0.21,
      co2: 0,
      he: 0,
      d0_mm: +(2.8 + i * 0.1).toFixed(2),
    },
    distance: 0.2 + i * 0.1,
  }));

// Each block as engine sends it: what the model predicts, its k-NN, and which model it is.
const OUTCOME: OutcomeBlock = {
  prediction: {
    label: "extinction",
    probabilities: { extinction: 0.587, no_extinction: 0.413 },
  },
  support: {
    in_tested_range: true,
    out_of_range_fields: [],
    support_n: 10,
    threshold: 0.83,
    confidence: "medium",
    nearest_tests: near(1, ["extinction", "extinction", "disruption", "extinction", "completion"]),
  },
  model: { model_version: "flex-outcome-0.2", training_source: { ...SOURCE, rows: 251 } },
};

const EXTINCTION: ExtinctionBlock = {
  prediction: {
    extinction_diameter_ratio: 0.445,
    extinction_diameter_mm: 1.336,
    fuel_burned_fraction: 0.912,
  },
  support: {
    in_tested_range: true,
    out_of_range_fields: [],
    support_n: 11,
    threshold: 1.016,
    confidence: "high",
    // Two of these are also the outcome model's neighbours: the Lab lists each test once.
    nearest_tests: [
      ...near(1, ["extinction", "extinction"]),
      ...near(6, ["extinction", "extinction", "extinction"]),
    ],
  },
  model: { model_version: "flex-extinction-0.2", training_source: { ...SOURCE, rows: 156 } },
};

const EXPLANATION =
  "Sample explanation: the assistant service is not connected, so this text was not written for these conditions.";

const reference = (
  prediction: LabPredictResponse["prediction"],
  isReference = false,
): LabPredictResponse => ({
  prediction,
  explanation: EXPLANATION,
  cited_tests: [
    {
      testsheet_id: "FLEX-0N1",
      cir_id: "CIR-0N1",
      test_end: "extinction",
      label: '"FLEX-0N1_TestSheet". FLEX (PSI-69), folder Raw Data.',
      investigation_url: investigationUrl("PSI-69"),
    },
  ],
  sample: { inputs: REFERENCE_INPUTS, reference: isReference },
});

/** The states reachable by hand with /flame-lab?sample=<name>, in sample mode only. */
export const SAMPLE_FIXTURES = [
  "no_extinction",
  "out_of_range",
  "no_explanation",
  "invalid",
  "down",
] as const;
export type SampleFixture = (typeof SAMPLE_FIXTURES)[number];

function fixture(name: SampleFixture | undefined): LabPredictResponse {
  switch (name) {
    case "no_extinction":
      return reference({
        outcome: {
          ...OUTCOME,
          prediction: {
            label: "no_extinction",
            probabilities: { extinction: 0.318, no_extinction: 0.682 },
          },
          support: {
            ...OUTCOME.support,
            nearest_tests: near(1, [
              "completion",
              "disruption",
              "completion",
              "extinction",
              "disruption",
            ]),
          },
        },
        extinction: EXTINCTION,
      });
    case "out_of_range":
      return reference({
        outcome: OUTCOME,
        extinction: {
          ...EXTINCTION,
          support: {
            ...EXTINCTION.support,
            in_tested_range: false,
            out_of_range_fields: ["o2"],
            support_n: 0,
            confidence: "low",
          },
        },
      });
    case "no_explanation":
      return {
        ...reference({ outcome: OUTCOME, extinction: EXTINCTION }, true),
        explanation: null,
      };
    case "invalid":
      throw new ApiError(422, "POST /lab/predict failed with 422", {
        error: "invalid_inputs",
        detail: "Sample error: o2 + suppressant_fraction must be at most 1.",
      });
    case "down":
      throw new ApiError(502, "POST /lab/predict failed with 502", {
        error: "upstream_unavailable",
        detail: "Sample error: the mcp service is not reachable",
      });
    default:
      return reference({ outcome: OUTCOME, extinction: EXTINCTION }, true);
  }
}

// Title and authors as ARCHITECTURE.md §6 gives them; the year is the one in its NASA number,
// NP-2015-10-034-JSC. No page: sample answers do not point at a real page.
const MINI_BOOK: Citation = {
  doc_title: "Combustion in Reduced Gravity",
  doc_authors: "Gokoglu, Dietrich, Stocker, Ferkul, Olson and Hicks",
  year: 2015,
  acronym: "NASA mini-book",
  public_url: "https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/",
};
const cite = (acronym: string, accession: string, doc_title: string): Citation => ({
  doc_title,
  acronym,
  accession,
  investigation_url: investigationUrl(accession),
});

const ANSWERS: { q: string; reply: ChatReply }[] = [
  {
    q: "Why are flames round in space?",
    reply: {
      answer:
        "On Earth, hot gases rise and stretch a flame into a teardrop. In free fall there is no buoyancy, so nothing rises: a candle flame becomes a faint blue sphere that gets its oxygen by diffusion alone.",
      citations: [MINI_BOOK, cite("FLEX", "PSI-69", "Flame Extinguishment Experiment")],
    },
  },
  {
    q: "Is 30 % oxygen risky on the Moon?",
    reply: {
      answer:
        "It raises the stakes. The Moon Base is expected to run at 30 % oxygen or more, at 10.2 psi or less. That is over 40 % more oxygen than Earth air, which makes materials much more flammable, so flammability limits from BASS-II and Saffire matter for choosing materials.",
      citations: [
        cite("BASS-II", "PSI-25", "Burning and Suppression of Solids II"),
        cite("SAFFIRE-I", "PSI-98", "Spacecraft Fire Safety Demonstration"),
      ],
    },
  },
  {
    q: "How was suppression tested?",
    reply: {
      answer:
        "FLEX, the Flame Extinguishment Experiment, burned droplets of liquid fuel in the Combustion Integrated Rack and diluted the chamber atmosphere with carbon dioxide and helium. Both suppress fire.",
      citations: [cite("FLEX", "PSI-69", "Flame Extinguishment Experiment")],
    },
  },
];

export const SUGGESTIONS: readonly string[] = ANSWERS.map((a) => a.q);

export async function getProfiles(): Promise<ProfileList> {
  await wait(120);
  return PROFILES;
}

export async function getLabModelInfo(): Promise<LabModelInfo> {
  await wait(80);
  return LAB_MODEL_INFO;
}

/** As slow as a real request with an LLM call in it, so the waiting state can be seen. */
export async function labPredict(
  _req: LabPredictRequest,
  name?: SampleFixture,
): Promise<LabPredictResponse> {
  await wait(1500);
  return fixture(name);
}

export async function chat(req: ChatRequest): Promise<ChatReply> {
  await wait(1500);
  const asked = req.message.trim().toLowerCase();
  const hit = ANSWERS.find((a) => a.q.toLowerCase() === asked);
  return (
    hit?.reply ?? {
      answer:
        "I am running on sample data, so I am not connected to the PSI corpus yet. Once the assistant service is online, this answer arrives with its citations.",
      citations: [],
    }
  );
}
