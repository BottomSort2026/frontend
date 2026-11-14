import { investigationUrl, type Habitat, type InvestigationProfile } from "../api/types";
import { ArrowUpRight } from "../ui/icons";
import { Tag, type TagGlyph } from "../ui/Tag";
import "./card.css";

/** Fuel types are told apart by shape as well as by word. The field is free text, so match loosely. */
export function fuelGlyph(fuelType: string | undefined): TagGlyph | undefined {
  const f = fuelType?.toLowerCase() ?? "";
  if (f.includes("solid")) return "solid";
  if (f.includes("liquid") || f.includes("droplet")) return "liquid";
  if (f.includes("gas")) return "gas";
  return undefined;
}

export const HABITAT_LABEL: Record<Habitat, string> = {
  spacecraft: "Spacecraft",
  station: "Station",
  moon_base: "Moon Base",
  rover: "Rover",
};

interface InvestigationCardProps {
  profile: InvestigationProfile;
  rank: number;
  /** The habitat the list is ranked for: its 0 to 3 relevance fills the meter. */
  habitat: Habitat;
}

/** One PSI investigation in the library. The whole card links to its PSI investigation page. */
export function InvestigationCard({ profile, rank, habitat }: InvestigationCardProps) {
  const score = profile.habitat_relevance?.[habitat];
  const finding = profile.key_findings?.[0];
  return (
    <article className="ff-card">
      <div className="ff-card__top">
        <span className="ff-eyebrow">{profile.pillar?.join(" · ") || profile.accession}</span>
        <span className="ff-card__rank" aria-label={`Rank ${rank}`}>
          #{rank}
        </span>
      </div>
      <h3 className="ff-card__title">
        <a href={investigationUrl(profile.accession)} target="_blank" rel="noreferrer">
          {profile.acronym}
        </a>
      </h3>
      {profile.title ? <p className="ff-card__full">{profile.title}</p> : null}
      {finding ? <p className="ff-card__desc">{finding}</p> : null}
      <div className="ff-card__tags">
        {profile.fuel_type ? (
          <Tag glyph={fuelGlyph(profile.fuel_type)}>{profile.fuel_type}</Tag>
        ) : null}
        {profile.hardware ? <Tag>{profile.hardware}</Tag> : null}
      </div>
      <div className="ff-card__foot">
        {score === undefined ? (
          <span className="ff-eyebrow">{profile.accession}</span>
        ) : (
          <div className="ff-meter">
            <span className="ff-eyebrow">Relevance · {HABITAT_LABEL[habitat]}</span>
            <div
              className="ff-meter__bar"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={3}
              aria-valuenow={score}
              aria-label={`Relevance for ${HABITAT_LABEL[habitat]}`}
            >
              <i style={{ "--v": Math.max(0, Math.min(1, score / 3)) }} />
            </div>
          </div>
        )}
        <span className="ff-card__go">
          {profile.accession}
          <ArrowUpRight />
        </span>
      </div>
    </article>
  );
}

/** Highest relevance for the habitat first; ties keep the order of profiles.json. */
export function rankFor(
  profiles: readonly InvestigationProfile[],
  habitat: Habitat,
): InvestigationProfile[] {
  return profiles
    .map((p, i) => ({ p, i, s: p.habitat_relevance?.[habitat] ?? -1 }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.p);
}
