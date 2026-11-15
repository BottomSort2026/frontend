import {
  mutationOptions,
  queryOptions,
  type FetchQueryOptions,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
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

/**
 * Fills the cache before a view needs it (route loaders, the sky's preload), never blocking on it.
 * A failure is not kept unless a view is already waiting on the query: the next view that reads it
 * fetches again and shows its own error state.
 */
export async function warmQuery<TData, TKey extends QueryKey>(
  client: QueryClient,
  options: FetchQueryOptions<TData, Error, TData, TKey>,
): Promise<void> {
  await client.prefetchQuery(options);
  const query = client.getQueryCache().find({ queryKey: options.queryKey, exact: true });
  if (query?.state.status === "error" && query.getObserversCount() === 0)
    client.removeQueries({ queryKey: options.queryKey, exact: true });
}
