import type { Ref } from "react";
import type { Point } from "./projection";
import type { PlainStar, StarDef } from "./stars";
import "./navstar.css";

interface NavStarProps {
  star: StarDef;
  position: Point;
  /** Label under the star, for narrow viewports. */
  stack: boolean;
  index: number;
  onSelect: (star: StarDef) => void;
  /** Pointer over or focus on the star: the person may be about to choose it. */
  onIntent?: (star: StarDef) => void;
  ref?: Ref<HTMLButtonElement>;
}

/** A destination star: a real button with a 48px body around a 9px core. */
export function NavStar({ star, position, stack, index, onSelect, onIntent, ref }: NavStarProps) {
  const cls = [
    "ff-star",
    star.warm && "ff-star--warm",
    stack ? "ff-star--stack" : star.side === "left" && "ff-star--left",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      ref={ref}
      type="button"
      className={cls}
      style={{
        "--x": `${position.x}px`,
        "--y": `${position.y}px`,
        "--mag": star.mag,
        "--delay": `${-index * 1.3}s`,
      }}
      onClick={() => onSelect(star)}
      onPointerEnter={() => onIntent?.(star)}
      onFocus={() => onIntent?.(star)}
    >
      <span className="ff-star__body">
        <span className="ff-star__halo" />
        <span className="ff-star__ring" />
        <span className="ff-star__core" />
      </span>
      <span className="ff-star__text">
        <span className="ff-star__name">{star.name}</span>
        <span className="ff-star__des">
          <span className="ff-star__gr">{star.greek}</span> Cru · {star.star}
        </span>
      </span>
    </button>
  );
}

/** A star that is not a destination (Ginan, the Pointers): no halo, no interaction. */
export function PlainStarMark({ star, position }: { star: PlainStar; position: Point }) {
  return (
    <span
      className="ff-star ff-star--plain"
      aria-hidden="true"
      style={{ "--x": `${position.x}px`, "--y": `${position.y}px`, "--mag": star.mag }}
    >
      <span className="ff-star__body">
        <span className="ff-star__core" />
      </span>
      {star.name ? (
        <span className="ff-star__text">
          <span className="ff-star__name">{star.name}</span>
        </span>
      ) : null}
    </span>
  );
}
