import { describe, expect, it } from "vite-plus/test";
import raw from "../data/investigations.json?raw";
import { HABITATS, type Investigation, type InvestigationsReport } from "../investigations/report";
import { failedAccessions, slimReport } from "../investigations/slim";
import {
  filterCards,
  fuelGlyph,
  fuelLabel,
  isRelevant,
  RELEVANT_SCORE,
  toCard,
  type LibraryCard,
} from "./card";

const full = JSON.parse(raw) as InvestigationsReport;
// What the app downloads: the cards are built from the slim copy, as in the browser.
const report = slimReport(full);
const cards = report.investigations.map(toCard);
const byAccession = (a: string) => report.investigations.find((i) => i.accession === a)!;

describe("a report record as a Library card", () => {
  it("maps every field the card renders", () => {
    const card = toCard(byAccession("PSI-69"));
    const p = byAccession("PSI-69").profile;
    expect(card).toMatchObject({
      accession: "PSI-69",
      name: "FLEX",
      title: "Flame Extinguishment Experiment",
      url: "https://psi.nasa.gov/physci/repo/data/investigations/PSI-69",
      fuelType: "liquid",
      fuels: p.fuels!.text,
      hardware: p.hardware!.text,
      oxygen: p.oxygen!.text,
      pressure: p.pressure!.text,
      airflow: p.airflow!.text,
      pillars: ["prevention", "suppression"],
      habitats: { spacecraft: 3, station: 3, moon_base: 3, rover: 3 },
    });
    expect(card.sensors).toEqual(p.sensors.map((s) => s.text));
  });

  it("keeps a record whose fields are null, with those fields empty", () => {
    // PSI-115 states no fuel type, oxygen, pressure or sensors.
    const card = toCard(byAccession("PSI-115"));
    expect(card.name).toBe("PSI-115"); // no acronym
    expect(card).toMatchObject({ fuelType: null, oxygen: null, pressure: null, sensors: [] });
    expect(fuelLabel(card.fuelType)).toBeNull();
    expect(card.hardware).not.toBeNull();
  });

  it("survives a record with no profile, pillars or habitats at all", () => {
    const bare = {
      rank: 99,
      accession: "PSI-0",
      acronym: "  ",
      title: "Bare",
      investigation_url: "javascript:alert(1)",
    } as unknown as Investigation;
    expect(toCard(bare)).toEqual({
      accession: "PSI-0",
      name: "PSI-0",
      title: "Bare",
      url: "https://psi.nasa.gov/physci/repo/data/investigations/PSI-0",
      fuelType: null,
      fuels: null,
      hardware: null,
      oxygen: null,
      pressure: null,
      airflow: null,
      sensors: [],
      pillars: [],
      habitats: { spacecraft: 0, station: 0, moon_base: 0, rover: 0 },
    } satisfies LibraryCard);
  });

  it("names the fuel types the report uses", () => {
    expect(["solid", "liquid", "gas", "none"].map(fuelLabel)).toEqual([
      "Solid",
      "Liquid",
      "Gas",
      "No fuel",
    ]);
    expect(fuelGlyph("liquid droplet")).toBe("liquid");
    expect(fuelGlyph("none")).toBeUndefined();
  });
});

describe("the Library list", () => {
  it("shows every ranked investigation with no filter", () => {
    expect(report.investigations).toHaveLength(full.investigations.length);
    expect(filterCards(cards, {}).map((c) => c.accession)).toEqual(
      full.investigations.map((i) => i.accession),
    );
  });

  it("keeps a habitat's investigations from a score of 2 out of 3", () => {
    expect(RELEVANT_SCORE).toBe(2);
    const card = (score: number) => ({
      ...cards[0]!,
      habitats: { ...cards[0]!.habitats, rover: score },
    });
    expect([0, 1, 2, 3].map((s) => isRelevant(card(s), "rover"))).toEqual([
      false,
      false,
      true,
      true,
    ]);
    for (const habitat of HABITATS) {
      const kept = filterCards(cards, { habitat });
      expect(kept.length).toBeGreaterThan(0);
      expect(kept.length).toBeLessThan(cards.length);
      expect(kept).toEqual(cards.filter((c) => c.habitats[habitat] >= 2));
    }
  });

  it("narrows by fuel, and by both filters together", () => {
    const counts = (["solid", "liquid", "gas"] as const).map((fuel) => {
      const kept = filterCards(cards, { fuel });
      expect(kept.every((c) => c.fuelType === fuel)).toBe(true);
      return kept.length;
    });
    // Two investigations state no fuel ("none") or no fuel type: only "All fuels" shows them.
    expect(counts.reduce((a, b) => a + b)).toBe(cards.length - 2);
    const both = filterCards(cards, { habitat: "moon_base", fuel: "solid" });
    expect(both).toEqual(cards.filter((c) => c.fuelType === "solid" && c.habitats.moon_base >= 2));
  });
});

describe("failed investigations", () => {
  it("are shown in neither view", () => {
    const withFailed = {
      ...full,
      failed: ["PSI-20", { accession: "PSI-69", error: "timeout" }, { error: "no accession" }],
    } as InvestigationsReport;
    expect([...failedAccessions(withFailed)]).toEqual(["PSI-20", "PSI-69"]);
    const shown = slimReport(withFailed).investigations.map((i) => i.accession);
    expect(shown).not.toContain("PSI-20");
    expect(shown).not.toContain("PSI-69");
    expect(shown).toHaveLength(full.investigations.length - 2);
  });

  it("are none in the bundled report", () => {
    expect(failedAccessions(full).size).toBe(0);
  });
});
