import { GRAVITY_LEVELS } from "./milestones";

/**
 * From free fall to Earth. A list first: the line and the marks are drawn by CSS and say nothing a
 * screen reader would miss. Only the two ends have data; the levels between them are hollow.
 */
export function GravityScale() {
  const last = GRAVITY_LEVELS.length - 1;
  return (
    <ol className="ff-gscale">
      {GRAVITY_LEVELS.map((g, i) => {
        const tone = !g.hasPsiData ? "gap" : i === 0 ? "free-fall" : i === last ? "earth" : "data";
        return (
          <li key={g.place} className={`ff-gscale__level ff-gscale__level--${tone}`}>
            <span className="ff-gscale__mark" aria-hidden="true" />
            <span className="ff-gscale__place">{g.place}</span>
            <span className="ff-gscale__g">{g.gravity}</span>
            <span className="ff-gscale__data">{g.data}</span>
          </li>
        );
      })}
    </ol>
  );
}
