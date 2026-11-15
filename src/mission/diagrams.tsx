// Two static drawings for "Why a flame changes". They are decoration: the sentences beside them
// carry the meaning, so both are hidden from screen readers.

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** On Earth: a teardrop flame with hot gas rising beside it. */
export function EarthFlame() {
  return (
    <svg className="ff-diagram" viewBox="0 0 96 96" aria-hidden="true" {...STROKE}>
      <path
        className="ff-diagram__earth"
        d="M48 14C54 30 66 44 66 62A18 18 0 0 1 30 62C30 44 42 30 48 14Z"
      />
      <path d="M16 78V64M12 68l4-4 4 4M16 48V34M12 38l4-4 4 4M80 64V50M76 54l4-4 4 4" />
    </svg>
  );
}

/** In free fall: a spherical flame fed by oxygen diffusing in from every side. */
export function FreeFallFlame() {
  return (
    <svg className="ff-diagram" viewBox="0 0 96 96" aria-hidden="true" {...STROKE}>
      <circle className="ff-diagram__free" cx="48" cy="48" r="18" />
      <path d="M8 48h14M18 44l4 4-4 4M88 48H74M78 44l-4 4 4 4M48 8v14M44 18l4 4 4-4M48 88V74M44 78l4-4 4 4" />
    </svg>
  );
}
