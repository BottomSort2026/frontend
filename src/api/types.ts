// What the frontend expects from the gateway. ARCHITECTURE.md §5 and §6 for the profiles and the
// chat; docs/frontend_flame_lab.md §8 and docs/prediction_flow.md §5 for the Flame Lab, which win
// over ARCHITECTURE.md for the Lab.
//
//   GET  /profiles             static investigation profiles (Information view)
//   GET  /mcp/lab/model-info   the models describing their own inputs (Flame Lab, proposed name)
//   POST /mcp/lab/predict      one prediction plus its explanation (Flame Lab, proposed name)
//   POST /chat                 the agent (Chatbot)
//
// Still OPEN, so everything here stays tolerant: where profiles.json is hosted, the final Lab
// route and field names, and the /chat schema. The /chat types below are a PROPOSAL.

export type Pillar = "prevention" | "detection" | "suppression";
export type Habitat = "spacecraft" | "station" | "moon_base" | "rover";
type Range = [number, number] | null;

/** One entry of profiles.json. Only accession and acronym are assumed to be present. */
export interface InvestigationProfile {
  /** PSI accession, e.g. "PSI-25". */
  accession: string;
  acronym: string;
  title?: string;
  pillar?: Pillar[];
  hardware?: string;
  fuel_type?: string;
  fuels?: string[];
  sample_geometry?: string;
  o2_range?: Range;
  pressure_range_atm?: Range;
  airflow_cm_s?: Range;
  variables?: string[];
  constants?: string[];
  sensors?: string[];
  /** 0 to 3 per habitat. */
  habitat_relevance?: Partial<Record<Habitat, number>>;
  key_findings?: string[];
  citations?: string[];
}

export interface ProfileList {
  profiles: InvestigationProfile[];
  /** True while this is the built-in sample set and not the reviewed profiles.json. */
  sample: boolean;
}

export type ModelInput =
  | { type: "enum"; values: string[]; label?: string; default?: string }
  | {
      type: "float";
      min: number;
      max: number;
      unit?: string;
      label?: string;
      default?: number;
      /**
       * The range depends on the value of a choice: `suppressant_fraction` has one range per
       * `suppressant`. A choice missing here, or with min = max, means "not used": send 0.
       */
      by_selector?: Record<string, { min: number; max: number }>;
      /** The choice `by_selector` is keyed on. When absent, the choice whose values match its keys. */
      selector?: string;
    };

export type FloatInput = Extract<ModelInput, { type: "float" }>;

/**
 * GET /mcp/lab/model-info. The Lab builds its controls from the outcome model's inputs, so no
 * range is written in the frontend. The document does not fix the envelope: `inputs` may sit at
 * the top level or under `outcome` (see normalizeModelInfo in client.ts).
 */
export interface LabModelInfo {
  inputs: Record<string, ModelInput>;
  outputs?: string[];
  /** Set by the sample adapter only. */
  sample?: boolean;
}

/**
 * The six inputs of prediction_flow.md §5.1: fuel, pressure_atm, o2, suppressant,
 * suppressant_fraction, droplet_d0_mm. Typed loosely because the controls are built from
 * model-info, not from these names. Mole fractions are sent as fractions (0.21), never percent.
 */
export type LabInputs = Record<string, string | number>;

export interface LabPredictRequest {
  inputs: LabInputs;
  /** UI language, e.g. "en". The explanation comes back in it. */
  language: string;
}

export type Confidence = "low" | "medium" | "high";
export type TestEnd = "extinction" | "completion" | "disruption";

export interface NearestTest {
  /** CIR test number, e.g. "205R001". */
  cir_id?: string | null;
  /** e.g. "FLEX-007": the key to its TestSheet. Null when the test has no published TestSheet. */
  testsheet_id?: string | null;
  /** The real outcome of that test: a TestEnd, or a value the frontend does not know yet. */
  test_end?: string | null;
  /** Standardized units, internal: used only for the order. */
  distance?: number;
}

export interface TrainingSource {
  dataset?: string;
  accession?: string;
  /** Never shown. */
  sha256?: string;
  rows?: number;
}

/** The k-NN fields each block carries (prediction_flow.md §5.3). */
export interface Support {
  in_tested_range?: boolean;
  out_of_range_fields?: string[];
  support_n?: number;
  nearest_tests?: NearestTest[];
  confidence?: Confidence;
  model_version?: string;
  training_source?: TrainingSource;
}

export type OutcomeClass = "extinction" | "no_extinction";

export interface OutcomeBlock extends Support {
  outcome: OutcomeClass;
  probabilities?: Partial<Record<OutcomeClass, number>>;
}

/** Always computed, shown only when the outcome is extinction. */
export interface ExtinctionBlock extends Support {
  /** D_ext / D₀, 0..1. */
  extinction_diameter_ratio?: number;
  extinction_diameter_mm?: number;
  /** 1 − ratio³, computed by engine. The frontend never computes it. */
  fuel_burned_fraction?: number;
}

export interface CitedTest {
  testsheet_id: string | null;
  cir_id?: string | null;
  investigation_url: string;
}

/** POST /mcp/lab/predict. `prediction` is engine's response, verbatim. */
export interface LabPredictResponse {
  prediction: { outcome: OutcomeBlock; extinction?: ExtinctionBlock };
  /** Null when the LLM failed: the numbers still stand. Shown in the assistant dock (prompt 12). */
  explanation?: string | null;
  cited_tests?: CitedTest[];
  /**
   * Set by the sample adapter only: the inputs the fixture stands for (not the user's), and
   * whether it is the model cards' reference case or a hand-made variant to show a state.
   */
  sample?: { inputs: LabInputs; reference: boolean };
}

/**
 * Proposal for /chat. Field names follow the corpus chunk metadata (ARCHITECTURE.md §6), so the
 * agent can pass them through; formatted as decided in §5, decision 6 (see assistant/citation.ts).
 */
export interface Citation {
  doc_title: string;
  /** As written in the source, e.g. "TJ Shah, FJ Miller, S Olson, I Wichman". */
  doc_authors?: string | null;
  year?: number | null;
  page?: number | null;
  acronym?: string | null;
  accession?: string | null;
  /** PSI folder the document sits in, e.g. "Raw Data". */
  psi_folder?: string | null;
  /** PSI investigation page. Always set for PSI documents. Never a pre-signed file URL: those expire. */
  investigation_url?: string | null;
  /** Public NASA URL, for non-PSI resources only. */
  public_url?: string | null;
}

export interface ChatRequest {
  message: string;
  history: { role: "user" | "assistant"; content: string }[];
}

export interface ChatReply {
  answer: string;
  /** Empty when the assistant found nothing in the corpus to cite. */
  citations: Citation[];
}

export function investigationUrl(accession: string): string {
  return `https://psi.nasa.gov/physci/repo/data/investigations/${accession}`;
}
