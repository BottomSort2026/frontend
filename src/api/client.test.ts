import { describe, expect, it } from "vite-plus/test";
import { errorDetail, normalizeModelInfo } from "./client";

describe("error messages", () => {
  it("reads the gateway's and FastAPI's string detail", () => {
    expect(errorDetail({ error: "upstream_unreachable", detail: "The mcp service is down" })).toBe(
      "The mcp service is down",
    );
    expect(errorDetail({ detail: "o2 + suppressant_fraction must be at most 1" })).toBe(
      "o2 + suppressant_fraction must be at most 1",
    );
  });

  it("joins FastAPI validation errors", () => {
    expect(
      errorDetail({ detail: [{ loc: ["body", "o2"], msg: "too high" }, { msg: "unknown fuel" }] }),
    ).toBe("too high; unknown fuel");
  });

  it("returns null when nothing is readable", () => {
    expect(errorDetail(null)).toBeNull();
    expect(errorDetail({ detail: [] })).toBeNull();
    expect(errorDetail("  ")).toBeNull();
  });
});

describe("model-info envelope", () => {
  const inputs = { fuel: { type: "enum", values: ["methanol"] } };

  it("accepts inputs at the top level or under the outcome model", () => {
    expect(normalizeModelInfo({ inputs }).inputs).toEqual(inputs);
    expect(normalizeModelInfo({ outcome: { inputs }, extinction: { inputs: {} } }).inputs).toEqual(
      inputs,
    );
  });

  it("refuses a description without inputs", () => {
    expect(() => normalizeModelInfo({ model_version: "x" })).toThrow();
  });
});
