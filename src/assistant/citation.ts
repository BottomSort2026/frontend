// How a source is written and linked (ARCHITECTURE.md §5, decision 6):
//   Authors (Year), "Title", p. 7. ACRONYM (PSI-25), folder Raw Data.
// linked to the PSI investigation page, or the public NASA page for non-PSI resources.

import type { Citation } from "../api/types";

/** A trimmed string, or null when the field is missing or blank. */
const text = (v: string | null | undefined): string | null => {
  const t = v?.trim();
  return t ? t : null;
};

/** The decided citation format, leaving out whatever the source does not give. */
export function formatCitation(c: Citation): string {
  const authors = text(c.doc_authors);
  const title = text(c.doc_title);
  const acronym = text(c.acronym);
  const accession = text(c.accession);
  const folder = text(c.psi_folder);

  const byline = [authors, c.year != null ? `(${c.year})` : null].filter(Boolean).join(" ");
  const document = [byline, title ? `"${title}"` : null, c.page != null ? `p. ${c.page}` : null]
    .filter(Boolean)
    .join(", ");

  const name =
    acronym && accession && acronym !== accession
      ? `${acronym} (${accession})`
      : (acronym ?? accession);
  const place = [name, folder ? `folder ${folder}` : null].filter(Boolean).join(", ");

  return [document, place]
    .filter(Boolean)
    .map((s) => `${s}.`)
    .join(" ");
}

/** An http(s) URL, or null. Anything else (javascript:, a bare path) is never linked. */
const webUrl = (v: string | null | undefined): string | null => {
  const t = text(v);
  if (!t) return null;
  try {
    const { protocol } = new URL(t);
    return protocol === "https:" || protocol === "http:" ? t : null;
  } catch {
    return null;
  }
};

/** The PSI investigation page, else the public NASA page, else nothing. Never a file URL. */
export function citationHref(c: Citation): string | undefined {
  return webUrl(c.investigation_url) ?? webUrl(c.public_url) ?? undefined;
}
