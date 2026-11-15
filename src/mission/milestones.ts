// The Mission page's content: how incidents and experiments taught NASA how flames behave without gravity.
// Every sentence here comes from docs/mission_facts.md, which records the NASA source of each fact.
// Change that document first, then this file.

export type Factor = "gravity" | "oxygen" | "pressure" | "airflow" | "smoke" | "suppression";

export type MilestoneKind = "incident" | "facility" | "experiment" | "next";

/** The factors in the order the filter shows them. */
export const FACTOR_IDS: readonly Factor[] = [
  "gravity",
  "oxygen",
  "pressure",
  "airflow",
  "smoke",
  "suppression",
];

/** A factor read from the URL, or none when the value is not one. */
export function factorFrom(value: unknown): Factor | undefined {
  return FACTOR_IDS.find((f) => f === value);
}

/** A NASA page or document. Only the challenge brief has no URL: it is cited by name. */
export interface Source {
  label: string;
  url?: string;
}

export interface Milestone {
  id: string;
  /** The label shown, such as "1967" or "From 2016". */
  when: string;
  /** Sorts the list; a year, with decimals where two milestones share one. */
  order: number;
  kind: MilestoneKind;
  title: string;
  what: string;
  lesson: string;
  factors: readonly Factor[];
  sources: readonly Source[];
}

export interface FactorInfo {
  label: string;
  text: string;
  sources: readonly Source[];
}

export interface GravityLevel {
  place: string;
  gravity: string;
  data: string;
  hasPsiData: boolean;
}

export interface Assumption {
  /** The guide's wording, quoted exactly. */
  wording: string;
  /** What the research showed instead. */
  answer: string;
  sources: readonly Source[];
}

const GUIDE_URL =
  "https://www.nasa.gov/wp-content/uploads/2016/05/np-2015-10-034-jsc_combustion_in_reduced_gravity-iss-mini-book-011116-508.pdf";

/** NASA's "Combustion in Reduced Gravity", at the pages that hold the fact. */
function guide(pages: string): Source {
  return { label: `Combustion in Reduced Gravity, NASA, ${pages}`, url: GUIDE_URL };
}

export const BRIEF: Source = { label: "NASA Space Apps 2026 challenge brief, Flame in Freefall" };

const GLENN: Source = {
  label: "Combustion Science, NASA Glenn",
  url: "https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/",
};
const ZEROG: Source = {
  label: "Zero Gravity Facility 1966, NASA",
  url: "https://www.nasa.gov/image-article/zero-gravity-facility-1966",
};
const APOLLO1: Source = {
  label: "Apollo 1, NASA Safety and Mission Assurance",
  url: "https://sma.nasa.gov/sma-disciplines/accllp/apollo-1",
};
const APOLLO1P: Source = {
  label: "55 Years Ago: The Apollo 1 Fire and its Aftermath, NASA",
  url: "https://www.nasa.gov/history/55-years-ago-the-apollo-1-fire-and-its-aftermath/",
};
const APOLLO1MIX: Source = {
  label: "NASA decides on a mixed-gas atmosphere for Apollo, NASA History",
  url: "https://www.nasa.gov/history/50th-anniversary-of-nasa-deciding-on-a-mixed-gas-atmosphere-for-apollo-a-direct-result-of-the-apollo-fire/",
};
const APOLLO13: Source = {
  label: "Apollo 13, NASA Safety and Mission Assurance",
  url: "https://sma.nasa.gov/sma-disciplines/accllp/apollo-13",
};
const APOLLO13M: Source = {
  label: "Apollo 13: Mission Details, NASA",
  url: "https://www.nasa.gov/missions/apollo/apollo-13-mission-details/",
};
const SKYLAB: Source = {
  label: "Zero Gravity Flammability (Skylab M479), NASA NSSDCA",
  url: "https://nssdc.gsfc.nasa.gov/nmc/experiment/display.action?id=1973-027A-34",
};
const FSBIB: Source = {
  label: "Spacecraft Fire Safety 1956 to 1999: An Annotated Bibliography, NASA, ref. 87",
  url: "https://ntrs.nasa.gov/citations/20130014735",
};
const CANDLE: Source = {
  label: "Candle Flames in Non-Buoyant Atmospheres, NASA",
  url: "https://ntrs.nasa.gov/citations/20000005087",
};
const MIR: Source = {
  label: "25 Years Ago: Fire Aboard Space Station Mir, NASA",
  url: "https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/",
};
const SAME: Source = {
  label: "Smoke Aerosol Measurement Experiment fact sheet, NASA",
  url: "https://www.nasa.gov/wp-content/uploads/2025/07/smoke-aerosol-measurement-experiment-same.pdf",
};
const SAME13: Source = {
  label: "Evaluation of Low-Gravity Smoke Particulate for Spacecraft Fire Detection, NASA",
  url: "https://ntrs.nasa.gov/citations/20140006579",
};
const FLEX: Source = {
  label: "Flame Extinguishment Experiment fact sheet, NASA",
  url: "https://www.nasa.gov/wp-content/uploads/2025/07/flame-extinguishment-experiment-flex.pdf",
};
const COOL: Source = {
  label: "Cool Flames Created During a First for ISS Research, NASA",
  url: "https://www.nasa.gov/?p=73963",
};
const BASS: Source = {
  label: "Burning and Suppression of Solids fact sheet, NASA",
  url: "https://www.nasa.gov/wp-content/uploads/2025/07/burning-and-suppression-of-solids-bass.pdf",
};
const SAFFIRE: Source = {
  label: "Spacecraft Fire Safety Demonstration fact sheet, NASA",
  url: "https://www.nasa.gov/wp-content/uploads/2025/07/spacecraft-fire-safety-demonstration-saffire.pdf",
};
const SAFFIRE6: Source = {
  label: "Preliminary Results from the Saffire VI Experiment, NASA",
  url: "https://ntrs.nasa.gov/citations/20240002981",
};
const SOFIE: Source = {
  label: "Solid Fuel Ignition and Extinction, NASA Glenn",
  url: "https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/solid-fuel-ignition-and-extinction-sofie/",
};
const SOFIEGEL: Source = {
  label: "SoFIE GEL first test, NASA Image Library",
  url: "https://images.nasa.gov/details/jsc2023e002281",
};
const FM2: Source = {
  label: "Flammability of Materials on the Moon, NASA Glenn",
  url: "https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/flammability-of-materials-on-the-moon-fm2/",
};

export const MILESTONES: readonly Milestone[] = [
  {
    id: "zero-gravity-facility",
    when: "1966",
    order: 1966,
    kind: "facility",
    title: "Zero Gravity Facility",
    what: "At NASA's Lewis Research Center, now Glenn, experiments fell 460 feet for 5.18 seconds of free fall.",
    lesson:
      "A few seconds at a time, drop towers and aircraft carried most of the research on flames without buoyancy. The most promising experiments were then chosen to fly in space.",
    factors: ["gravity"],
    sources: [ZEROG, guide("pp. 17, 27, 30")],
  },
  {
    id: "apollo-1",
    when: "1967",
    order: 1967,
    kind: "incident",
    title: "Apollo 1",
    what: "On 27 January 1967 a flash fire swept through the command module during a test on the launch pad. The cabin was pressurised with 100 % oxygen at 16.7 psi, and there was no time to open the hatches. Grissom, White and Chaffee died.",
    lesson:
      "NASA restricted and controlled combustible materials in the spacecraft, moved to fire-resistant suits, and fitted a hatch that opens in three seconds. On the launch pad, the cabin now held 60 % oxygen and 40 % nitrogen.",
    factors: ["oxygen", "pressure"],
    sources: [APOLLO1, APOLLO1P, APOLLO1MIX],
  },
  {
    id: "apollo-13",
    when: "1970",
    order: 1970,
    kind: "incident",
    title: "Apollo 13",
    what: "On 13 April 1970, the third day of the flight to the Moon, oxygen tank two exploded. In a ground test its heaters had been left on for hours, which damaged the Teflon insulation inside it. The crew used the lunar module as a lifeboat and splashed down on 17 April.",
    lesson:
      "NASA reviewed every Apollo system that uses cryogenic oxygen. Later flights carried a third oxygen tank in a different bay, upgraded thermostats and wiring sheathed in stainless steel.",
    factors: ["oxygen"],
    sources: [APOLLO13, APOLLO13M],
  },
  {
    id: "skylab-m479",
    when: "1970s",
    order: 1973,
    kind: "experiment",
    title: "Skylab M479",
    what: "Skylab astronauts burned aluminized Mylar, nylon, polyurethane foam, Teflon, paper and other materials in a chamber at 5.2 psia and 65 % oxygen. Each test lasted between 10 seconds and four minutes.",
    lesson:
      "Materials burned more slowly than in 1 g: Mylar at about half the rate, foam at 15 %. Venting the chamber was tried to put the flames out, and they grew stronger before going out.",
    factors: ["gravity", "oxygen", "pressure", "suppression"],
    sources: [SKYLAB, FSBIB],
  },
  {
    id: "candle-flames",
    when: "From 1992",
    order: 1992,
    kind: "experiment",
    title: "Candle flames on the Shuttle and Mir",
    what: "Candles were lit in orbit. On the Shuttle in 1992 the flames turned dim blue and lasted less than 60 seconds, because the safety box around them limited the oxygen reaching the flame. On Mir, in a redesigned box, they burned for as long as 45 minutes.",
    lesson:
      "A flame can keep burning in still air with no buoyancy to feed it, and at a lower oxygen level than the same candle on Earth.",
    factors: ["gravity", "oxygen"],
    sources: [CANDLE, guide("p. 30")],
  },
  {
    id: "mir-fire",
    when: "1997",
    order: 1997,
    kind: "incident",
    title: "Fire aboard Mir",
    what: "On 24 February 1997 a solid-fuel oxygen generator ignited in the Kvant-1 module. The flame reached about three feet, burned for several minutes and blocked the way to one of the Soyuz escape craft. Six people were aboard.",
    lesson:
      "The flame went out on its own, but the smoke took the life support system hours to clear. Emergency training, ground support and the preparation of the generators changed, and the lessons went into the design and operation of the International Space Station.",
    factors: ["oxygen", "smoke", "suppression"],
    sources: [MIR],
  },
  {
    id: "combustion-module",
    when: "1997 to 2003",
    order: 1997.5,
    kind: "experiment",
    title: "Combustion Module on the Shuttle",
    what: "STS-83 and STS-94 in 1997, and STS-107 in 2003, carried a combustion laboratory. It studied soot in laminar flames (LSP) and flame balls (SOFBALL), and on its last flight tested water mist against fire.",
    lesson:
      "Flame balls, predicted by theory but thought to be only a mathematical exercise, burned for over 40 minutes: the weakest flames ever burned. After years of water-mist research, the first two water-mist extinguishers were sent to the station in December 2015.",
    factors: ["gravity", "smoke", "suppression"],
    sources: [guide("pp. 13, 25, 26, 30")],
  },
  {
    id: "same",
    when: "2007 and 2010",
    order: 2007,
    kind: "experiment",
    title: "SAME and SAME-R",
    what: "In the Microgravity Science Glovebox, crews overheated Teflon, Kapton, silicone rubber and cellulose and measured the smoke particles each one gave off.",
    lesson:
      "A substantial part of the smoke's mass is in particles larger than one micron, and the useful warning comes from materials overheating, before there is a flame. Future detectors will be evaluated against this data.",
    factors: ["smoke"],
    sources: [SAME, SAME13],
  },
  {
    id: "cir-flex",
    when: "2008",
    order: 2008,
    kind: "experiment",
    title: "Combustion Integrated Rack and FLEX",
    what: "In November 2008, STS-126 delivered the only rack on the station dedicated to combustion, with a 100-litre chamber. In it, FLEX burned droplets of methanol and heptane while carbon dioxide or helium diluted the atmosphere.",
    lesson:
      "The flammability limit is lower in reduced gravity, so standards for inert-gas suppressants written on Earth do not offer the same margin of safety in low gravity.",
    factors: ["suppression", "oxygen", "pressure"],
    sources: [GLENN, FLEX, guide("pp. 12, 43, 44")],
  },
  {
    id: "cool-flames",
    when: "2012",
    order: 2012,
    kind: "experiment",
    title: "Cool flames",
    what: "During FLEX, heptane droplets kept burning after their visible flame had gone out.",
    lesson:
      "A fire that looks extinguished may not be. Cool flames are nearly impossible to create in Earth's gravity and form readily in free fall.",
    factors: ["gravity", "suppression"],
    sources: [COOL, guide("pp. 33, 34, 36, 41, 42")],
  },
  {
    id: "bass",
    when: "2012",
    order: 2012.5,
    kind: "experiment",
    title: "BASS and BASS-II",
    what: "From March 2012, fabrics, plastics and candles were burned in a small flow duct inside the glovebox, with air moving at 5 to 50 cm/s and nitrogen added until the flame went out.",
    lesson:
      "Results indicate that the 1 g test used to screen spacecraft materials is not conservative: materials can burn at lower oxygen levels in microgravity than on Earth. A local jet of suppressant pulled in air and kept the flame alive, even with the airflow off.",
    factors: ["airflow", "oxygen", "gravity", "suppression"],
    sources: [BASS, guide("pp. 19, 31")],
  },
  {
    id: "saffire",
    when: "From 2016",
    order: 2016,
    kind: "experiment",
    title: "Saffire I to VI",
    what: "Six experiments lit fires inside Cygnus cargo ships after they left the station. Until then, the largest fire experiment in space was about the size of an index card. Saffire-I, completed in July 2016, burned a sheet 0.4 m by 1 m.",
    lesson:
      "How a fire grows at the scale of a real spacecraft. Later flights repeated the burns at the pressures and oxygen levels expected in exploration vehicles. In the last flight, carbon dioxide and carbon monoxide rose more significantly than temperature or pressure.",
    factors: ["oxygen", "pressure", "smoke"],
    sources: [SAFFIRE, SAFFIRE6],
  },
  {
    id: "cfi-g",
    when: "2021",
    order: 2021,
    kind: "experiment",
    title: "Cool flames in gases (CFI-G)",
    what: "In June 2021, spherical cool flames were seen burning gaseous fuel for the first time. These tests used the highest oxygen levels in PSI: up to 85 % oxygen flowing from a spherical burner.",
    lesson:
      "Cool flames are not limited to liquid fuel. The 2012 flames burned droplets; these burned gas.",
    factors: ["gravity", "oxygen"],
    sources: [COOL, BRIEF],
  },
  {
    id: "sofie",
    when: "From 2023",
    order: 2023,
    kind: "experiment",
    title: "SoFIE",
    what: "Five investigations in the Combustion Integrated Rack burn flat, cylindrical and spherical solid samples. One of them varies oxygen from atmospheric levels up to 85 %. The first test burned an acrylic sphere on 13 January 2023.",
    lesson:
      "It compares how materials burn in ventilated microgravity with the 1 g test used to screen them, which some researchers believe is not conservative in low gravity.",
    factors: ["oxygen", "airflow", "gravity"],
    sources: [SOFIE, SOFIEGEL, guide("p. 22")],
  },
  {
    id: "artemis-2",
    when: "2026",
    order: 2026,
    kind: "incident",
    title: "Artemis II",
    what: "A smoke alarm sounded aboard the spacecraft about 80,000 miles from home.",
    lesson:
      "Beyond low Earth orbit a crew cannot come home quickly. Detection and response have to work where they are.",
    factors: ["smoke"],
    sources: [BRIEF, SAFFIRE],
  },
  {
    id: "fm2",
    when: "Next",
    // After every dated milestone; FM2 has no published date.
    order: 9999,
    kind: "next",
    title: "FM2, fire on the Moon",
    what: "The first combustion experiment on another planetary body will burn four samples, one at a time, in a sealed chamber at one-sixth gravity, in the atmosphere planned for lunar habitats.",
    lesson:
      "Models, parabolic flights and station experiments suggest that materials may burn at lower oxygen levels in lunar gravity than on Earth. Nobody has measured it there yet.",
    factors: ["gravity", "oxygen"],
    sources: [FM2],
  },
];

/** The heading over a milestone's lesson. */
export function lessonHeading(kind: MilestoneKind): string {
  switch (kind) {
    case "incident":
      return "What it changed";
    case "facility":
    case "experiment":
      return "What it taught";
    case "next":
      return "What it will answer";
  }
}

/** The milestones that involve a factor, or all of them when there is none. */
export function milestonesFor(factor?: Factor | null): readonly Milestone[] {
  if (!factor) return MILESTONES;
  return MILESTONES.filter((m) => m.factors.includes(factor));
}

export const FACTORS: Record<Factor, FactorInfo> = {
  gravity: {
    label: "Gravity",
    text: "Without buoyancy, hot gas does not rise, and the flow that shapes and feeds a flame on Earth is gone. Materials ignite more easily, and weak, cool flames become possible.",
    sources: [GLENN, guide("pp. 18, 41, 42")],
  },
  oxygen: {
    label: "Oxygen",
    text: "In low-speed flow, some materials are flammable at lower oxygen concentrations than in normal gravity. The Moon Base is expected to run at 30 % oxygen or more.",
    sources: [guide("p. 18"), BRIEF],
  },
  pressure: {
    label: "Pressure",
    text: "FLEX and the later Saffire flights varied pressure, and venting a cabin to space is one strategy for putting out a fire. When Skylab vented its test chamber, the flames first grew stronger. The sources read give no general rule for it.",
    sources: [FLEX, SAFFIRE, FSBIB],
  },
  airflow: {
    label: "Airflow",
    text: "Ventilation strongly enhances flames. At low speeds a flame can spread upstream, into the airflow. Over solids, the lowest oxygen level that keeps a flame spreading comes at about 10 cm/s, typical of spacecraft ventilation.",
    sources: [guide("pp. 18, 31")],
  },
  smoke: {
    label: "Smoke",
    text: "Smoke in microgravity carries much of its mass in particles larger than a micron, and overheating materials give the earliest warning.",
    sources: [SAME],
  },
  suppression: {
    label: "Suppression",
    text: "The flammability limit is lower in reduced gravity. A local jet of nitrogen can pull air in and keep a flame alive, so where the suppressant is applied matters.",
    sources: [guide("pp. 12, 22, 31")],
  },
};

const NO_PSI_DATA = "No data in PSI yet";

/** From free fall to Earth. */
export const GRAVITY_LEVELS: readonly GravityLevel[] = [
  {
    place: "ISS, free fall",
    gravity: "about 0 g",
    data: "Combustion data in PSI",
    hasPsiData: true,
  },
  { place: "Moon", gravity: "1/6 g", data: NO_PSI_DATA, hasPsiData: false },
  { place: "Mars", gravity: "3/8 g", data: NO_PSI_DATA, hasPsiData: false },
  {
    place: "Earth",
    gravity: "1 g",
    data: "Combustion data in PSI, from the ground program",
    hasPsiData: true,
  },
];

export const GRAVITY_NOTE: { text: string; sources: readonly Source[] } = {
  text: "Until FM2 and LUCI return data, microgravity and normal-gravity results can bound what happens between them.",
  sources: [BRIEF, FM2],
};

// Combustion in Reduced Gravity, p. 35, lists these as "critical misconceptions about potential fires in
// spacecraft"; the evidence against each is on the pages cited.
export const ASSUMPTIONS: readonly Assumption[] = [
  {
    wording: "A steady fire cannot exist in a quiescent microgravity environment.",
    answer:
      "On Mir, a candle flame in still air burned for as long as 45 minutes before it ran out of fuel.",
    sources: [CANDLE, guide("pp. 30, 35")],
  },
  {
    wording: "A fire will self-extinguish if ventilation is shut off.",
    answer:
      "In BASS, a local jet of suppressant pulled in air and kept the flame alive with the airflow turned off.",
    sources: [guide("pp. 31, 35")],
  },
  {
    wording:
      "Because the reduced-gravity environment is inherently safer, terrestrial fire standards and tests represent a very conservative approach to fire safety.",
    answer:
      "BASS results indicate that the 1 g material test is not conservative. FLEX showed a lower flammability limit in reduced gravity, so suppressant standards written on Earth do not offer the same margin there.",
    sources: [guide("pp. 12, 31, 35")],
  },
];

export const KIND_LABEL: Record<MilestoneKind, string> = {
  incident: "Incident",
  facility: "Facility",
  experiment: "Experiment",
  next: "Next",
};

export interface Panel {
  title: string;
  sentences: readonly string[];
  sources: readonly Source[];
}

/** Why a flame changes: the same flame on Earth and in free fall. */
export const PANELS: { earth: Panel; freeFall: Panel } = {
  earth: {
    title: "On Earth",
    sentences: [
      "Hot gas is lighter than the air around it and rises.",
      "That flow makes a flame lift and point upward, and its instabilities cause the flicker typical of flames on Earth.",
    ],
    sources: [GLENN],
  },
  freeFall: {
    title: "In free fall",
    sentences: [
      "In the absence of gravity, buoyancy can be suppressed.",
      "A candle flame becomes a faint blue sphere that gets its oxygen by diffusion.",
    ],
    sources: [GLENN, BRIEF],
  },
};

/** The page's own words: headings, labels and the lead. */
export const PAGE = {
  title: "Fire behaves differently when nothing falls.",
  lead: "Without gravity, hot gas does not rise, and the flow that shapes and feeds a flame on Earth is gone. This page follows how NASA learned what that means, one incident and one experiment at a time.",
  why: "Why a flame changes",
  diagram: "Diagram",
  milestones: "Milestones",
  filter: "Filter by factor",
  allFactors: "All",
  sources: "Sources",
  newTab: "opens in a new tab",
  assumptions: "Assumptions the research overturned",
  assumed: "Assumed",
  found: "Found",
  unknown: "What is still unknown",
  next: "Where to go next",
  openLab: "Open the flame lab",
  browseLibrary: "Browse the library",
} as const;
