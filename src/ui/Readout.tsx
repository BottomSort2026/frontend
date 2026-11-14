import "./readout.css";

interface ReadoutProps {
  label: string;
  value: string;
  unit?: string;
  /** A reference that gives scale, e.g. "Earth at sea level: 14.7 psi". */
  note?: string;
  /** `gap`: interpolated or not backed by PSI. `text`: a state in words. */
  variant?: "number" | "text" | "gap";
}

export function Readout({ label, value, unit, note, variant = "number" }: ReadoutProps) {
  return (
    <div className={`ff-readout${variant === "number" ? "" : ` ff-readout--${variant}`}`}>
      <p className="ff-eyebrow">{label}</p>
      <p className="ff-readout__value">
        {value}
        {unit ? <span className="ff-readout__unit">{unit}</span> : null}
      </p>
      {note ? <p className="ff-readout__note">{note}</p> : null}
    </div>
  );
}
