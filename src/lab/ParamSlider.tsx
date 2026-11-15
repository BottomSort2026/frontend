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
  /** Kept in place but not usable (45 % opacity), so the layout does not jump. */
  disabled?: boolean;
  /** Shown in place of the ticks while disabled, e.g. "No suppressant added". */
  helper?: string;
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
  disabled = false,
  helper,
}: ParamSliderProps) {
  const span = max - min || 1;
  const p = Math.min(1, Math.max(0, (value - min) / span));
  const shown = `${value.toFixed(digits)} ${unit}`.trim();
  return (
    <div className={`ff-slider${disabled ? " ff-slider--disabled" : ""}`} style={{ "--p": p }}>
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
        <span className="ff-slider__fill" />
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          aria-valuetext={shown}
          aria-describedby={disabled && helper ? `${id}-helper` : undefined}
          onChange={(ev) => onChange(Number(ev.target.value))}
        />
      </div>
      <div className="ff-slider__ticks">
        {disabled && helper ? (
          <p className="ff-slider__helper" id={`${id}-helper`}>
            {helper}
          </p>
        ) : null}
        {disabled
          ? null
          : ticks.map((t) => (
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
    </div>
  );
}
