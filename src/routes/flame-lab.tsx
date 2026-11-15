import { createFileRoute } from "@tanstack/react-router";
import { hasBackend, trainingDataUrl } from "../api/client";
import { SAMPLE_FIXTURES, type SampleFixture } from "../api/mock";
import { modelInfoQuery } from "../api/queries";
import { Predictor } from "../lab/Predictor";
import { TrainingData } from "../lab/TrainingData";
import { Section, SectionBlock } from "../sections/Section";
import { Tag } from "../ui/Tag";

interface FlameLabSearch {
  /** Sample mode only: which fixture Predict answers with (no_extinction, out_of_range, …). */
  sample?: SampleFixture;
}

export const Route = createFileRoute("/flame-lab")({
  validateSearch: (search: Record<string, unknown>): FlameLabSearch => ({
    sample: hasBackend ? undefined : SAMPLE_FIXTURES.find((f) => f === search.sample),
  }),
  // Warm the model description so the controls are ready on arrival. Never blocks the page.
  loader: ({ context }) => void context.queryClient.prefetchQuery(modelInfoQuery),
  component: FlameLabPage,
});

function FlameLabPage() {
  const { sample } = Route.useSearch();
  return (
    <Section
      id="lab"
      title="Set a test. See if the flame goes out."
      lead="Choose the fuel, the atmosphere and the droplet size of an ISS droplet test. The models trained on 274 FLEX tests predict the outcome and show which real tests back it."
    >
      <SectionBlock className="ff-sec__row">
        <Tag variant="accent">Microgravity (ISS) data only</Tag>
      </SectionBlock>
      <SectionBlock>
        <Predictor fixture={sample} />
      </SectionBlock>
      {/* Only with a gateway: it is the one that serves the file. */}
      {trainingDataUrl ? (
        <SectionBlock>
          <TrainingData href={trainingDataUrl} />
        </SectionBlock>
      ) : null}
    </Section>
  );
}
