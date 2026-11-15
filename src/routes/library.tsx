import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { profilesQuery, warmQuery } from "../api/queries";
import type { Habitat } from "../api/types";
import { fuelGlyph, HABITAT_LABEL, InvestigationCard, rankFor } from "../library/InvestigationCard";
import { Section, SectionBlock } from "../sections/Section";
import { FilterTag, Tag, type TagGlyph } from "../ui/Tag";

const HABITATS = [
  "station",
  "spacecraft",
  "moon_base",
  "rover",
] as const satisfies readonly Habitat[];
const FUELS = ["solid", "liquid", "gas"] as const satisfies readonly TagGlyph[];
const FUEL_NAME: Record<TagGlyph, string> = {
  solid: "Solid",
  liquid: "Liquid droplet",
  gas: "Gas",
};

interface LibrarySearch {
  /** Rank for this habitat. Default: station. */
  habitat?: Habitat;
  fuel?: TagGlyph;
}

export const Route = createFileRoute("/library")({
  // Filters live in the URL, so a ranked view can be shared as a link.
  validateSearch: (search: Record<string, unknown>): LibrarySearch => ({
    habitat: HABITATS.find((h) => h === search.habitat),
    fuel: FUELS.find((f) => f === search.fuel),
  }),
  // Starts the request without waiting for it: the section opens at once.
  loader: ({ context }) => void warmQuery(context.queryClient, profilesQuery),
  component: LibraryPage,
});

function LibraryPage() {
  return (
    <Section
      id="library"
      title="Every experiment, ranked for fire safety."
      lead="Investigations from NASA's Physical Sciences Informatics repository, summarised and ordered by how directly they inform the habitat you choose."
      loading="Loading the investigation profiles…"
      failed="The investigation profiles did not load."
    >
      <LibraryContent />
    </Section>
  );
}

/** Everything that reads the profiles. It suspends until they are there. */
function LibraryContent() {
  const { habitat = "station", fuel } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data } = useSuspenseQuery(profilesQuery);
  const setSearch = (next: LibrarySearch) =>
    void navigate({ search: (prev) => ({ ...prev, ...next }), replace: true });

  const ranked = rankFor(data.profiles, habitat);
  const shown = fuel ? ranked.filter((p) => fuelGlyph(p.fuel_type) === fuel) : ranked;

  return (
    <>
      <SectionBlock className="ff-sec__row">
        <span role="group" aria-label="Rank for habitat" className="ff-sec__row">
          {HABITATS.map((h) => (
            <FilterTag key={h} pressed={habitat === h} onPress={() => setSearch({ habitat: h })}>
              {HABITAT_LABEL[h]}
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
        {data.sample ? <Tag variant="gap">Sample ranking</Tag> : null}
      </SectionBlock>
      <SectionBlock className="ff-grid">
        {shown.length > 0 ? (
          shown.map((p) => (
            <InvestigationCard
              key={p.accession}
              profile={p}
              rank={ranked.indexOf(p) + 1}
              habitat={habitat}
            />
          ))
        ) : (
          <p className="ff-note">
            No investigation burns that kind of fuel. Choose another filter.
          </p>
        )}
      </SectionBlock>
    </>
  );
}
