import { describe, expect, it } from "vite-plus/test";
import { choiceLabel, formatNumber, humanize, testEndLabel } from "./labels";

describe("field labels", () => {
  it("splits the unit off a field name", () => {
    expect(humanize("burning_rate_mm2_s")).toEqual({ label: "Burning rate", unit: "mm²/s" });
    expect(humanize("extinction_diameter_mm")).toEqual({
      label: "Extinction diameter",
      unit: "mm",
    });
    expect(humanize("pressure_atm")).toEqual({ label: "Pressure", unit: "atm" });
  });

  it("writes chemical names properly", () => {
    expect(humanize("o2").label).toBe("O₂");
    expect(humanize("co2").label).toBe("CO₂");
    expect(humanize("droplet_d0_mm")).toEqual({ label: "Droplet D₀", unit: "mm" });
  });

  it("leaves unknown names readable", () => {
    expect(humanize("outcome")).toEqual({ label: "Outcome", unit: undefined });
  });

  it("formats numbers to three significant digits", () => {
    expect(formatNumber(0.6789)).toBe("0.679");
    expect(formatNumber(3)).toBe("3");
    expect(formatNumber(1234.5)).toBe("1235");
    expect(formatNumber(0)).toBe("0");
  });

  it("names the Lab's inputs and choices", () => {
    expect(humanize("suppressant_fraction")).toEqual({ label: "Amount" });
    expect(choiceLabel("none")).toBe("None");
    expect(choiceLabel("co2")).toBe("CO₂");
    expect(choiceLabel("he")).toBe("Helium");
    expect(choiceLabel("methanol")).toBe("Methanol");
  });

  it("says how a real test ended", () => {
    expect(testEndLabel("extinction")).toBe("went out");
    expect(testEndLabel("completion")).toBe("burned out");
    expect(testEndLabel("disruption")).toBe("broke apart");
    expect(testEndLabel(null)).toBe("end not recorded");
    expect(testEndLabel("fiber_contact")).toBe("fiber contact");
  });
});
