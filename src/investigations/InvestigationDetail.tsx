import type { ReactNode } from "react";
import { ArrowUpRight } from "../ui/icons";
import { SourceRefs } from "./Refs";
import {
  CONTRIBUTION_NAME,
  CRITERION_NAME,
  HABITATS,
  HABITAT_NAME,
  PILLARS,
  PILLAR_NAME,
  PROFILE_FIELDS,
  PROFILE_LISTS,
  sourceHref,
  sourceId,
  type Cited,
  type Investigation,
  type InvestigationsReport,
  type Score,
} from "./report";

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="ff-inv__block">
      <h4 className="ff-eyebrow">{title}</h4>
      {children}
    </section>
  );
}

/** A statement followed by the markers of its sources. */
function Statement({ accession, item }: { accession: string; item: Cited }) {
  return (
    <>
      {item.text} <SourceRefs accession={accession} sources={item.sources} />
    </>
  );
}

function StatementList({ accession, items }: { accession: string; items: Cited[] }) {
  return (
    <ul className="ff-inv__list">
      {items.map((item, i) => (
        <li key={i}>
          <Statement accession={accession} item={item} />
        </li>
      ))}
    </ul>
  );
}

/** One 0 to 3 score: its name, the number, a bar, and the reason with its sources. */
function ScoreRow({
  accession,
  name,
  score,
  max,
  weight,
}: {
  accession: string;
  name: string;
  score: Score;
  max: number;
  weight?: number;
}) {
  const shown = Number.isInteger(score.score) ? String(score.score) : score.score.toFixed(2);
  return (
    <div className="ff-score">
      <div className="ff-score__head">
        <span className="ff-score__name">{name}</span>
        {weight !== undefined ? <span className="ff-score__weight">weight {weight}</span> : null}
        <span className="ff-score__value">
          {shown} / {max}
        </span>
      </div>
      <div
        className="ff-meter__bar"
        role="meter"
        aria-label={name}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={score.score}
      >
        <i style={{ "--v": Math.min(1, Math.max(0, score.score / max)) }} />
      </div>
      <p className="ff-score__reason">
        {score.reason} <SourceRefs accession={accession} sources={score.sources} />
      </p>
    </div>
  );
}

/** Everything the report says about one investigation. Every statement shows its sources. */
export function InvestigationDetail({
  inv,
  rubric,
}: {
  inv: Investigation;
  rubric: InvestigationsReport["rubric"];
}) {
  const a = inv.accession;
  const max = rubric.max_score;
  const pillars = PILLARS.filter((p) => inv.pillars[p]);
  const contributions = Object.entries(inv.contributions).filter(
    (entry): entry is [string, Cited] => entry[1] !== null,
  );
  const fields = PROFILE_FIELDS.filter(([key]) => inv.profile[key]);
  const lists = PROFILE_LISTS.filter(([key]) => inv.profile[key].length > 0);

  return (
    <div className="ff-inv__detail">
      <Block title="In plain words">
        <p className="ff-inv__text">
          <Statement accession={a} item={inv.summary.plain} />
        </p>
      </Block>
      <Block title="For researchers">
        <p className="ff-inv__text">
          <Statement accession={a} item={inv.summary.technical} />
        </p>
      </Block>

      <Block title={`Scores: ${inv.total.toFixed(1)} of 100`}>
        <div className="ff-scores">
          {rubric.criteria.map((criterion) => (
            <ScoreRow
              key={criterion.key}
              accession={a}
              name={CRITERION_NAME[criterion.key] ?? criterion.key}
              score={inv.scores[criterion.key]}
              max={max}
              weight={criterion.weight}
            />
          ))}
        </div>
      </Block>

      <Block title="Relevance per habitat">
        <div className="ff-scores">
          {HABITATS.map((h) => (
            <ScoreRow
              key={h}
              accession={a}
              name={HABITAT_NAME[h]}
              score={inv.habitats[h]}
              max={max}
            />
          ))}
        </div>
      </Block>

      {pillars.length > 0 ? (
        <Block title="Fire safety pillars">
          <dl className="ff-inv__dl">
            {pillars.map((p) => (
              <div key={p}>
                <dt>{PILLAR_NAME[p]}</dt>
                <dd>
                  <Statement accession={a} item={inv.pillars[p]!} />
                </dd>
              </div>
            ))}
          </dl>
        </Block>
      ) : null}

      {contributions.length > 0 ? (
        <Block title="What it contributes">
          <dl className="ff-inv__dl">
            {contributions.map(([key, item]) => (
              <div key={key}>
                <dt>{CONTRIBUTION_NAME[key] ?? key}</dt>
                <dd>
                  <Statement accession={a} item={item} />
                </dd>
              </div>
            ))}
          </dl>
        </Block>
      ) : null}

      <Block title="Experiment profile">
        <dl className="ff-inv__dl">
          {inv.profile.fuel_type ? (
            <div>
              <dt>Fuel type</dt>
              <dd>
                {inv.profile.fuel_type.value}{" "}
                <SourceRefs accession={a} sources={inv.profile.fuel_type.sources} />
              </dd>
            </div>
          ) : null}
          {fields.map(([key, name]) => (
            <div key={key}>
              <dt>{name}</dt>
              <dd>
                <Statement accession={a} item={inv.profile[key]!} />
              </dd>
            </div>
          ))}
          {lists.map(([key, name]) => (
            <div key={key}>
              <dt>{name}</dt>
              <dd>
                <StatementList accession={a} items={inv.profile[key]} />
              </dd>
            </div>
          ))}
        </dl>
      </Block>

      {inv.data_for_modeling ? (
        <Block title="Data for modeling">
          <p className="ff-inv__text">
            {inv.data_for_modeling.readiness ? (
              <span className="ff-inv__readiness">
                Readiness: {inv.data_for_modeling.readiness.replaceAll("_", " ")}.{" "}
              </span>
            ) : null}
            <Statement accession={a} item={inv.data_for_modeling} />
          </p>
        </Block>
      ) : null}

      {inv.key_findings.length > 0 ? (
        <Block title="Key findings">
          <StatementList accession={a} items={inv.key_findings} />
        </Block>
      ) : null}

      {inv.limitations.length > 0 ? (
        <Block title="Limitations">
          <StatementList accession={a} items={inv.limitations} />
        </Block>
      ) : null}

      <Block title="Sources">
        <ol className="ff-sources">
          {inv.sources.map((source) => {
            const href = sourceHref(source);
            return (
              <li key={source.n} id={sourceId(a, source.n)} tabIndex={-1}>
                <span className="ff-sources__n">[{source.n}]</span>
                <span className="ff-sources__label">
                  {source.label}{" "}
                  {href ? (
                    <a href={href} target="_blank" rel="noreferrer">
                      {source.investigation_url ? "PSI investigation page" : "NASA page"}
                      <ArrowUpRight />
                    </a>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ol>
      </Block>

      <a className="ff-inv__link" href={inv.investigation_url} target="_blank" rel="noreferrer">
        {inv.acronym ? `${inv.acronym} on PSI (${a})` : `${a} on PSI`}
        <ArrowUpRight />
      </a>
    </div>
  );
}
