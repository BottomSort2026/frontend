import { describe, expect, it } from "vite-plus/test";
import raw from "../data/investigations.json?raw";
import {
  coverageFor,
  HABITATS,
  listed,
  PILLARS,
  reportDate,
  shortName,
  sourceHref,
  type Cited,
  type InvestigationsReport,
} from "./report";

// The report the view really shows.
const report = JSON.parse(raw) as InvestigationsReport;
const all = report.investigations;

/** Every statement of an investigation that carries [n] markers. */
function statements(inv: (typeof all)[number]): { sources?: number[] }[] {
  const cited: ({ sources?: number[] } | null | undefined)[] = [
    inv.summary.plain,
    inv.summary.technical,
    ...Object.values(inv.scores),
    ...Object.values(inv.habitats),
    ...Object.values(inv.contributions),
    ...Object.values(inv.pillars),
    inv.data_for_modeling,
    ...inv.key_findings,
    ...inv.limitations,
    inv.profile.fuel_type,
  ];
  for (const value of Object.values(inv.profile))
    if (Array.isArray(value)) cited.push(...(value as Cited[]));
    else cited.push(value as Cited | null);
  return cited.filter((s) => s !== null && s !== undefined);
}

describe("the report is fully referenced", () => {
  it("has the 24 investigations in rank order", () => {
    expect(all).toHaveLength(24);
    expect(all.map((i) => i.rank)).toEqual(all.map((_, index) => index + 1));
  });

  it("points every [n] marker at a source of the same investigation", () => {
    for (const inv of all) {
      const known = new Set(inv.sources.map((s) => s.n));
      for (const statement of statements(inv))
        for (const n of statement.sources ?? [])
          expect(known.has(n), `${inv.accession} cites [${n}]`).toBe(true);
    }
  });

  it("backs every summary, finding and limitation with at least one source", () => {
    for (const inv of all)
      for (const item of [
        inv.summary.plain,
        inv.summary.technical,
        ...inv.key_findings,
        ...inv.limitations,
      ])
        expect(item.sources.length, `${inv.accession}: ${item.text.slice(0, 40)}`).toBeGreaterThan(
          0,
        );
  });

  it("gives every source a label, and links only to PSI or public pages", () => {
    for (const inv of all)
      for (const source of inv.sources) {
        expect(source.label.trim()).not.toBe("");
        const href = sourceHref(source);
        if (href) expect(href).toMatch(/^https:\/\/(psi\.nasa\.gov|[\w.-]*nasa\.gov)\//);
      }
  });

  it("names only known investigations in the synthesis and the coverage", () => {
    const known = new Set(all.map((i) => i.accession));
    const { overview, gaps, hardware_groups } = report.synthesis;
    const named = [
      ...overview.accessions,
      ...gaps.flatMap((g) => g.accessions),
      ...hardware_groups.flatMap((g) => [
        ...g.accessions,
        ...g.similarities.flatMap((s) => s.accessions),
        ...g.differences.flatMap((s) => s.accessions),
      ]),
      ...PILLARS.flatMap((p) => HABITATS.flatMap((h) => report.coverage[p][h])),
      ...HABITATS.flatMap((h) => report.habitat_top[h].map((t) => t.accession)),
    ];
    for (const accession of named) expect(known.has(accession), accession).toBe(true);
  });
});

describe("the ranking as shown", () => {
  it("keeps the report's order without filters", () => {
    expect(listed(all, {}).map((i) => i.rank)).toEqual(all.map((i) => i.rank));
  });

  it("keeps only the investigations that report on a pillar", () => {
    const detection = listed(all, { pillar: "detection" });
    expect(detection.length).toBeGreaterThan(0);
    expect(detection.length).toBeLessThan(all.length);
    expect(detection.every((i) => i.pillars.detection)).toBe(true);
  });

  it("orders by a habitat's score first, then by rank", () => {
    const moon = listed(all, { habitat: "moon_base" });
    for (let i = 1; i < moon.length; i++) {
      const a = moon[i - 1]!;
      const b = moon[i]!;
      const higher = a.habitats.moon_base.score > b.habitats.moon_base.score;
      const tie = a.habitats.moon_base.score === b.habitats.moon_base.score && a.rank < b.rank;
      expect(higher || tie, `${a.accession} before ${b.accession}`).toBe(true);
    }
    expect(moon.slice(0, 3).map((i) => i.accession)).toEqual(
      report.habitat_top.moon_base.map((t) => t.accession),
    );
  });

  it("does not reorder the report's own list", () => {
    const before = all.map((i) => i.accession);
    listed(all, { habitat: "rover" });
    expect(all.map((i) => i.accession)).toEqual(before);
  });
});

describe("coverage of a pillar", () => {
  it("is the report's list for one habitat", () => {
    expect(coverageFor(report, "suppression", "station")).toEqual(
      report.coverage.suppression.station,
    );
  });

  it("is every investigation that covers it somewhere, once, for all habitats", () => {
    const everywhere = coverageFor(report, "prevention", undefined);
    expect(new Set(everywhere).size).toBe(everywhere.length);
    for (const h of HABITATS)
      for (const accession of report.coverage.prevention[h])
        expect(everywhere).toContain(accession);
  });
});

describe("small helpers", () => {
  it("names an investigation by its acronym, or its accession when PSI gives none", () => {
    expect(shortName({ acronym: "FLEX", accession: "PSI-69" })).toBe("FLEX");
    expect(shortName({ acronym: null, accession: "PSI-62" })).toBe("PSI-62");
  });

  it("links a source to its PSI page, else its public page, never anything else", () => {
    const psi = "https://psi.nasa.gov/physci/repo/data/investigations/PSI-69";
    expect(sourceHref({ investigation_url: psi, public_url: null })).toBe(psi);
    expect(sourceHref({ investigation_url: null, public_url: "https://www.nasa.gov/x.pdf" })).toBe(
      "https://www.nasa.gov/x.pdf",
    );
    expect(sourceHref({ investigation_url: "javascript:alert(1)", public_url: null })).toBeNull();
    expect(sourceHref({ investigation_url: null, public_url: null })).toBeNull();
  });

  it("writes the report date in words", () => {
    expect(reportDate("2026-11-15T10:53:55.671Z")).toBe("15 November 2026");
    expect(reportDate("soon")).toBe("soon");
  });
});
