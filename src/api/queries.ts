import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { api } from "./client";
import type { PredictRequest } from "./types";

export const profilesQuery = queryOptions({
  queryKey: ["profiles"],
  queryFn: ({ signal }) => api.profiles(signal),
  staleTime: Infinity, // built offline, static for the life of the page
});

export const modelInfoQuery = queryOptions({
  queryKey: ["ml", "model-info"],
  queryFn: ({ signal }) => api.modelInfo(signal),
  staleTime: Infinity,
});

/** One prediction per distinct set of inputs. The previous answer stays on screen while the next loads. */
export function predictionQuery(inputs: PredictRequest | null) {
  return queryOptions({
    queryKey: ["ml", "predict", inputs],
    queryFn: ({ signal }) => api.predict(inputs!, signal),
    enabled: inputs !== null,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  });
}
