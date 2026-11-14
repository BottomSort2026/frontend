import { createFileRoute } from "@tanstack/react-router";
import { modelInfoQuery } from "../api/queries";
import { FlameSim } from "../lab/FlameSim";
import { Predictor } from "../lab/Predictor";
import { Section, SectionBlock } from "../sections/Section";

export const Route = createFileRoute("/flame-lab")({
  // Warm the model description so the predictor's controls are ready on arrival. Never blocks the page.
  loader: ({ context }) => void context.queryClient.prefetchQuery(modelInfoQuery),
  component: FlameLabPage,
});

function FlameLabPage() {
  return (
    <Section
      id="lab"
      title="Change gravity. Watch the flame change."
      lead="Slide from the ISS to Earth, add oxygen, add a breeze. Then ask the model trained on ISS tests what happens."
    >
      <SectionBlock>
        <FlameSim />
      </SectionBlock>
      <SectionBlock className="ff-sec__head">
        <p className="ff-eyebrow">Predictor</p>
        <h3 className="ff-sec__sub">Predict from ISS test data.</h3>
        <p className="ff-note">
          Set the conditions of a test. The model answers only inside the ranges PSI actually
          tested, and says so when you leave them.
        </p>
      </SectionBlock>
      <SectionBlock>
        <Predictor />
      </SectionBlock>
    </Section>
  );
}
