import type { ReactNode } from "react";
import { Tag } from "../ui/Tag";
import "./pillar.css";

interface SafetyPillarProps {
  index: string;
  icon: ReactNode;
  title: string;
  body: string;
  /** Investigations that back this pillar. */
  evidence: readonly string[];
}

/** One of the three pillars of spacecraft fire safety. Always shown as a set of three, in order. */
export function SafetyPillar({ index, icon, title, body, evidence }: SafetyPillarProps) {
  return (
    <article className="ff-pillar">
      <div className="ff-pillar__head">
        <span className="ff-eyebrow">{index}</span>
        {icon}
      </div>
      <h3 className="ff-pillar__title">{title}</h3>
      <p className="ff-pillar__body">{body}</p>
      <div className="ff-pillar__meta">
        <span className="ff-eyebrow">Evidence</span>
        <div className="ff-pillar__tags">
          {evidence.map((e) => (
            <Tag key={e}>{e}</Tag>
          ))}
        </div>
      </div>
    </article>
  );
}
