import { describe, expect, it } from "vite-plus/test";
import type { Citation } from "../api/types";
import { citationHref, formatCitation } from "./citation";

const full: Citation = {
  doc_title: "Modeling and Analysis of Intermediate Thickness PMMA Sheets",
  doc_authors: "TJ Shah, FJ Miller, S Olson, I Wichman",
  year: 2015,
  page: 7,
  acronym: "BASS-II",
  accession: "PSI-25",
  psi_folder: "Raw Data",
  investigation_url: "https://psi.nasa.gov/physci/repo/data/investigations/PSI-25",
  public_url: null,
};

describe("formatCitation", () => {
  it("writes the decided format when every field is there", () => {
    expect(formatCitation(full)).toBe(
      'TJ Shah, FJ Miller, S Olson, I Wichman (2015), "Modeling and Analysis of Intermediate Thickness PMMA Sheets", p. 7. BASS-II (PSI-25), folder Raw Data.',
    );
  });

  it("keeps the authors exactly as given", () => {
    expect(formatCitation({ doc_title: "T", doc_authors: "Olson et al." })).toBe(
      'Olson et al., "T".',
    );
  });

  it("skips what is missing", () => {
    expect(formatCitation({ doc_title: "Flame Extinguishment Experiment" })).toBe(
      '"Flame Extinguishment Experiment".',
    );
    expect(formatCitation({ ...full, doc_authors: null, page: undefined, psi_folder: null })).toBe(
      '(2015), "Modeling and Analysis of Intermediate Thickness PMMA Sheets". BASS-II (PSI-25).',
    );
    expect(formatCitation({ doc_title: "T", accession: "PSI-69" })).toBe('"T". PSI-69.');
    expect(formatCitation({ doc_title: "T", acronym: "FLEX", psi_folder: "Reports" })).toBe(
      '"T". FLEX, folder Reports.',
    );
  });

  it("treats blank strings as missing", () => {
    expect(
      formatCitation({ doc_title: "T", doc_authors: "  ", acronym: "", accession: "PSI-1" }),
    ).toBe('"T". PSI-1.');
  });

  it("does not repeat a name that is both acronym and accession", () => {
    expect(formatCitation({ doc_title: "T", acronym: "PSI-62", accession: "PSI-62" })).toBe(
      '"T". PSI-62.',
    );
  });

  it("formats a non-PSI resource", () => {
    expect(
      formatCitation({
        doc_title: "Combustion in Reduced Gravity",
        doc_authors: "Gokoglu, Dietrich, Stocker, Ferkul, Olson and Hicks",
        year: 2015,
        acronym: "NASA mini-book",
      }),
    ).toBe(
      'Gokoglu, Dietrich, Stocker, Ferkul, Olson and Hicks (2015), "Combustion in Reduced Gravity". NASA mini-book.',
    );
  });
});

describe("citationHref", () => {
  const psi = "https://psi.nasa.gov/physci/repo/data/investigations/PSI-25";
  const nasa = "https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/";

  it("prefers the PSI investigation page", () => {
    expect(citationHref({ doc_title: "T", investigation_url: psi, public_url: nasa })).toBe(psi);
  });

  it("falls back to the public page", () => {
    expect(citationHref({ doc_title: "T", investigation_url: null, public_url: nasa })).toBe(nasa);
    expect(citationHref({ doc_title: "T", investigation_url: "", public_url: nasa })).toBe(nasa);
  });

  it("is undefined when there is no page to link", () => {
    expect(citationHref({ doc_title: "T" })).toBeUndefined();
    expect(
      citationHref({ doc_title: "T", investigation_url: null, public_url: null }),
    ).toBeUndefined();
  });

  it("never links anything that is not a web page", () => {
    expect(
      citationHref({ doc_title: "T", investigation_url: "javascript:alert(1)" }),
    ).toBeUndefined();
    expect(
      citationHref({ doc_title: "T", investigation_url: "/files/report.pdf" }),
    ).toBeUndefined();
    expect(
      citationHref({ doc_title: "T", investigation_url: "javascript:alert(1)", public_url: nasa }),
    ).toBe(nasa);
  });
});
