import { describe, expect, it } from "vite-plus/test";
import { parseDuration } from "./tokens";

describe("parseDuration", () => {
  it("reads milliseconds, as the source tokens are written", () => {
    expect(parseDuration("900ms")).toBeCloseTo(0.9);
    expect(parseDuration(" 260ms ")).toBeCloseTo(0.26);
  });

  it("reads seconds, as the production minifier writes them", () => {
    expect(parseDuration(".9s")).toBeCloseTo(0.9);
    expect(parseDuration("0.9s")).toBeCloseTo(0.9);
    expect(parseDuration("0s")).toBe(0);
  });

  it("returns null for anything that is not a CSS time, so the fallback applies", () => {
    expect(parseDuration("")).toBeNull();
    expect(parseDuration("auto")).toBeNull();
    expect(parseDuration("9")).toBeNull();
  });
});
