import { useRouter } from "@tanstack/react-router";
import { useCallback, useEffect } from "react";
import { starById, type StarDef } from "./stars";

/**
 * Loads a section ahead of the trip: its route code, and through the route's loader its data
 * (the investigations report, read by both Investigations and Library, goes into the query cache
 * under the key they read). Calling it again is cheap: loaded code and fresh data are not fetched twice.
 * A failure is ignored here; the section shows its own error state when it opens.
 */
export function useSectionPreload(): (star: StarDef) => void {
  const router = useRouter();
  return useCallback(
    (star: StarDef) => {
      router.preloadRoute({ to: star.path }).catch(() => {});
    },
    [router],
  );
}

/**
 * Once `ready` turns true, preloads Investigations when the browser is next idle: its route code
 * and its report, the one large download. The other sections load on hover or focus of their star
 * (and on the click), so the sky alone sends nothing to the gateway.
 */
export function usePreloadInvestigationsWhenIdle(ready: boolean): void {
  const preload = useSectionPreload();
  useEffect(() => {
    if (!ready) return;
    const run = () => preload(starById("investigations"));
    // Safari has no requestIdleCallback.
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(run, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(run, 200);
    return () => window.clearTimeout(id);
  }, [ready, preload]);
}
