// The one place that talks to the gateway (ARCHITECTURE.md §5). The gateway is the single entry
// point, so in production every path is same-origin.
//
//   VITE_API_URL unset or empty   sample data from mock.ts, no network
//   VITE_API_URL=/                same origin, behind the gateway (and through the dev proxy)
//   VITE_API_URL=http://host:port another origin

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

// The Flame Lab routes (docs/frontend_flame_lab.md §8). Proposed names: a rename is one line here.
export const LAB_MODEL_INFO_PATH = "/mcp/lab/model-info";
export const LAB_PREDICT_PATH = "/mcp/lab/predict";

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
 * The document does not fix model-info's envelope: the controls use the outcome model's inputs,
 * which may arrive at the top level or under `outcome`. Anything else is an error, not a guess.
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
  /** profiles.json may be a bare array or wrapped in { profiles }: its hosting is still OPEN. */
  async profiles(signal?: AbortSignal): Promise<ProfileList> {
    if (!hasBackend) return mock.getProfiles();
    const data = await requestOrMock<InvestigationProfile[] | { profiles: InvestigationProfile[] }>(
      "/profiles",
      () => mock.getProfiles(),
      { signal },
    );
    return { profiles: Array.isArray(data) ? data : data.profiles, sample: false };
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
