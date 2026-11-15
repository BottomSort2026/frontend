import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { investigationsQuery, warmQuery } from "../api/queries";
import type { Habitat } from "../api/types";
import { HABITATS, HABITAT_NAME } from "../investigations/report";
import { FUEL_NAME, filterCards, RELEVANT_SCORE, toCard } from "../library/card";
import { InvestigationCard } from "../library/InvestigationCard";
import { Section, SectionBlock } from "../sections/Section";
import { FilterTag, type TagGlyph } from "../ui/Tag";

const FUELS = ["solid", "liquid", "gas"] as const satisfies readonly TagGlyph[];

interface LibrarySearch {
  /** Keep the investigations relevant to this habitat. Default: every habitat. */
  habitat?: Habitat;
  fuel?: TagGlyph;
}

export const Route = createFileRoute("/library")({
  // Filters live in the URL, so a filtered view can be shared as a link.
  validateSearch: (search: Record<string, unknown>): LibrarySearch => ({
    habitat: HABITATS.find((h) => h === search.habitat),
    fuel: FUELS.find((f) => f === search.fuel),
  }),
  // The same report and query as Investigations: usually already in the cache (the sky preloads
  // it). Starts the download without waiting for it, so the section opens at once.
  loader: ({ context }) => void warmQuery(context.queryClient, investigationsQuery),
  component: LibraryPage,
});

function LibraryPage() {
  return (
    <Section
      id="library"
      title="Every experiment, at a glance."
      lead="What each investigation in NASA's Physical Sciences Informatics repository burned, in which hardware, at which oxygen, pressure and airflow, and what it measured. Filter by habitat and fuel; the ranking is in Investigations."
      loading="Loading the investigations…"
      failed="The investigations did not load."
    >
      <LibraryContent />
    </Section>
  );
}

/** Everything that reads the report. It suspends until the report is there. */
function LibraryContent() {
  const { habitat, fuel } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: report } = useSuspenseQuery(investigationsQuery);
  const cards = useMemo(() => report.investigations.map(toCard), [report]);
  const shown = filterCards(cards, { habitat, fuel });
  const setSearch = (next: LibrarySearch) =>
    void navigate({ search: (prev) => ({ ...prev, ...next }), replace: true });

  return (
    <>
      <SectionBlock className="ff-sec__row">
        <span role="group" aria-label="Filter by habitat" className="ff-sec__row">
          <FilterTag pressed={!habitat} onPress={() => setSearch({ habitat: undefined })}>
            All habitats
          </FilterTag>
          {HABITATS.map((h) => (
            <FilterTag key={h} pressed={habitat === h} onPress={() => setSearch({ habitat: h })}>
              {HABITAT_NAME[h]}
            </FilterTag>
          ))}
        </span>
      </SectionBlock>
      <SectionBlock className="ff-sec__row">
        <span role="group" aria-label="Filter by fuel" className="ff-sec__row">
          <FilterTag pressed={!fuel} onPress={() => setSearch({ fuel: undefined })}>
            All fuels
          </FilterTag>
          {FUELS.map((f) => (
            <FilterTag
              key={f}
              glyph={f}
              pressed={fuel === f}
              onPress={() => setSearch({ fuel: f })}
            >
              {FUEL_NAME[f]}
            </FilterTag>
          ))}
        </span>
      </SectionBlock>
      <SectionBlock>
        <p className="ff-note" aria-live="polite">
          {shown.length} of {cards.length} investigations
          {habitat
            ? `, those the report scores ${RELEVANT_SCORE} or more out of 3 for ${HABITAT_NAME[habitat]}`
            : ""}
          .
        </p>
      </SectionBlock>
      <SectionBlock className="ff-grid">
        {shown.length > 0 ? (
          shown.map((card) => (
            <InvestigationCard key={card.accession} card={card} habitat={habitat} />
          ))
        ) : (
          <p className="ff-note">No investigation matches both filters. Choose another one.</p>
        )}
      </SectionBlock>
    </>
  );
}
