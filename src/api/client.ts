// The one place that talks to the gateway (ARCHITECTURE.md §5). The gateway is the single entry
// point, so in production every path is same-origin.
//
//   VITE_API_URL unset or empty   sample data from mock.ts, no network
//   VITE_API_URL=/                same origin, behind the gateway (and through the dev proxy)
//   VITE_API_URL=http://host:port another origin

// The investigations report ships with the app as its own file: fetched only when the
// Investigations view opens, from the app's origin, with or without a gateway.
import investigationsUrl from "../data/investigations.json?url";
import type { InvestigationsReport } from "../investigations/report";
import { uiLanguage } from "../lib/language";
import { ApiError } from "./errors";
import * as mock from "./mock";
import type {
  ChatReply,
  ChatRequest,
  InvestigationProfile,
  LabInputs,
  LabModelInfo,
  LabPredictRequest,
  LabPredictResponse,
  ModelInput,
  ProfileList,
} from "./types";

const RAW: string = import.meta.env.VITE_API_URL ?? "";
const BASE = RAW.replace(/\/+$/, "");

export { ApiError, errorDetail } from "./errors";

/** True when a gateway is configured. Without one the app serves its built-in sample data. */
export const hasBackend = RAW.length > 0;

// The Flame Lab routes: the gateway sends them to the MCP under the same path.
export const LAB_MODEL_INFO_PATH = "/lab/model-info";
export const LAB_PREDICT_PATH = "/lab/predict";
// Answered by the gateway itself: a file kept in its repository, with no service behind it.
export const TRAINING_DATA_PATH = "/datasets/flex-training.csv";

/**
 * Where the Flame Lab's training CSV downloads from. A plain link, not a fetch: the gateway sends
 * it as an attachment and the browser saves it. Null without a gateway: there is nothing to serve.
 */
export const trainingDataUrl: string | null = hasBackend ? BASE + TRAINING_DATA_PATH : null;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {
      // not JSON: keep the text
    }
    throw new ApiError(
      res.status,
      `${init?.method ?? "GET"} ${path} failed with ${res.status}`,
      body,
    );
  }
  return (await res.json()) as T;
}

const post = (body: unknown, signal?: AbortSignal): RequestInit => ({
  method: "POST",
  body: JSON.stringify(body),
  signal,
});

/**
 * model-info sends the controls' `inputs` at the top level (and each model's own under `outcome`
 * and `extinction`). The older envelope, inputs only under `outcome`, is still accepted. Anything
 * else is an error, not a guess.
 */
export function normalizeModelInfo(raw: unknown): LabModelInfo {
  const r = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const outcome = r.outcome as Record<string, unknown> | undefined;
  const inputs = (r.inputs ?? outcome?.inputs) as Record<string, ModelInput> | undefined;
  if (!inputs || typeof inputs !== "object")
    throw new ApiError(200, "model-info has no inputs", raw);
  const outputs = (r.outputs ?? outcome?.outputs) as string[] | undefined;
  return { inputs, outputs: Array.isArray(outputs) ? outputs : undefined };
}

export const api = {
  /**
   * profiles.json may be a bare array or wrapped in { profiles }: its hosting is still open.
   * While it is not built (the gateway answers 404), the built-in sample set is served, labelled
   * as a sample.
   */
  async profiles(signal?: AbortSignal): Promise<ProfileList> {
    if (!hasBackend) return mock.getProfiles();
    try {
      const data = await request<InvestigationProfile[] | { profiles: InvestigationProfile[] }>(
        "/profiles",
        { signal },
      );
      return { profiles: Array.isArray(data) ? data : data.profiles, sample: false };
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return mock.getProfiles();
      throw e;
    }
  },
  /** The generated report behind the Investigations view. Not a gateway route: a file of the app. */
  async investigations(signal?: AbortSignal): Promise<InvestigationsReport> {
    const res = await fetch(investigationsUrl, { signal, headers: { Accept: "application/json" } });
    if (!res.ok)
      throw new ApiError(res.status, `GET investigations.json failed with ${res.status}`);
    return (await res.json()) as InvestigationsReport;
  },
  async labModelInfo(signal?: AbortSignal): Promise<LabModelInfo> {
    if (!hasBackend) return mock.getLabModelInfo();
    return normalizeModelInfo(await request<unknown>(LAB_MODEL_INFO_PATH, { signal }));
  },
  /** One press of Predict. `fixture` picks a sample state and is ignored with a backend. */
  labPredict(inputs: LabInputs, fixture?: mock.SampleFixture): Promise<LabPredictResponse> {
    const body: LabPredictRequest = { inputs, language: uiLanguage() };
    return hasBackend
      ? request<LabPredictResponse>(LAB_PREDICT_PATH, post(body))
      : mock.labPredict(body, fixture);
  },
  chat(body: ChatRequest): Promise<ChatReply> {
    return hasBackend ? request<ChatReply>("/chat", post(body)) : mock.chat(body);
  },
};
