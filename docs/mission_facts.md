# Mission page: verified facts

Research notes for the Mission page, gathered on 2026-11-15 from official NASA pages and from the challenge
brief, then checked against each source the same day (see **Verification log**). This is the **only** source of
facts for the page. If something is not here, it does not go on the page until it is checked against a NASA
source and added here with its link. `src/mission/milestones.ts` carries this copy as typed data.

Each fact carries its source. "Guide" is NASA's _Combustion in Reduced Gravity_ (A Researcher's Guide to
Combustion Science, NP-2015-10-034-JSC), with page numbers; the printed page numbers match the PDF pages. Items
under **Not verified** were not confirmed by the pages read: leave them out.

## Sources

| Key        | Document                                                                               | URL                                                                                                                                                  |
| ---------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| GLENN      | Combustion Science, NASA Glenn                                                         | https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/                                           |
| GUIDE      | Combustion in Reduced Gravity (PDF)                                                    | https://www.nasa.gov/wp-content/uploads/2016/05/np-2015-10-034-jsc_combustion_in_reduced_gravity-iss-mini-book-011116-508.pdf                        |
| APOLLO1    | Apollo 1, NASA Safety and Mission Assurance                                            | https://sma.nasa.gov/sma-disciplines/accllp/apollo-1                                                                                                 |
| APOLLO1P   | 55 Years Ago: The Apollo 1 Fire and its Aftermath                                      | https://www.nasa.gov/history/55-years-ago-the-apollo-1-fire-and-its-aftermath/                                                                       |
| APOLLO1MIX | 50th anniversary of NASA deciding on a mixed-gas atmosphere for Apollo                 | https://www.nasa.gov/history/50th-anniversary-of-nasa-deciding-on-a-mixed-gas-atmosphere-for-apollo-a-direct-result-of-the-apollo-fire/              |
| APOLLO13   | Apollo 13, NASA Safety and Mission Assurance                                           | https://sma.nasa.gov/sma-disciplines/accllp/apollo-13                                                                                                |
| APOLLO13M  | Apollo 13: Mission Details                                                             | https://www.nasa.gov/missions/apollo/apollo-13-mission-details/                                                                                      |
| SKYLAB     | Zero Gravity Flammability (Skylab M479), NSSDCA                                        | https://nssdc.gsfc.nasa.gov/nmc/experiment/display.action?id=1973-027A-34                                                                            |
| FSBIB      | Spacecraft Fire Safety 1956 to 1999: An Annotated Bibliography (NASA/TP-2013-211209)   | https://ntrs.nasa.gov/citations/20130014735                                                                                                          |
| MIR        | 25 Years Ago: Fire Aboard Space Station Mir                                            | https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/                                                                             |
| ZEROG      | Zero Gravity Facility 1966                                                             | https://www.nasa.gov/image-article/zero-gravity-facility-1966                                                                                        |
| CANDLE     | Candle Flames in Non-Buoyant Atmospheres (NTRS, 1999)                                  | https://ntrs.nasa.gov/citations/20000005087                                                                                                          |
| CANDLE97   | Candle Flames in Microgravity (NTRS, 1997)                                             | https://ntrs.nasa.gov/citations/19970020585                                                                                                          |
| SAME       | SAME fact sheet (PDF)                                                                  | https://www.nasa.gov/wp-content/uploads/2025/07/smoke-aerosol-measurement-experiment-same.pdf                                                        |
| SAME13     | Evaluation of Low-Gravity Smoke Particulate for Spacecraft Fire Detection (NTRS, 2013) | https://ntrs.nasa.gov/citations/20140006579                                                                                                          |
| FLEX       | FLEX fact sheet (PDF)                                                                  | https://www.nasa.gov/wp-content/uploads/2025/07/flame-extinguishment-experiment-flex.pdf                                                             |
| COOL       | Cool Flames Created During a First for ISS Research (2021)                             | https://www.nasa.gov/?p=73963                                                                                                                        |
| BASS       | BASS fact sheet (PDF)                                                                  | https://www.nasa.gov/wp-content/uploads/2025/07/burning-and-suppression-of-solids-bass.pdf                                                           |
| SAFFIRE    | Saffire fact sheet (PDF)                                                               | https://www.nasa.gov/wp-content/uploads/2025/07/spacecraft-fire-safety-demonstration-saffire.pdf                                                     |
| SAFFIRE6   | Preliminary Results from the Saffire VI Experiment (NTRS, 2024)                        | https://ntrs.nasa.gov/citations/20240002981                                                                                                          |
| SOFIE      | Solid Fuel Ignition and Extinction, NASA Glenn                                         | https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/solid-fuel-ignition-and-extinction-sofie/  |
| SOFIEGEL   | jsc2023e002281, SoFIE GEL first test (NASA Image Library)                              | https://images.nasa.gov/details/jsc2023e002281                                                                                                       |
| SOFIESCI   | Solid Fuel Ignition and Extinction (SoFIE), NASA Science                               | https://science.nasa.gov/biological-physical/investigations/sofie/                                                                                   |
| FM2        | Flammability of Materials on the Moon, NASA Glenn                                      | https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/flammability-of-materials-on-the-moon-fm2/ |
| BRIEF      | NASA Space Apps 2026 challenge brief, "Flame in Freefall"                              | (no public URL recorded; cite it by name)                                                                                                            |

## Why a flame changes without gravity

- On Earth, hot gas is lighter than the air around it and rises. That flow makes a flame lift and point upward,
  and its instabilities cause the flicker typical of flames on Earth. (GLENN)
- "In the absence of gravity, buoyancy can be suppressed." (GLENN)
- In free fall a candle flame becomes a faint blue sphere that gets its oxygen by diffusion. (BRIEF)
- Materials are easier to ignite in low gravity, because less heat is carried away from the fuel surface by
  natural convection. (GUIDE p. 18)

## Milestones

Copy is ready to use. `kind` is one of incident, facility, experiment, next. `factors` are from: gravity, oxygen,
pressure, airflow, smoke, suppression.

### 1966 · Zero Gravity Facility · facility

- **What:** At NASA's Lewis Research Center, now Glenn, experiments fell 460 feet for 5.18 seconds of free fall.
  (ZEROG)
- **What it taught:** A few seconds at a time, drop towers and aircraft carried most of the research on flames
  without buoyancy. The most promising experiments were then chosen to fly in space. (GUIDE p. 30; pp. 17, 27
  name the 2.2-second drop tower and the 5.2-second Zero Gravity Facility as combustion facilities.)
- **Factors:** gravity
- **Note:** the source is a photograph dated 1966. Do not write that the facility opened that year.

### 1967 · Apollo 1 · incident

- **What:** On 27 January 1967 a flash fire swept through the command module during a test on the launch pad.
  The cabin was pressurised with 100 % oxygen at 16.7 psi, and there was no time to open the hatches. Grissom,
  White and Chaffee died. (APOLLO1; APOLLO1P)
- **What it changed:** NASA restricted and controlled combustible materials in the spacecraft, moved to
  fire-resistant suits, and fitted a hatch that opens in three seconds. On the launch pad, the cabin now held
  60 % oxygen and 40 % nitrogen. (APOLLO1; APOLLO1MIX)
- **Factors:** oxygen, pressure

### 1970 · Apollo 13 · incident

- **What:** On 13 April 1970, the third day of the flight to the Moon, oxygen tank two exploded. In a ground
  test its heaters had been left on for hours, which damaged the Teflon insulation inside it. The crew used the
  lunar module as a lifeboat and splashed down on 17 April. (APOLLO13; APOLLO13M)
- **What it changed:** NASA reviewed every Apollo system that uses cryogenic oxygen. Later flights carried a
  third oxygen tank in a different bay, upgraded thermostats and wiring sheathed in stainless steel. (APOLLO13)
- **Factors:** oxygen

### 1970s · Skylab M479 · experiment

- **What:** Skylab astronauts burned aluminized Mylar, nylon, polyurethane foam, Teflon, paper and other
  materials in a chamber at 5.2 psia and 65 % oxygen. Each test lasted between 10 seconds and four minutes.
  (SKYLAB; FSBIB ref. 87)
- **What it taught:** Materials burned more slowly than in 1 g: Mylar at about half the rate, foam at 15 %.
  Venting the chamber was tried to put the flames out, and they grew stronger before going out. (FSBIB ref. 87)
- **Factors:** gravity, oxygen, pressure, suppression
- **Note:** the sources give no year for the tests. SKYLAB files the experiment under Skylab (NSSDCA
  1973-027A) and the results were published in 1974, so the label stays "1970s".

### From 1992 · Candle flames on the Shuttle and Mir · experiment

- **What:** Candles were lit in orbit. On the Shuttle in 1992 the flames turned dim blue and lasted less than
  60 seconds, because the safety box around them limited the oxygen reaching the flame. On Mir, in a redesigned
  box, they burned for as long as 45 minutes. (CANDLE)
- **What it taught:** A flame can keep burning in still air with no buoyancy to feed it, and at a lower oxygen
  level than the same candle on Earth. (CANDLE; GUIDE p. 30)
- **Factors:** gravity, oxygen
- **Note:** the CANDLE paper dates the Shuttle flight to STS-50 (USML-1) in 1992 and the Mir flight to 1995.
  These notes had believed 1996 for Mir, and CANDLE97 says Shannon Lucid ran it without giving a year. Until a
  second NASA source settles it, the Mir year stays off the page.

### 1997 · Fire aboard Mir · incident

- **What:** On 24 February 1997 a solid-fuel oxygen generator ignited in the Kvant-1 module. The flame reached
  about three feet, burned for several minutes and blocked the way to one of the Soyuz escape craft. Six
  people were aboard. (MIR)
- **What it changed:** The flame went out on its own, but the smoke took the life support system hours to
  clear. Emergency training, ground support and the preparation of the generators changed, and the lessons
  went into the design and operation of the International Space Station. (MIR)
- **Factors:** oxygen, smoke, suppression

### 1997 to 2003 · Combustion Module on the Shuttle · experiment

- **What:** STS-83 and STS-94 in 1997, and STS-107 in 2003, carried a combustion laboratory. It studied soot in
  laminar flames (LSP) and flame balls (SOFBALL), and on its last flight tested water mist against fire.
  (GUIDE pp. 13, 25, 26)
- **What it taught:** Flame balls, predicted by theory but thought to be only a mathematical exercise, burned
  for over 40 minutes: the weakest flames ever burned. After years of water-mist research, the first two
  water-mist extinguishers were sent to the station in December 2015. (GUIDE pp. 26, 30)
- **Factors:** gravity, smoke, suppression

### 2007 and 2010 · SAME and SAME-R · experiment

- **What:** In the Microgravity Science Glovebox, crews overheated Teflon, Kapton, silicone rubber and
  cellulose and measured the smoke particles each one gave off. (SAME; years from SAME13)
- **What it taught:** A substantial part of the smoke's mass is in particles larger than one micron, and the
  useful warning comes from materials overheating, before there is a flame. Future detectors will be
  evaluated against this data. (SAME)
- **Factors:** smoke

### 2008 · Combustion Integrated Rack and FLEX · experiment

- **What:** In November 2008, STS-126 delivered the only rack on the station dedicated to combustion, with a
  100-litre chamber. In it, FLEX burned droplets of methanol and heptane while carbon dioxide or helium diluted
  the atmosphere. (GLENN; FLEX; GUIDE pp. 43-44)
- **What it taught:** The flammability limit is lower in reduced gravity, so standards for inert-gas
  suppressants written on Earth do not offer the same margin of safety in low gravity. (GUIDE p. 12)
- **Factors:** suppression, oxygen, pressure

### 2012 · Cool flames · experiment

- **What:** During FLEX, heptane droplets kept burning after their visible flame had gone out. (COOL; GUIDE
  pp. 33-34, 36)
- **What it taught:** A fire that looks extinguished may not be. Cool flames are nearly impossible to create in
  Earth's gravity and form readily in free fall. (COOL; GUIDE pp. 41-42)
- **Factors:** gravity, suppression

### 2012 · BASS and BASS-II · experiment

- **What:** From March 2012, fabrics, plastics and candles were burned in a small flow duct inside the
  glovebox, with air moving at 5 to 50 cm/s and nitrogen added until the flame went out. (BASS; GUIDE p. 19)
- **What it taught:** Results indicate that the 1 g test used to screen spacecraft materials is not
  conservative: materials can burn at lower oxygen levels in microgravity than on Earth. A local jet of
  suppressant pulled in air and kept the flame alive, even with the airflow off. (GUIDE p. 31)
- **Factors:** airflow, oxygen, gravity, suppression

### From 2016 · Saffire I to VI · experiment

- **What:** Six experiments lit fires inside Cygnus cargo ships after they left the station. Until then, the
  largest fire experiment in space was about the size of an index card. Saffire-I, completed in July 2016,
  burned a sheet 0.4 m by 1 m. (SAFFIRE)
- **What it taught:** How a fire grows at the scale of a real spacecraft. Later flights repeated the burns at
  the pressures and oxygen levels expected in exploration vehicles. In the last flight, carbon dioxide and
  carbon monoxide rose more significantly than temperature or pressure. (SAFFIRE; SAFFIRE6)
- **Factors:** oxygen, pressure, smoke

### 2021 · Cool flames in gases (CFI-G) · experiment

- **What:** In June 2021, spherical cool flames were seen burning gaseous fuel for the first time. (COOL) These
  tests used the highest oxygen levels in PSI: up to 85 % oxygen flowing from a spherical burner. (BRIEF)
- **What it taught:** Cool flames are not limited to liquid fuel. The 2012 flames burned droplets; these burned
  gas. (COOL)
- **Factors:** gravity, oxygen

### From 2023 · SoFIE · experiment

- **What:** Five investigations in the Combustion Integrated Rack burn flat, cylindrical and spherical solid
  samples. One of them varies oxygen from atmospheric levels up to 85 %. The first test burned an acrylic
  sphere on 13 January 2023. (SOFIE; SOFIEGEL)
- **What it taught:** It compares how materials burn in ventilated microgravity with the 1 g test used to
  screen them, which some researchers believe is not conservative in low gravity. (SOFIE; GUIDE p. 22)
- **Factors:** oxygen, airflow, gravity
- **Note:** SOFIESCI says SoFIE operates "through February 2025"; a 2022 NASA feature says "until November
  2025". Neither supports "Now" in November 2026, so the label is the first test.

### 2026 · Artemis II · incident

- **What:** A smoke alarm sounded aboard the spacecraft about 80,000 miles from home. (BRIEF)
- **What it changed:** Beyond low Earth orbit a crew cannot come home quickly. Detection and response have to
  work where they are. (SAFFIRE states the same need for emergencies where astronauts cannot quickly return.)
- **Factors:** smoke

### Next · FM2, fire on the Moon · next

- **What:** The first combustion experiment on another planetary body will burn four samples, one at a time,
  in a sealed chamber at one-sixth gravity, in the atmosphere planned for lunar habitats. (FM2)
- **What it will answer:** Models, parabolic flights and station experiments suggest that materials may burn at
  lower oxygen levels in lunar gravity than on Earth. Nobody has measured it there yet. (FM2)
- **Factors:** gravity, oxygen

## What is known about each factor

One short paragraph per factor, shown when that factor is selected.

- **Gravity.** Without buoyancy, hot gas does not rise, and the flow that shapes and feeds a flame on Earth is
  gone. Materials ignite more easily, and weak, cool flames become possible. (GLENN; GUIDE pp. 18, 41-42)
- **Oxygen.** In low-speed flow, some materials are flammable at lower oxygen concentrations than in normal
  gravity. The Moon Base is expected to run at 30 % oxygen or more. (GUIDE p. 18; BRIEF)
- **Pressure.** FLEX and the later Saffire flights varied pressure, and venting a cabin to space is one strategy
  for putting out a fire. When Skylab vented its test chamber, the flames first grew stronger. The sources
  read give no general rule for it. (FLEX; SAFFIRE; FSBIB ref. 87)
- **Airflow.** Ventilation strongly enhances flames. At low speeds a flame can spread upstream, into the
  airflow. Over solids, the lowest oxygen level that keeps a flame spreading comes at about 10 cm/s, typical of
  spacecraft ventilation. (GUIDE pp. 18, 31)
- **Smoke.** Smoke in microgravity carries much of its mass in particles larger than a micron, and overheating
  materials give the earliest warning. (SAME)
- **Suppression.** The flammability limit is lower in reduced gravity. A local jet of nitrogen can pull air in
  and keep a flame alive, so where the suppressant is applied matters. (GUIDE pp. 12, 22, 31)

## Gravity levels and the data behind them

| Place          | Gravity   | Combustion data in PSI              |
| -------------- | --------- | ----------------------------------- |
| ISS, free fall | about 0 g | Yes                                 |
| Moon           | 1/6 g     | None yet (FM2 and LUCI are planned) |
| Mars           | 3/8 g     | None yet                            |
| Earth          | 1 g       | Yes, the ground program             |

Microgravity and normal-gravity results can bound what happens between them. (BRIEF)

Page copy for the scale: the marks read "Combustion data in PSI" (free fall), "No data in PSI yet" (Moon,
Mars) and "Combustion data in PSI, from the ground program" (Earth). The sentence under it: "Until FM2 and
LUCI return data, microgravity and normal-gravity results can bound what happens between them." (BRIEF; FM2)

## Page copy

The page's own sentences, all taken from the facts above. Labels and headings are in `PAGE` in
`src/mission/milestones.ts`.

- **Lead:** "Without gravity, hot gas does not rise, and the flow that shapes and feeds a flame on Earth is
  gone. This page follows how NASA learned what that means, one incident and one experiment at a time." The
  first sentence is the Gravity factor paragraph (GLENN); the second describes the page.
- **On Earth:** "Hot gas is lighter than the air around it and rises. That flow makes a flame lift and point
  upward, and its instabilities cause the flicker typical of flames on Earth." (GLENN)
- **In free fall:** "In the absence of gravity, buoyancy can be suppressed. A candle flame becomes a faint blue
  sphere that gets its oxygen by diffusion." (GLENN; BRIEF)

## Assumptions the research overturned

GUIDE p. 35, word for word: "Although NASA has been vigilant in its approach to accidental fires, the approach
to fire safety aboard spacecraft was dominated by a general lack of knowledge about how fire behaves in
microgravity. This resulted in several critical misconceptions about potential fires in spacecraft:

1. A steady fire cannot exist in a quiescent microgravity environment.
2. A fire will self-extinguish if ventilation is shut off.
3. Because the reduced-gravity environment is inherently safer, terrestrial fire standards and tests represent
   a very conservative approach to fire safety."

The guide's explanation, same page: research "in both ground-based laboratories and microgravity facilities and
space-based microgravity experiments (summarized by Friedman and Ross, 2001 and Ruff et al., 2009) demonstrates
the fallacy of these assumptions". Page 35 does not answer each one separately. The evidence for each is
elsewhere in the guide:

1. GUIDE p. 30: "Contrary to published speculation, the microgravity flame burned in some tests for over 45
   minutes before extinguishing from a lack of fuel."
2. GUIDE p. 31: "The local jet entrains air and sustains the flame even when the ambient airflow is turned off."
3. GUIDE p. 31: "Recent results from the BASS experiment currently running on the ISS indicate that
   NASA-STD-6001 Test 1 is not conservative, and materials can burn at lower oxygen levels in microgravity than
   on Earth." Also p. 12: "terrestrial standards for inert gas suppressants in low gravity do not offer the same
   margin of safety as in normal gravity."

Page copy for the three answers, from the evidence above:

1. On Mir, a candle flame in still air burned for as long as 45 minutes before it ran out of fuel. (CANDLE;
   GUIDE p. 30. The guide says "over 45 minutes" and CANDLE "as long as 45 minutes"; the page uses CANDLE's
   wording so that it matches the candle milestone.)
2. In BASS, a local jet of suppressant pulled in air and kept the flame alive with the airflow turned off.
   (GUIDE p. 31)
3. BASS results indicate that the 1 g material test is not conservative. FLEX showed a lower flammability limit
   in reduced gravity, so suppressant standards written on Earth do not offer the same margin there. (GUIDE
   pp. 12, 31)

## Not verified: leave out

- The year of the Mir candle flight: CANDLE says 1995, these notes had believed 1996 (see the milestone note).
- The end date of Saffire-VI. SAFFIRE6 gives only its conference date (July 2024).
- The cool-flame temperature range. COOL says only "extremely low temperatures".
- The Artemis II smoke alarm on a NASA page: a search of nasa.gov found no report of it. It stays on the page
  only because the challenge brief states it.

## Verification log (2026-11-15)

Each milestone was checked against its source. Results:

- **1966 Zero Gravity Facility.** Corrected: the source names it "Zero Gravity Facility", not "Zero Gravity
  Research Facility"; "down a shaft" is not in the source and was removed; "first look at flames without
  buoyancy, before any flame was lit in orbit" is not in the guide and was replaced with GUIDE p. 30.
- **1967 Apollo 1.** Confirmed. Added from the Not verified list: 16.7 psi (APOLLO1P) and the 60 % oxygen,
  40 % nitrogen launch-pad atmosphere (APOLLO1MIX). Wording now follows APOLLO1: "no time to open the hatches".
- **1970 Apollo 13.** Corrected: the crew used the lunar module as a lifeboat and splashed down in the command
  module, not "came home in the lunar module"; the damage was to the tank's Teflon insulation, from heaters
  left on in a launch-pad test, not to "wiring insulation"; the review covered systems that use cryogenic
  oxygen. Added from the Not verified list: 13 April 1970 (APOLLO13M).
- **1970s Skylab M479.** New, from the Not verified list, confirmed by SKYLAB and FSBIB.
- **From 1992 Candle flames.** Corrected: CANDLE gives "dim blue" for the Shuttle flames, not the Mir ones.
  Added: 1992 for the Shuttle flight. The Mir year conflicts (see the note).
- **1997 Mir.** Confirmed.
- **1997 to 2003 Combustion Module.** Confirmed what; corrected lesson: "soot and suppression could be measured
  without buoyancy disturbing the flame" is not in the guide; the extinguishers were "sent to", not "reached",
  the station.
- **2007 and 2010 SAME.** Confirmed; the SAME fact sheet gives only Expedition 15, so the 2007 date is from
  SAME13. "Smoke detectors are judged against that" now follows the fact sheet's wording.
- **2008 CIR and FLEX.** Corrected: GUIDE p. 12 says the standards "do not offer" the same margin, not "may not
  give".
- **2012 Cool flames.** Confirmed (2012 from COOL). Added "heptane" (GUIDE p. 36).
- **2012 BASS.** Corrected: upstream flame spread is not attributed to BASS in the guide (its figure comes from
  another experiment) and moved to the Airflow paragraph only; the BASS lesson now uses GUIDE p. 31 ("indicate").
- **From 2016 Saffire.** Corrected: "about the size of an index card".
- **2021 CFI-G.** Confirmed. The lesson now follows COOL's contrast between liquid and gaseous fuel.
- **From 2023 SoFIE.** Corrected: label was "Now"; first test 13 January 2023 (SOFIEGEL). Sample shapes follow
  SOFIE (flat, cylindrical, spherical); the lesson follows SOFIE and GUIDE p. 22.
- **2026 Artemis II.** Could not open: the brief has no public URL, and nasa.gov has no report of the alarm.
- **Next FM2.** Confirmed.
- **Factors.** Pressure: the FLEX fact sheet's "0.5 to 1.0 atm" is the planned range, but the PSI-69 table
  the Flame Lab uses runs from 526 to 2320 mmHg (about 0.69 to 3.05 atm, `ARCHITECTURE.md` §4), so the range
  was removed. Airflow: the 10 cm/s minimum is where the oxygen limit is lowest, not "a limit at a speed".
