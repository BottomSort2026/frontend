import type { ReactNode } from "react";
import "./tag.css";

export type TagVariant = "neutral" | "accent" | "ember" | "nominal" | "hazard" | "gap";
/** Fuel types are told apart by shape as well as by word. */
export type TagGlyph = "solid" | "liquid" | "gas";

interface TagProps {
  variant?: TagVariant;
  glyph?: TagGlyph;
  children: ReactNode;
}

function Glyph({ glyph }: { glyph?: TagGlyph }) {
  return glyph ? <i className={`ff-tag__glyph ff-tag__glyph--${glyph}`} /> : null;
}

export function Tag({ variant = "neutral", glyph, children }: TagProps) {
  return (
    <span className={`ff-tag${variant === "neutral" ? "" : ` ff-tag--${variant}`}`}>
      <Glyph glyph={glyph} />
      {children}
    </span>
  );
}

interface FilterTagProps {
  pressed: boolean;
  onPress: () => void;
  glyph?: TagGlyph;
  children: ReactNode;
}

/** A tag used as a filter or preset: exactly one in its group is pressed. */
export function FilterTag({ pressed, onPress, glyph, children }: FilterTagProps) {
  return (
    <button type="button" className="ff-tag" aria-pressed={pressed} onClick={onPress}>
      <Glyph glyph={glyph} />
      {children}
    </button>
  );
}
