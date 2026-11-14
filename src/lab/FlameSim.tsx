import { animate, useReducedMotion, type AnimationPlaybackControls } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { motionTokens } from "../lib/motion";
import { FilterTag, Tag } from "../ui/Tag";
import { createFlame, type FlameCanvas } from "./flameCanvas";
import { BASIS_LABEL, describeFlame, PRESETS, samePreset, type FlameParams } from "./flameModel";
import { ParamSlider, type SliderTick } from "./ParamSlider";
import "./lab.css";

const GRAVITY_TICKS: readonly SliderTick[] = [
  { value: 0, label: "ISS", hint: "0 g", align: "after" },
  { value: 0.17, label: "Moon", hint: "0.17" },
  { value: 0.38, label: "Mars", hint: "0.38" },
  { value: 1, label: "Earth", hint: "1 g", align: "before" },
];
const OXYGEN_TICKS: readonly SliderTick[] = [
  { value: 21, label: "Earth", hint: "21", align: "before" },
  { value: 30, label: "Moon Base", hint: "30+", align: "after" },
  { value: 85, label: "CFI-G", hint: "85" },
  { value: 100, label: "Suit", hint: "100", align: "before" },
];
const AIRFLOW_TICKS: readonly SliderTick[] = [
  { value: 0, label: "Still", hint: "0", align: "after" },
  { value: 20, label: "Gentle", hint: "20" },
  { value: 40, label: "Strong", hint: "40", align: "before" },
];

/**
 * The illustrative flame explainer: gravity, oxygen and airflow in, a picture and three readings out.
 * It teaches the physics and runs locally. Predictions from data live in <Predictor>.
 */
export function FlameSim() {
  const reduce = useReducedMotion() ?? false;
  const canvas = useRef<HTMLCanvasElement>(null);
  const flame = useRef<FlameCanvas | null>(null);
  const [params, setParams] = useState<FlameParams>(PRESETS[0]!.params);
  const latest = useRef(params);
  latest.current = params;
  const glides = useRef<Partial<Record<keyof FlameParams, AnimationPlaybackControls>>>({});

  useEffect(() => {
    const f = createFlame(canvas.current!, reduce);
    flame.current = f;
    f.set(latest.current);
    f.start();
    const running = glides.current;
    return () => {
      f.destroy();
      flame.current = null;
      for (const g of Object.values(running)) g?.stop();
    };
  }, [reduce]);

  useEffect(() => {
    flame.current?.set(params);
  }, [params]);

  /** Dragging: the value follows the pointer. */
  const setNow = (key: keyof FlameParams, value: number) => {
    glides.current[key]?.stop();
    setParams((p) => ({ ...p, [key]: value }));
  };

  /** A preset or tick: the thumb is already on screen, so it glides with ease-in-out. */
  const glide = (key: keyof FlameParams, to: number) => {
    glides.current[key]?.stop();
    if (reduce) return setNow(key, to);
    const t = motionTokens();
    glides.current[key] = animate(latest.current[key], to, {
      duration: t.base,
      ease: t.inOut,
      onUpdate: (v) => setParams((p) => ({ ...p, [key]: v })),
    });
  };

  const applyPreset = (target: FlameParams) => {
    glide("gravity", target.gravity);
    glide("oxygen", target.oxygen);
    glide("airflow", target.airflow);
  };

  const reading = describeFlame(params);

  return (
    <div className="ff-lab">
      <div className="ff-lab__view">
        <canvas
          ref={canvas}
          role="img"
          aria-label="Illustration of a droplet flame under the selected gravity, oxygen and airflow"
        />
        <span className="ff-lab__badge">
          <Tag>Illustrative model</Tag>
        </span>
        <div className="ff-lab__axes" aria-hidden="true">
          <span>airflow →</span>
          <span>gravity ↓</span>
        </div>
        <div className="ff-lab__state" aria-live="polite">
          <div>
            <span className="ff-eyebrow">Shape</span>
            <strong>{reading.shape}</strong>
          </div>
          <div>
            <span className="ff-eyebrow">Oxygen supply</span>
            <strong>{reading.transport}</strong>
          </div>
          <div>
            <span className="ff-eyebrow">Colour</span>
            <strong>{reading.colour}</strong>
          </div>
          <p className="ff-lab__basis" data-gap={reading.basis === "interpolated"}>
            <i />
            <span>{BASIS_LABEL[reading.basis]}</span>
          </p>
        </div>
      </div>

      <div className="ff-lab__panel">
        <div className="ff-lab__presets" role="group" aria-label="Scenario presets">
          {PRESETS.map((preset) => (
            <FilterTag
              key={preset.label}
              pressed={samePreset(preset.params, params)}
              onPress={() => applyPreset(preset.params)}
            >
              {preset.label}
            </FilterTag>
          ))}
        </div>
        <ParamSlider
          id="lab-gravity"
          label="Gravity"
          unit="g"
          digits={2}
          min={0}
          max={1}
          step={0.01}
          value={params.gravity}
          onChange={(v) => setNow("gravity", v)}
          onJump={(v) => glide("gravity", v)}
          ticks={GRAVITY_TICKS}
          variant="gravity"
          gap={{
            from: 0.03,
            to: 0.97,
            legend: "Interpolated between 0 g and 1 g: PSI has no partial-gravity data yet",
          }}
        />
        <ParamSlider
          id="lab-oxygen"
          label="Oxygen"
          unit="% O₂"
          min={10}
          max={100}
          step={1}
          value={params.oxygen}
          onChange={(v) => setNow("oxygen", v)}
          onJump={(v) => glide("oxygen", v)}
          ticks={OXYGEN_TICKS}
        />
        <ParamSlider
          id="lab-airflow"
          label="Airflow"
          unit="cm/s"
          min={0}
          max={40}
          step={1}
          value={params.airflow}
          onChange={(v) => setNow("airflow", v)}
          onJump={(v) => glide("airflow", v)}
          ticks={AIRFLOW_TICKS}
        />
        <p className="ff-lab__fine">
          A visual explainer of the physics, not a solver. For predictions trained on ISS tests, use
          the predictor below.
        </p>
      </div>
    </div>
  );
}
