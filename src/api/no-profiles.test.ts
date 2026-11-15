import { QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { investigationsQuery } from "./queries";

// Library reads the bundled investigations report. GET /profiles was never built (the gateway
// answers 404 profiles_not_built), so nothing in the app may ask for it.
const PATH = "/" + "profiles"; // split so this file does not match its own check

describe("no request to the profiles route", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("is written nowhere in the app or its dev proxy", () => {
    const files = import.meta.glob<string>(
      ["/src/**/*.{ts,tsx}", "/vite.config.ts", "/.env.example"],
      { query: "?raw", import: "default", eager: true },
    );
    expect(Object.keys(files).length).toBeGreaterThan(20);
    const offenders = Object.entries(files)
      .filter(([, text]) => text.includes(PATH))
      .map(([file]) => file);
    expect(offenders).toEqual([]);
  });

  it("is not sent when Library's data loads", async () => {
    const report = { investigations: [] };
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(report), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const client = new QueryClient();
    await expect(client.fetchQuery(investigationsQuery)).resolves.toEqual(report);
    const urls = fetchMock.mock.calls.map((call) => String((call as unknown[])[0]));
    expect(urls).toHaveLength(1);
    expect(urls[0]).toMatch(/investigations[^/]*\.json$/);
    expect(urls.some((u) => u.includes(PATH))).toBe(false);
  });
});
