// Turns the ML service's field names into labels, so the simulator can show inputs and outputs
// it has never seen (the prediction target is still OPEN in ARCHITECTURE.md).

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

export interface FieldLabel {
  label: string;
  unit?: string;
}

export function humanize(key: string): FieldLabel {
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
