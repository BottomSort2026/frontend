import { Link } from "@tanstack/react-router";
import type { Habitat } from "../api/types";
import { HABITAT_NAME, PILLAR_NAME } from "../investigations/report";
import { ArrowUpRight } from "../ui/icons";
import { Tag } from "../ui/Tag";
import { fuelGlyph, fuelLabel, NOT_STATED, type LibraryCard } from "./card";
import "./card.css";

interface InvestigationCardProps {
  card: LibraryCard;
  /** The habitat filtered on, if any: its 0 to 3 relevance fills the meter. */
  habitat: Habitat | undefined;
}

/**
 * One investigation in the library. The whole card links to its PSI investigation page; a second
 * link opens its entry in Investigations, where every statement shown here has its sources.
 */
export function InvestigationCard({ card, habitat }: InvestigationCardProps) {
  const fuel = fuelLabel(card.fuelType);
  const fields = [
    ["Fuels", card.fuels],
    ["Hardware", card.hardware],
    ["Oxygen", card.oxygen],
    ["Pressure", card.pressure],
    ["Airflow", card.airflow],
    ["Sensors", card.sensors.length > 0 ? card.sensors.join(" ") : null],
  ] as const;
  const score = habitat ? card.habitats[habitat] : undefined;

  return (
    <article className="ff-card">
      <span className="ff-eyebrow">
        {card.pillars.map((p) => PILLAR_NAME[p]).join(" · ") || "No pillar reported"}
      </span>
      <h3 className="ff-card__title">
        <a href={card.url} target="_blank" rel="noreferrer">
          {card.name}
        </a>
      </h3>
      {card.title ? <p className="ff-card__full">{card.title}</p> : null}
      <div className="ff-card__tags">
        {fuel ? (
          <Tag glyph={fuelGlyph(card.fuelType)}>{fuel}</Tag>
        ) : (
          <Tag variant="gap">Fuel type not stated</Tag>
        )}
      </div>
      <dl className="ff-card__facts">
        {fields.map(([label, value]) => (
          <div key={label} className="ff-card__fact">
            <dt className="ff-eyebrow">{label}</dt>
            <dd className={value ? undefined : "ff-card__missing"}>{value ?? NOT_STATED}</dd>
          </div>
        ))}
      </dl>
      <div className="ff-card__foot">
        {habitat && score !== undefined ? (
          <div className="ff-meter">
            <span className="ff-eyebrow">
              {HABITAT_NAME[habitat]} · {score} / 3
            </span>
            <div
              className="ff-meter__bar"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={3}
              aria-valuenow={score}
              aria-label={`Relevance for ${HABITAT_NAME[habitat]}`}
            >
              <i style={{ "--v": Math.max(0, Math.min(1, score / 3)) }} />
            </div>
          </div>
        ) : null}
        <div className="ff-card__links">
          <Link className="ff-card__sources" to="/investigations" search={{ open: card.accession }}>
            Read with sources<span className="ff-visually-hidden">: {card.name}</span>
          </Link>
          <span className="ff-card__go">
            {card.accession}
            <ArrowUpRight />
          </span>
        </div>
      </div>
    </article>
  );
}
