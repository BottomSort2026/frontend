import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { api } from "./client";
import type { SampleFixture } from "./mock";
import type { LabInputs } from "./types";

export const profilesQuery = queryOptions({
  queryKey: ["profiles"],
  queryFn: ({ signal }) => api.profiles(signal),
  staleTime: Infinity, // built offline, static for the life of the page
});

export const investigationsQuery = queryOptions({
  queryKey: ["investigations"],
  queryFn: ({ signal }) => api.investigations(signal),
  staleTime: Infinity, // generated offline, static for the life of the page
});

export const modelInfoQuery = queryOptions({
  queryKey: ["lab", "model-info"],
  queryFn: ({ signal }) => api.labModelInfo(signal),
  staleTime: Infinity,
});

/**
 * One prediction per press of Predict, never on input change: each one costs an LLM call.
 * `fixture` selects a sample state (`?sample=` on /flame-lab) and only matters without a backend.
 */
export function predictMutation(fixture?: SampleFixture) {
  return mutationOptions({
    mutationKey: ["lab", "predict"],
    mutationFn: (inputs: LabInputs) => api.labPredict(inputs, fixture),
  });
}
