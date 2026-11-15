import { describe, expect, it } from "vite-plus/test";
import raw from "../data/investigations.json?raw";
import { coverageFor, HABITATS, listed, PILLARS, type InvestigationsReport } from "./report";
import { slimReport } from "./slim";

const full = JSON.parse(raw) as InvestigationsReport;
const slim = slimReport(full);

/** Every leaf of `part`, with its path, must sit at the same path in `whole` with the same value. */
function expectSubset(part: unknown, whole: unknown, path = "report"): void {
  if (part !== null && typeof part === "object") {
    expect(whole, path).toBeTypeOf("object");
    for (const [key, value] of Object.entries(part))
      expectSubset(value, (whole as Record<string, unknown>)[key], `${path}.${key}`);
  } else {
    expect(whole, path).toBe(part);
  }
}

describe("the slim report", () => {
  it("only removes fields, never changes one", () => {
    expectSubset(slim, full);
  });

  it("keeps every statement and source the view shows", () => {
    expect(slim.investigations).toHaveLength(full.investigations.length);
    slim.investigations.forEach((inv, i) => {
      const was = full.investigations[i]!;
      expect(inv.sources.map((s) => s.n)).toEqual(was.sources.map((s) => s.n));
      expect(inv.key_findings).toEqual(was.key_findings);
      expect(inv.profile).toEqual(was.profile);
    });
    expect(slim.synthesis.hardware_groups).toEqual(full.synthesis.hardware_groups);
  });

  it("ranks and covers exactly like the full report", () => {
    for (const habitat of [undefined, ...HABITATS])
      for (const pillar of [undefined, ...PILLARS]) {
        const accessions = (r: InvestigationsReport) =>
          listed(r.investigations, { habitat, pillar }).map((i) => i.accession);
        expect(accessions(slim)).toEqual(accessions(full));
        if (pillar)
          expect(coverageFor(slim, pillar, habitat)).toEqual(coverageFor(full, pillar, habitat));
      }
  });

  it("drops what the view does not render", () => {
    const text = JSON.stringify(slim);
    for (const field of ["review_flags", "doc_title", "file_name", "usage", "challenge_sha256"])
      expect(text).not.toContain(`"${field}"`);
    expect(text.length).toBeLessThan(JSON.stringify(full).length * 0.9);
  });
});
