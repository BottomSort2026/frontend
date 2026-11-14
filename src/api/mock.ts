// Sample data so the frontend runs before the services exist. Facts come from the challenge
// brief and ARCHITECTURE.md; scores and predictions are placeholders and are flagged `sample`,
// so the interface can say so.

import {
  investigationUrl,
  type ChatReply,
  type ChatRequest,
  type ModelInfo,
  type PredictRequest,
  type PredictResponse,
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

// The illustrative model-info from ARCHITECTURE.md §5 (option A, FLEX). The real one comes from the ML service.
const MODEL_INFO: ModelInfo = {
  sample: true,
  model_version: "sample",
  training_source: "Sample output: the ML service is not connected",
  inputs: {
    fuel: { type: "enum", values: ["methanol", "heptane"] },
    pressure_atm: { type: "float", min: 0.69, max: 3.05, unit: "atm", default: 1 },
    o2: { type: "float", min: 0.12, max: 0.34, unit: "mole fraction", default: 0.21 },
    co2: { type: "float", min: 0, max: 0.7, unit: "mole fraction", default: 0 },
    he: { type: "float", min: 0, max: 0.45, unit: "mole fraction", default: 0 },
    droplet_d0_mm: { type: "float", min: 1.1, max: 4.67, unit: "mm", default: 3 },
  },
  outputs: ["outcome", "probabilities", "burning_rate_mm2_s", "extinction_diameter_mm"],
};

const num = (v: string | number | undefined, fallback: number) =>
  typeof v === "number" ? v : fallback;

/** A stand-in with the right shape and plausible directions. It is NOT a model and not for interpretation. */
function samplePrediction(req: PredictRequest): PredictResponse {
  const o2 = num(req.o2, 0.21);
  const dilution = num(req.co2, 0) + 0.8 * num(req.he, 0);
  const d0 = num(req.droplet_d0_mm, 3);
  const score = (o2 - 0.12) * 9 - dilution * 3.2; // more oxygen burns on, more diluent puts it out
  const completion = 1 / (1 + Math.exp(-(score - 1.2) * 2.4));
  const disruption = (1 - completion) * 0.2;
  const extinction = 1 - completion - disruption;
  const outcome = completion >= extinction ? "completion" : "extinction";
  return {
    outcome,
    probabilities: { extinction, completion, disruption },
    burning_rate_mm2_s: +(0.45 + (o2 - 0.12) * 1.4).toFixed(2),
    extinction_diameter_mm:
      outcome === "extinction" ? +(d0 * (0.25 + dilution * 0.6)).toFixed(2) : null,
    in_tested_range: true,
    out_of_range_fields: [],
    model_version: MODEL_INFO.model_version,
    training_source: MODEL_INFO.training_source,
  };
}

const MINI_BOOK = {
  title: "Combustion in Reduced Gravity (A Researcher's Guide to Combustion Science)",
  acronym: "NASA mini-book",
  public_url: "https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/",
};
const cite = (acronym: string, accession: string, title: string) => ({
  title,
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

export async function getModelInfo(): Promise<ModelInfo> {
  await wait(80);
  return MODEL_INFO;
}

export async function predict(req: PredictRequest): Promise<PredictResponse> {
  await wait(60);
  return samplePrediction(req);
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
