import type { MouseEvent } from "react";
import { sourceId } from "./report";

/** Moves to a numbered source and focuses it. No smooth scrolling: nothing animates on scroll. */
function goTo(event: MouseEvent<HTMLAnchorElement>, id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ block: "center" });
  target.focus({ preventScroll: true });
}

/** The [n] markers of a statement. Each one leads to that source in the investigation's list. */
export function SourceRefs({ accession, sources }: { accession: string; sources?: number[] }) {
  if (!sources?.length) return null;
  return (
    <span className="ff-refs">
      {sources.map((n) => {
        const id = sourceId(accession, n);
        return (
          <a
            key={n}
            className="ff-ref"
            href={`#${id}`}
            aria-label={`Source ${n}`}
            onClick={(event) => goTo(event, id)}
          >
            [{n}]
          </a>
        );
      })}
    </span>
  );
}

/**
 * The investigations a statement of the synthesis is about. Each one opens that investigation
 * in the ranking, where its sources are.
 */
export function InvestigationRefs({
  accessions,
  names,
  onOpen,
}: {
  accessions: string[];
  /** accession -> the name to show (acronym, or the accession itself). */
  names: ReadonlyMap<string, string>;
  onOpen: (accession: string) => void;
}) {
  const known = accessions.filter((a) => names.has(a));
  if (!known.length) return null;
  return (
    <span className="ff-refs ff-refs--inv">
      {known.map((accession) => (
        <button
          key={accession}
          type="button"
          className="ff-ref ff-ref--inv"
          title={accession}
          aria-label={`Open ${names.get(accession)} (${accession}) in the ranking`}
          onClick={() => onOpen(accession)}
        >
          {names.get(accession)}
        </button>
      ))}
    </span>
  );
}
