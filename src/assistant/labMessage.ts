// A Flame Lab result as an assistant message (docs/frontend_flame_lab.md §7). Everything here is
// built from the request and the `prediction` object, never from the explanation text, so the
// message stays readable after the inputs change and a follow-up question has the numbers.

import {
  investigationUrl,
  type Citation,
  type LabInputs,
  type LabModelInfo,
  type LabPredictResponse,
} from "../api/types";
import { displaySpec, isMoleFraction, rangeOf, selectorOf } from "../lab/lab";
import { humanize, OUTCOME_VERDICT } from "../lib/labels";

const FLEX = { acronym: "FLEX", accession: "PSI-69", folder: "Raw Data" } as const;

/** Choices as they read inside a sentence: chemical names written properly, the rest as sent. */
const INLINE_CHOICE: Record<string, string> = { co2: "CO₂", he: "helium", n2: "N₂" };
const inline = (v: string) => INLINE_CHOICE[v.toLowerCase()] ?? v;

/** A quantity's name, unless its unit already says it: "1.00 atm", but "D₀ 3.00 mm". */
function shortName(key: string): string {
  const label = humanize(key).label;
  if (/^[A-Za-z]+$/.test(label)) return "";
  return label.split(" ").pop() ?? label;
}

const round = (v: number, digits: number) => v.toFixed(digits);

/**
 * "methanol · 1.00 atm · 21 % O₂ · no suppressant · D₀ 3.00 mm", in model-info's order.
 * A choice that only selects a gas is folded into its amount ("10 % CO₂", "no suppressant").
 */
export function conditionsLine(model: LabModelInfo, inputs: LabInputs): string {
  const folded = new Set<string>();
  for (const input of Object.values(model.inputs))
    if (input.type === "float") {
      const s = selectorOf(model, input);
      if (s) folded.add(s);
    }
  const parts: string[] = [];
  for (const [key, input] of Object.entries(model.inputs)) {
    if (folded.has(key)) continue;
    const v = inputs[key];
    if (v === undefined) continue;
    if (input.type === "enum") {
      parts.push(inline(String(v)));
      continue;
    }
    const n = Number(v);
    if (!Number.isFinite(n)) continue;
    const selector = selectorOf(model, input);
    if (selector) {
      const gas = String(inputs[selector] ?? "");
      if (rangeOf(model, input, inputs).disabled)
        parts.push(`no ${humanize(selector).label.toLowerCase()}`);
      else parts.push(`${round(n * 100, 0)} % ${inline(gas)}`);
      continue;
    }
    if (isMoleFraction(input)) {
      parts.push(`${round(n * 100, 0)} % ${humanize(key).label}`);
      continue;
    }
    const spec = displaySpec(input, humanize(key).unit);
    const name = shortName(key);
    parts.push([name, round(n, spec.digits), spec.unit].filter(Boolean).join(" "));
  }
  return parts.join(" · ");
}

const pct = (v: number) => `${Math.round(v * 100)} %`;

/** One line from the `prediction` object: the verdict, its probability, and the droplet if it goes out. */
export function predictionStatement(prediction: LabPredictResponse["prediction"]): string {
  const { outcome, extinction } = prediction;
  const { label, probabilities } = outcome.prediction;
  const verdict = OUTCOME_VERDICT[label] ?? humanize(label).label;
  const p = probabilities?.[label];
  let line = `Predicted: ${verdict.charAt(0).toLowerCase()}${verdict.slice(1)}`;
  if (typeof p === "number") line += ` (${pct(p)})`;
  if (outcome.support?.confidence) line += `, ${outcome.support.confidence} confidence`;
  if (outcome.support?.in_tested_range === false) line += ", outside the tested conditions";
  const droplet = extinction?.prediction;
  if (label === "extinction" && droplet) {
    const bits: string[] = [];
    if (typeof droplet.extinction_diameter_mm === "number")
      bits.push(`droplet diameter at extinction ${droplet.extinction_diameter_mm.toFixed(2)} mm`);
    if (typeof droplet.fuel_burned_fraction === "number")
      bits.push(`${pct(droplet.fuel_burned_fraction)} of the fuel burned first`);
    if (bits.length) line += `; ${bits.join(", ")}`;
  }
  return `${line}.`;
}

export const EXPLANATION_UNAVAILABLE =
  "The explanation is not available right now; the numbers above come straight from the models.";

/** What the Lab message contributes to the history of the next /chat request. */
export function labHistoryContent(
  conditions: string,
  prediction: LabPredictResponse["prediction"],
  explanation: string | null | undefined,
): string {
  return [
    `Flame Lab prediction for ${conditions}.`,
    predictionStatement(prediction),
    explanation?.trim() || "No explanation was available for this prediction.",
  ].join("\n");
}

/** cited_tests as the chat's citations: the TestSheet as the document, FLEX (PSI-69) as the place. */
export function labCitations(cited: LabPredictResponse["cited_tests"]): Citation[] {
  return (cited ?? [])
    .filter((t) => t.testsheet_id || t.cir_id)
    .map((t) => ({
      doc_title: t.testsheet_id ? `${t.testsheet_id} TestSheet` : `CIR test ${t.cir_id}`,
      acronym: FLEX.acronym,
      accession: FLEX.accession,
      psi_folder: FLEX.folder,
      // Always the investigation page, whatever the service sends: never a (pre-signed) file URL.
      investigation_url: investigationUrl(FLEX.accession),
    }));
}
