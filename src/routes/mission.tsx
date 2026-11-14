import { createFileRoute } from "@tanstack/react-router";
import { Section, SectionBlock } from "../sections/Section";
import { useTravel } from "../sky/TravelContext";
import { Button } from "../ui/Button";

export const Route = createFileRoute("/mission")({ component: MissionPage });

const MOMENTS = [
  {
    year: "1967",
    name: "Apollo 1",
    text: "Fire erupted in an oxygen-filled cabin during a pre-launch test. The crew died.",
  },
  {
    year: "1970",
    name: "Apollo 13",
    text: "An oxygen tank exploded on the way to the Moon. The crew survived.",
  },
  {
    year: "1997",
    name: "Mir",
    text: "An oxygen generator failed and caught fire. The multinational crew survived.",
  },
  { year: "2026", name: "Artemis II", text: "A smoke alarm sounded about 80,000 miles from home." },
] as const;

function MissionPage() {
  const { jump } = useTravel();
  return (
    <Section
      id="mission"
      title="Fire behaves differently when nothing falls."
      lead="On Earth, hot gas rises and a flame stretches into a teardrop. In free fall there is no up, so a candle flame becomes a faint blue sphere fed by diffusion. NASA has decades of data on these flames. We make it easy to find, compare and understand, for the crews going back to the Moon and on to Mars."
    >
      <SectionBlock className="ff-sec__row">
        <Button variant="primary" onClick={() => jump("lab")}>
          Open the flame lab
        </Button>
        <Button onClick={() => jump("library")}>Browse the library</Button>
      </SectionBlock>
      <SectionBlock className="ff-moments">
        {MOMENTS.map((m) => (
          <div className="ff-moment" key={m.name}>
            <span className="ff-moment__year">{m.year}</span>
            <span className="ff-moment__name">{m.name}</span>
            <p className="ff-moment__text">{m.text}</p>
          </div>
        ))}
      </SectionBlock>
    </Section>
  );
}
