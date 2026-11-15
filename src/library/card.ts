// What a Library card shows, read from the investigations report (src/data/investigations.json,
// the same file and query as Investigations). The report's statements are cited there; Library
// shows their text and links each card to its entry in Investigations for the sources.

import { investigationUrl, type Habitat, type Pillar } from "../api/types";
import {
  HABITATS,
  PILLARS,
  shortName,
  sourceHref,
  type Cited,
  type Investigation,
} from "../investigations/report";
import type { TagGlyph } from "../ui/Tag";

/** A habitat filter keeps the investigations the report scores at least this, out of 3, for it. */
export const RELEVANT_SCORE = 2;

/** Shown in place of a field the report leaves empty: the card stays. */
export const NOT_STATED = "Not stated in the corpus";

export interface LibraryCard {
  accession: string;
  /** The acronym, else the accession. */
  name: string;
  title: string;
  /** The PSI investigation page. */
  url: string;
  /** As the report states it: "solid", "liquid", "gas", "none". Null when not stated. */
  fuelType: string | null;
  fuels: string | null;
  hardware: string | null;
  oxygen: string | null;
  pressure: string | null;
  airflow: string | null;
  sensors: string[];
  /** The pillars the investigation reports on, in the fixed pillar order. */
  pillars: Pillar[];
  /** 0 to 3 per habitat. */
  habitats: Record<Habitat, number>;
}

const text = (c: Cited | null | undefined): string | null => c?.text?.trim() || null;

/** One report record as a card. A missing field becomes null or empty, never an error. */
export function toCard(inv: Investigation): LibraryCard {
  const p = inv.profile;
  return {
    accession: inv.accession,
    name: shortName(inv),
    title: inv.title,
    url:
      sourceHref({ investigation_url: inv.investigation_url, public_url: null }) ??
      investigationUrl(inv.accession),
    fuelType: p?.fuel_type?.value?.trim() || null,
    fuels: text(p?.fuels),
    hardware: text(p?.hardware),
    oxygen: text(p?.oxygen),
    pressure: text(p?.pressure),
    airflow: text(p?.airflow),
    sensors: (p?.sensors ?? []).map((s) => s.text.trim()).filter(Boolean),
    pillars: PILLARS.filter((k) => inv.pillars?.[k]),
    habitats: Object.fromEntries(HABITATS.map((h) => [h, inv.habitats?.[h]?.score ?? 0])) as Record<
      Habitat,
      number
    >,
  };
}

/** The fuel filter a fuel type belongs to. The value is free text, so match loosely. */
export function fuelGlyph(fuelType: string | null | undefined): TagGlyph | undefined {
  const f = fuelType?.toLowerCase() ?? "";
  if (f.includes("solid")) return "solid";
  if (f.includes("liquid") || f.includes("droplet")) return "liquid";
  if (f.includes("gas")) return "gas";
  return undefined;
}

export const FUEL_NAME: Record<TagGlyph, string> = {
  solid: "Solid",
  liquid: "Liquid",
  gas: "Gas",
};

/** The fuel tag's text: "Liquid", "No fuel" (an investigation that burned nothing), or as stated. */
export function fuelLabel(fuelType: string | null): string | null {
  if (!fuelType) return null;
  const glyph = fuelGlyph(fuelType);
  if (glyph) return FUEL_NAME[glyph];
  return fuelType.toLowerCase() === "none" ? "No fuel" : fuelType;
}

export function isRelevant(card: LibraryCard, habitat: Habitat): boolean {
  return card.habitats[habitat] >= RELEVANT_SCORE;
}

export interface LibraryFilter {
  habitat?: Habitat;
  fuel?: TagGlyph;
}

/** The cards a filter keeps, in the order given (the report's). No filter keeps every card. */
export function filterCards(cards: readonly LibraryCard[], filter: LibraryFilter): LibraryCard[] {
  const { habitat, fuel } = filter;
  return cards.filter(
    (c) => (!habitat || isRelevant(c, habitat)) && (!fuel || fuelGlyph(c.fuelType) === fuel),
  );
}
