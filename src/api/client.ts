// The one place that talks to the gateway (ARCHITECTURE.md §5). The gateway is the single entry
// point, so in production every path is same-origin.
//
//   VITE_API_URL unset or empty   sample data from mock.ts, no network
//   VITE_API_URL=/                same origin, behind the gateway (and through the dev proxy)
//   VITE_API_URL=http://host:port another origin

import * as mock from "./mock";
import type {
  ChatReply,
  ChatRequest,
  InvestigationProfile,
  ModelInfo,
  PredictRequest,
  PredictResponse,
  ProfileList,
} from "./types";

const RAW: string = import.meta.env.VITE_API_URL ?? "";
const BASE = RAW.replace(/\/+$/, "");

/** True when a gateway is configured. Without one the app serves its built-in sample data. */
export const hasBackend = RAW.length > 0;

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (!res.ok)
    throw new ApiError(res.status, `${init?.method ?? "GET"} ${path} failed with ${res.status}`);
  return (await res.json()) as T;
}

const post = (body: unknown, signal?: AbortSignal): RequestInit => ({
  method: "POST",
  body: JSON.stringify(body),
  signal,
});

export const api = {
  /** profiles.json may be a bare array or wrapped in { profiles }: its hosting is still OPEN. */
  async profiles(signal?: AbortSignal): Promise<ProfileList> {
    if (!hasBackend) return mock.getProfiles();
    const data = await request<InvestigationProfile[] | { profiles: InvestigationProfile[] }>(
      "/profiles",
      { signal },
    );
    return { profiles: Array.isArray(data) ? data : data.profiles, sample: false };
  },
  modelInfo(signal?: AbortSignal): Promise<ModelInfo> {
    return hasBackend ? request<ModelInfo>("/ml/model-info", { signal }) : mock.getModelInfo();
  },
  predict(body: PredictRequest, signal?: AbortSignal): Promise<PredictResponse> {
    return hasBackend
      ? request<PredictResponse>("/ml/predict", post(body, signal))
      : mock.predict(body);
  },
  chat(body: ChatRequest): Promise<ChatReply> {
    return hasBackend ? request<ChatReply>("/chat", post(body)) : mock.chat(body);
  },
};
