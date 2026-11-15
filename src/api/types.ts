// What the frontend expects from the gateway. docs/prediction_flow.md §5 and
// docs/frontend_flame_lab.md §8 for the Flame Lab: the routes and shapes below are the ones the
// gateway, the MCP and the engine implement.
//
//   GET  /lab/model-info   the models describing their own inputs (Flame Lab)
//   POST /lab/predict      one prediction plus its explanation (Flame Lab)
//   POST /chat             the agent (Chatbot)
//
// Everything stays tolerant of missing optional fields. The Information views (Investigations
// and Library) read no gateway route: they read the bundled report, src/investigations/report.ts.

export type Pillar = "prevention" | "detection" | "suppression";
export type Habitat = "spacecraft" | "station" | "moon_base" | "rover";

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
 * GET /lab/model-info. The Lab builds its controls from the top-level `inputs` (one control per
 * input, wide enough for both models), so no range is written in the frontend. An older envelope
 * with `inputs` under `outcome` is still accepted (see normalizeModelInfo in client.ts).
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
  /** The browser language as a BCP 47 tag, e.g. "en" or "es-CL". The explanation comes back in it. */
  language: string;
}

export type Confidence = "low" | "medium" | "high";
export type TestEnd = "extinction" | "completion" | "disruption";

export interface NearestTest {
  /** CIR test number, e.g. "205R001". */
  cir_id?: string | null;
  /** e.g. "FLEX-046": the key to its TestSheet. Null when the test has no published TestSheet. */
  testsheet_id?: string | null;
  /** The real outcome of that test: a TestEnd, or a value the frontend does not know yet. */
  test_end?: string | null;
  /** That real test's own conditions: fuel, pressure_atm, o2, co2, he, d0_mm. */
  conditions?: Record<string, number | string | null>;
  /** Standardized units, internal: used only for the order and against `threshold`. */
  distance?: number;
}

export interface TrainingSource {
  dataset?: string;
  accession?: string;
  /** Never shown. */
  sha256?: string;
  rows?: number;
}

/** The k-NN of one model: how much real data backs its prediction. */
export interface Support {
  in_tested_range?: boolean;
  out_of_range_fields?: string[];
  support_n?: number;
  /** The "near" distance of this model and fuel. Never shown as a number. */
  threshold?: number;
  confidence?: Confidence;
  /** Closest first. */
  nearest_tests?: NearestTest[];
}

/** Which model answered, to cite it. */
export interface ModelSource {
  model_version?: string;
  training_source?: TrainingSource;
}

export type OutcomeClass = "extinction" | "no_extinction";

/** One block per model: what it predicts, the k-NN behind it, and which model it is. */
export interface OutcomeBlock {
  prediction: {
    label: OutcomeClass;
    probabilities?: Partial<Record<OutcomeClass, number>>;
  };
  support?: Support;
  model?: ModelSource;
}

/** Always computed, shown only when the outcome label is extinction. */
export interface ExtinctionBlock {
  prediction?: {
    /** D_ext / D₀, 0..1. */
    extinction_diameter_ratio?: number;
    extinction_diameter_mm?: number;
    /** 1 − ratio³, computed by engine. The frontend never computes it. */
    fuel_burned_fraction?: number;
  };
  support?: Support;
  model?: ModelSource;
}

export interface CitedTest {
  testsheet_id: string | null;
  cir_id?: string | null;
  /** How the real test ended. */
  test_end?: string | null;
  /** The service's ready-made citation, e.g. "FLEX-046_TestSheet". FLEX (PSI-69), folder Raw Data. */
  label?: string;
  investigation_url?: string | null;
}

/** POST /lab/predict. `prediction` is engine's response, verbatim. */
export interface LabPredictResponse {
  prediction: { outcome: OutcomeBlock; extinction?: ExtinctionBlock };
  /** Null when the LLM failed: the numbers still stand. Shown in the assistant dock. */
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
