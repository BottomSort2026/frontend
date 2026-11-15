import { ArrowUpRight } from "../ui/icons";
import { PAGE, type Source } from "./milestones";

/** Where a piece of text comes from: each NASA document links to itself, named by its title. */
export function Sources({ sources }: { sources: readonly Source[] }) {
  return (
    <div className="ff-msrc">
      <span className="ff-eyebrow">{PAGE.sources}</span>
      <ul className="ff-msrc__list">
        {sources.map((s) => (
          <li key={s.label}>
            {s.url ? (
              <a className="ff-msrc__link" href={s.url} target="_blank" rel="noreferrer">
                <span>
                  {s.label}
                  <ArrowUpRight />
                </span>
                <span className="ff-visually-hidden">, {PAGE.newTab}</span>
              </a>
            ) : (
              <span className="ff-msrc__name">{s.label}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
