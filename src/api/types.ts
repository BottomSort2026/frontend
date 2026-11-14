// What the frontend expects from the gateway, following ARCHITECTURE.md §5 and §6.
//
//   GET  /profiles        static investigation profiles (Information view)
//   GET  /ml/model-info   the model describing its own inputs (Simulator)
//   POST /ml/predict      one prediction (Simulator)
//   POST /chat            the agent (Chatbot)
//
// Still OPEN in the architecture, so everything here stays tolerant: the prediction target
// (which decides the /ml/* fields), where profiles.json is hosted, and the /chat schema,
// which the document does not define yet. The /chat types below are a PROPOSAL.

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
  | { type: "float"; min: number; max: number; unit?: string; label?: string; default?: number };

/** GET /ml/model-info: the simulator builds its controls from this, so limits are never hard-coded. */
export interface ModelInfo {
  model_version: string;
  training_source: string;
  inputs: Record<string, ModelInput>;
  outputs: string[];
  /** Set by the sample adapter only. */
  sample?: boolean;
}

export type PredictRequest = Record<string, string | number>;

/** POST /ml/predict. The outputs named in ModelInfo.outputs arrive as top-level fields. */
export interface PredictResponse {
  in_tested_range?: boolean;
  out_of_range_fields?: string[];
  model_version?: string;
  training_source?: string;
  [output: string]: unknown;
}

/** Proposal. Mirrors the corpus chunk metadata: cite the document and page, link the PSI investigation page. */
export interface Citation {
  title: string;
  page?: number | null;
  acronym?: string | null;
  accession?: string | null;
  /** PSI investigation page. Never a pre-signed file URL: those expire. */
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
