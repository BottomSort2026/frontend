// Turns the services' field names and values into the words the interface shows. The Flame Lab
// controls are built from model-info, so an input the frontend has never seen still reads well.

const UNIT_SUFFIXES: readonly (readonly [string, string])[] = [
  ["_mm2_s", "mm²/s"],
  ["_cm_s", "cm/s"],
  ["_mmhg", "mmHg"],
  ["_atm", "atm"],
  ["_psi", "psi"],
  ["_mm", "mm"],
  ["_s", "s"],
];

const WORDS: Record<string, string> = { o2: "O₂", co2: "CO₂", he: "Helium", n2: "N₂", d0: "D₀" };

/** Field names whose label is not their words (docs/frontend_flame_lab.md §8). */
const FIELD_LABELS: Record<string, string> = { suppressant_fraction: "Amount" };

/** Values of a choice, as a button shows them. */
const CHOICE_LABELS: Record<string, string> = {
  none: "None",
  co2: "CO₂",
  he: "Helium",
  n2: "N₂",
};

export interface FieldLabel {
  label: string;
  unit?: string;
}

export function humanize(key: string): FieldLabel {
  const fixed = FIELD_LABELS[key];
  if (fixed) return { label: fixed };
  let stem = key;
  let unit: string | undefined;
  for (const [suffix, u] of UNIT_SUFFIXES) {
    if (stem.toLowerCase().endsWith(suffix)) {
      stem = stem.slice(0, -suffix.length);
      unit = u;
      break;
    }
  }
  const words = stem
    .split("_")
    .filter(Boolean)
    .map((w) => WORDS[w.toLowerCase()] ?? w);
  const label = words.join(" ");
  return { label: label.charAt(0).toUpperCase() + label.slice(1), unit };
}

/** Numbers as a reader wants them: up to three significant digits, no trailing zeros. */
export function formatNumber(v: number): string {
  if (!Number.isFinite(v)) return "n/a";
  if (v === 0) return "0";
  const abs = Math.abs(v);
  if (abs >= 100) return String(Math.round(v));
  return String(+v.toPrecision(3));
}

/** A value of a choice: "co2" reads "CO₂", "methanol" reads "Methanol". */
export function choiceLabel(value: string): string {
  return CHOICE_LABELS[value.toLowerCase()] ?? humanize(value).label;
}

// The two classes of the outcome model and the real end of a FLEX test (docs/frontend_flame_lab.md §6).
export const OUTCOME_ROW: Record<string, string> = {
  extinction: "Flame goes out on its own",
  no_extinction: "Burns out or breaks apart",
};
export const OUTCOME_VERDICT: Record<string, string> = {
  extinction: "The flame goes out on its own",
  no_extinction: "The droplet burns out or breaks apart",
};
const TEST_END: Record<string, string> = {
  extinction: "went out",
  completion: "burned out",
  disruption: "broke apart",
};

/** How a real test ended, in words. */
export function testEndLabel(end: string | null | undefined): string {
  if (!end) return "end not recorded";
  return TEST_END[end.toLowerCase()] ?? humanize(end).label.toLowerCase();
}
