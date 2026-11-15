import { Alert } from "../ui/icons";
import { Tag } from "../ui/Tag";
import {
  FACTORS,
  type Factor,
  KIND_LABEL,
  lessonHeading,
  MILESTONES,
  type MilestoneKind,
  milestonesFor,
} from "./milestones";
import { Sources } from "./Sources";

/** The kind in words; the node on the rail tells it by shape. */
function KindTag({ kind }: { kind: MilestoneKind }) {
  if (kind === "incident") {
    return (
      <Tag variant="ember">
        <Alert />
        {KIND_LABEL.incident}
      </Tag>
    );
  }
  return <Tag variant={kind === "next" ? "gap" : "neutral"}>{KIND_LABEL[kind]}</Tag>;
}

/**
 * Every milestone in chronological order. With a factor chosen, the ones that do not involve it
 * collapse to their date and title but keep their place, so the order still reads as a history.
 */
export function Timeline({ factor }: { factor?: Factor }) {
  const shown = new Set(milestonesFor(factor));
  return (
    <ol className="ff-tl">
      {MILESTONES.map((m) => {
        const open = shown.has(m);
        return (
          <li
            key={m.id}
            className={`ff-tl__item ff-tl__item--${m.kind}${open ? "" : " ff-tl__item--collapsed"}`}
          >
            <span className="ff-tl__when">{m.when}</span>
            <span className="ff-tl__rail" aria-hidden="true">
              <i />
            </span>
            <div className="ff-tl__body">
              <div className="ff-tl__head">
                <h4 className="ff-tl__title">{m.title}</h4>
                {open ? <KindTag kind={m.kind} /> : null}
              </div>
              {open ? (
                <>
                  <p className="ff-tl__what">{m.what}</p>
                  <div className="ff-tl__lesson">
                    <p className="ff-eyebrow">{lessonHeading(m.kind)}</p>
                    <p>{m.lesson}</p>
                  </div>
                  <div className="ff-tl__factors">
                    {m.factors.map((f) => (
                      <Tag key={f} variant={f === factor ? "accent" : "neutral"}>
                        {FACTORS[f].label}
                      </Tag>
                    ))}
                  </div>
                  <Sources sources={m.sources} />
                </>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
