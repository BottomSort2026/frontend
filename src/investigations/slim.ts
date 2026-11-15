// The copy of the report the app downloads: only the fields Investigations and Library render.
// The build makes it from src/data/investigations.json (see vite.config.ts), which stays as the
// team's tool wrote it. Every object is rebuilt field by field, so nothing the view does not read
// is carried over, and a field added to the types in report.ts fails to compile until it is here.

import type { Pillar } from "../api/types";
import type {
  Cited,
  HardwareGroup,
  Investigation,
  InvestigationsReport,
  Linked,
  Profile,
  Score,
  Source,
} from "./report";

const cited = (c: Cited): Cited => ({ text: c.text, sources: c.sources });
const citedOrNull = (c: Cited | null): Cited | null => (c ? cited(c) : null);
const linked = (l: Linked): Linked => ({ text: l.text, accessions: l.accessions });

function score(s: Score): Score {
  const out: Score = { score: s.score, reason: s.reason };
  if (s.sources) out.sources = s.sources;
  if (s.computed) out.computed = s.computed;
  return out;
}

function mapValues<K extends string, V, W>(record: Record<K, V>, f: (v: V) => W): Record<K, W> {
  return Object.fromEntries(Object.entries(record).map(([k, v]) => [k, f(v as V)])) as Record<K, W>;
}

const source = (s: Source): Source => ({
  n: s.n,
  label: s.label,
  investigation_url: s.investigation_url,
  public_url: s.public_url,
});

function profile(p: Profile): Profile {
  return {
    hardware: citedOrNull(p.hardware),
    flight_platform: citedOrNull(p.flight_platform),
    dates: citedOrNull(p.dates),
    fuels: citedOrNull(p.fuels),
    fuel_type: p.fuel_type ? { value: p.fuel_type.value, sources: p.fuel_type.sources } : null,
    sample_shape_size: citedOrNull(p.sample_shape_size),
    oxygen: citedOrNull(p.oxygen),
    pressure: citedOrNull(p.pressure),
    airflow: citedOrNull(p.airflow),
    variables: p.variables.map(cited),
    constants: p.constants.map(cited),
    sensors: p.sensors.map(cited),
    measurements: p.measurements.map(cited),
  };
}

function investigation(i: Investigation): Investigation {
  const d = i.data_for_modeling;
  return {
    rank: i.rank,
    accession: i.accession,
    acronym: i.acronym,
    title: i.title,
    investigation_url: i.investigation_url,
    total: i.total,
    evidence_coverage: { card_only: i.evidence_coverage.card_only },
    summary: { plain: cited(i.summary.plain), technical: cited(i.summary.technical) },
    scores: mapValues(i.scores, score),
    habitats: mapValues(i.habitats, score),
    contributions: mapValues(i.contributions, citedOrNull),
    // Partial: only the pillars the investigation reports on are present.
    pillars: mapValues(i.pillars as Record<Pillar, Cited>, cited),
    profile: profile(i.profile),
    data_for_modeling: d
      ? { ...cited(d), ...(d.readiness ? { readiness: d.readiness } : {}) }
      : null,
    key_findings: i.key_findings.map(cited),
    limitations: i.limitations.map(cited),
    sources: i.sources.map(source),
  };
}

const group = (g: HardwareGroup): HardwareGroup => ({
  name: g.name,
  hardware: g.hardware,
  accessions: g.accessions,
  similarities: g.similarities.map(linked),
  differences: g.differences.map(linked),
});

/** The accessions the report lists as failed: they are shown in neither view. */
export function failedAccessions(r: Pick<InvestigationsReport, "failed">): Set<string> {
  const out = new Set<string>();
  for (const f of r.failed ?? []) {
    const accession = typeof f === "string" ? f : f?.accession;
    if (accession) out.add(accession);
  }
  return out;
}

export function slimReport(r: InvestigationsReport): InvestigationsReport {
  const failed = failedAccessions(r);
  return {
    run: { generated_at: r.run.generated_at, model: r.run.model },
    rubric: {
      max_score: r.rubric.max_score,
      criteria: r.rubric.criteria.map((c) => ({ key: c.key, weight: c.weight })),
    },
    investigations: r.investigations.filter((i) => !failed.has(i.accession)).map(investigation),
    habitat_top: mapValues(r.habitat_top, (top) => top.map((t) => ({ accession: t.accession }))),
    coverage: r.coverage,
    synthesis: {
      overview: linked(r.synthesis.overview),
      hardware_groups: r.synthesis.hardware_groups.map(group),
      gaps: r.synthesis.gaps.map(linked),
    },
  };
}
