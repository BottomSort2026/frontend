import { Download } from "../ui/icons";
import "./predictor.css";

/**
 * Bottom left of the Flame Lab: the cleaned FLEX tests behind the models, as a CSV. The gateway
 * serves the file from its own repository (`GET /datasets/flex-training.csv`).
 */
export function TrainingData({ href }: { href: string }) {
  return (
    <div className="ff-lab-data">
      <a className="ff-lab-link" href={href} download>
        <Download />
        Download training data (CSV)
      </a>
      <p className="ff-predict__source">
        The cleaned FLEX tests (PSI-69) behind the extinction model: fuel, pressure, atmosphere and
        droplet size of each test.
      </p>
    </div>
  );
}
