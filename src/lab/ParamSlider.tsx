import "./slider.css";

export interface SliderTick {
  value: number;
  label: string;
  hint: string;
  /** Put the label before or after its mark when two ticks sit close together. */
  align?: "before" | "after";
}

interface ParamSliderProps {
  id: string;
  label: string;
  unit: string;
  digits?: number;
  min: number;
  max: number;
  step: number;
  value: number;
  /** Dragging: the value follows the pointer, no animation. */
  onChange: (value: number) => void;
  /** A tick was chosen: the parent glides the value there. */
  onJump: (value: number) => void;
  ticks: readonly SliderTick[];
  /** The track becomes the gravity scale: flame-blue at 0 g, ember at 1 g. */
  variant?: "gravity";
  /** A range with no measured data behind it, drawn dashed, with its legend. */
  gap?: { from: number; to: number; legend: string };
}

export function ParamSlider({
  id,
  label,
  unit,
  digits = 0,
  min,
  max,
  step,
  value,
  onChange,
  onJump,
  ticks,
  variant,
  gap,
}: ParamSliderProps) {
  const span = max - min;
  const p = (value - min) / span;
  return (
    <div className={`ff-slider${variant ? ` ff-slider--${variant}` : ""}`} style={{ "--p": p }}>
      <div className="ff-slider__head">
        <label className="ff-eyebrow" htmlFor={id}>
          {label}
        </label>
        <output className="ff-slider__val" htmlFor={id}>
          {value.toFixed(digits)}
          <small>{unit}</small>
        </output>
      </div>
      <div className="ff-slider__rail">
        {gap ? (
          <span
            className="ff-slider__gap"
            style={{ "--from": (gap.from - min) / span, "--to": (gap.to - min) / span }}
          />
        ) : (
          <span className="ff-slider__fill" />
        )}
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-describedby={gap ? `${id}-legend` : undefined}
          onChange={(ev) => onChange(Number(ev.target.value))}
        />
      </div>
      <div className="ff-slider__ticks">
        {ticks.map((t) => (
          <button
            key={t.value}
            type="button"
            className={`ff-slider__tick${t.align ? ` ff-slider__tick--${t.align}` : ""}`}
            style={{ "--at": (t.value - min) / span }}
            aria-pressed={Math.abs(t.value - value) < span / 400}
            aria-label={`${label}: ${t.label}, ${t.hint} ${unit}`}
            onClick={() => onJump(t.value)}
          >
            {t.label}
            <span>{t.hint}</span>
          </button>
        ))}
      </div>
      {gap ? (
        <p className="ff-slider__legend" id={`${id}-legend`}>
          {gap.legend}
        </p>
      ) : null}
    </div>
  );
}
