import { createFileRoute } from "@tanstack/react-router";
import { SafetyPillar } from "../safety/SafetyPillar";
import { Section, SectionBlock } from "../sections/Section";
import { Droplet, Sensor, Shield } from "../ui/icons";
import { Readout } from "../ui/Readout";

export const Route = createFileRoute("/fire-safety")({ component: FireSafetyPage });

function FireSafetyPage() {
  return (
    <Section
      id="safety"
      title="Prevention, detection, suppression."
      lead="NASA's spacecraft fire safety work rests on three pillars. Each one is backed by experiments flown in microgravity."
    >
      <SectionBlock className="ff-pillars">
        <SafetyPillar
          index="01"
          icon={<Shield />}
          title="Prevention"
          body="Control ignition sources and choose materials that will not keep burning. That depends on flammability limits, which move with oxygen concentration and airflow."
          evidence={["BASS", "BASS-II", "Saffire I-III", "ACME-BRE"]}
        />
        <SafetyPillar
          index="02"
          icon={<Sensor />}
          title="Detection"
          body="Fire detection was tested in microgravity by measuring the smoke and aerosols a spacecraft fire really produces."
          evidence={["SAME", "SAME-R", "DAFT"]}
        />
        <SafetyPillar
          index="03"
          icon={<Droplet />}
          title="Suppression"
          body="Diluting the atmosphere with carbon dioxide or helium puts flames out. Fine-water-mist extinguishers developed for the ISS also have uses on Earth."
          evidence={["FLEX", "FLEX-2"]}
        />
      </SectionBlock>
      <SectionBlock className="ff-sec__head">
        <p className="ff-eyebrow">Why the Moon raises the stakes</p>
        <div className="ff-facts">
          <Readout label="Moon Base oxygen" value="30" unit="% or more" note="Earth air: 21 %" />
          <Readout
            label="Moon Base pressure"
            value="10.2"
            unit="psi or less"
            note="Earth at sea level: 14.7 psi"
          />
          <Readout label="Spacesuit" value="100" unit="% O₂" note="At only 4.3 psi" />
        </div>
        <p className="ff-note">
          Over 40 % more oxygen than Earth air makes materials much more flammable.
        </p>
      </SectionBlock>
    </Section>
  );
}
