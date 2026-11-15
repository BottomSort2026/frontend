import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { EarthFlame, FreeFallFlame } from "../mission/diagrams";
import { GravityScale } from "../mission/GravityScale";
import {
  ASSUMPTIONS,
  FACTOR_IDS,
  FACTORS,
  type Factor,
  factorFrom,
  GRAVITY_NOTE,
  PAGE,
  type Panel,
  PANELS,
} from "../mission/milestones";
import { Sources } from "../mission/Sources";
import { Timeline } from "../mission/Timeline";
import { Section, SectionBlock } from "../sections/Section";
import { useTravel } from "../sky/TravelContext";
import { Button } from "../ui/Button";
import { FilterTag, Tag } from "../ui/Tag";
import "../mission/mission.css";

interface MissionSearch {
  factor?: Factor;
}

export const Route = createFileRoute("/mission")({
  // The chosen factor lives in the URL, so a filtered timeline can be shared as a link.
  validateSearch: (search: Record<string, unknown>): MissionSearch => ({
    factor: factorFrom(search.factor),
  }),
  component: MissionPage,
});

// Every word on this page comes from src/mission/milestones.ts, which follows docs/mission_facts.md.

function WhyPanel({ panel, drawing }: { panel: Panel; drawing: ReactNode }) {
  return (
    <div className="ff-why__panel">
      {drawing}
      <h4 className="ff-why__title">{panel.title}</h4>
      <p className="ff-why__text">{panel.sentences.join(" ")}</p>
      <Sources sources={panel.sources} />
    </div>
  );
}

function MissionPage() {
  const { jump } = useTravel();
  const { factor } = Route.useSearch();
  const navigate = Route.useNavigate();
  const setFactor = (next?: Factor) => void navigate({ search: { factor: next }, replace: true });

  return (
    <Section id="mission" title={PAGE.title} lead={PAGE.lead}>
      <SectionBlock className="ff-mblock">
        <div className="ff-mblock__head">
          <h3 className="ff-mblock__title">{PAGE.why}</h3>
          <Tag>{PAGE.diagram}</Tag>
        </div>
        <div className="ff-why">
          <WhyPanel panel={PANELS.earth} drawing={<EarthFlame />} />
          <WhyPanel panel={PANELS.freeFall} drawing={<FreeFallFlame />} />
        </div>
      </SectionBlock>

      <SectionBlock className="ff-mblock">
        <h3 className="ff-mblock__title">{PAGE.milestones}</h3>
        <div role="group" aria-label={PAGE.filter} className="ff-sec__row">
          <FilterTag pressed={!factor} onPress={() => setFactor(undefined)}>
            {PAGE.allFactors}
          </FilterTag>
          {FACTOR_IDS.map((f) => (
            <FilterTag key={f} pressed={factor === f} onPress={() => setFactor(f)}>
              {FACTORS[f].label}
            </FilterTag>
          ))}
        </div>
        <div className="ff-mfactor" aria-live="polite">
          {factor ? (
            <>
              <p className="ff-mfactor__text">{FACTORS[factor].text}</p>
              <Sources sources={FACTORS[factor].sources} />
            </>
          ) : null}
        </div>
        <Timeline factor={factor} />
      </SectionBlock>

      {ASSUMPTIONS.length > 0 ? (
        <SectionBlock className="ff-mblock">
          <h3 className="ff-mblock__title">{PAGE.assumptions}</h3>
          <ol className="ff-assume">
            {ASSUMPTIONS.map((a) => (
              <li key={a.wording} className="ff-assume__row">
                <div className="ff-assume__part">
                  <p className="ff-eyebrow">{PAGE.assumed}</p>
                  <p className="ff-assume__was">
                    <q>{a.wording}</q>
                  </p>
                </div>
                <div className="ff-assume__part">
                  <p className="ff-eyebrow">{PAGE.found}</p>
                  <p className="ff-assume__found">{a.answer}</p>
                  <Sources sources={a.sources} />
                </div>
              </li>
            ))}
          </ol>
        </SectionBlock>
      ) : null}

      <SectionBlock className="ff-mblock">
        <h3 className="ff-mblock__title">{PAGE.unknown}</h3>
        <GravityScale />
        <p className="ff-mblock__note">{GRAVITY_NOTE.text}</p>
        <Sources sources={GRAVITY_NOTE.sources} />
      </SectionBlock>

      <SectionBlock className="ff-mblock">
        <h3 className="ff-mblock__title">{PAGE.next}</h3>
        <div className="ff-sec__row">
          <Button variant="primary" onClick={() => jump("lab")}>
            {PAGE.openLab}
          </Button>
          <Button onClick={() => jump("library")}>{PAGE.browseLibrary}</Button>
        </div>
      </SectionBlock>
    </Section>
  );
}
