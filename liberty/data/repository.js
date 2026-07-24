/**
 * Liberty's civic data repository.
 *
 * This is REAL data, manually researched and cited (see `sourceUrl` on every
 * entry) — not placeholder text. There is no live backend, so it is a
 * snapshot as of `LIBERTY_REPOSITORY.updated` and will go stale; treat it as
 * a seed, not a feed.
 *
 * How this grows over time:
 *   Liberty is organized as a repository keyed by jurisdiction so new
 *   regions can be researched and dropped in without touching app code:
 *     - `federal`        — one national entry, always shown to everyone
 *     - `states.<ABBR>`  — one entry per state, keyed by USPS abbreviation
 *     - `locals.<key>`   — one entry per city, keyed by `${STATE}:${city-slug}`
 *   A ZIP code is resolved client-side to a city/state (see app.js,
 *   `resolveZip`), then looked up against `states` and `locals`. If a
 *   region isn't covered yet, the app still shows federal (+ state, if that
 *   state has been researched) and records the requested ZIP in
 *   localStorage (`liberty.requestedRegions`) so the next research pass
 *   knows which places to cover next.
 *
 * Wiring this to a live pipeline later: replace the hand-written arrays
 * below with data fetched from Congress.gov, Open States, and a city's
 * legislative system (Legistar/Municode/CivicPlus), keeping each bill's
 * shape (id, level, scope, title, tagline, summary, sourceUrl, ...) intact.
 */

const LIBERTY_REPOSITORY = {
  updated: "2026-07-24",

  federal: {
    name: "United States Congress",
    bills: [
      {
        id: "fed-s-4189",
        level: "federal",
        scope: "federal",
        number: "S. 4189",
        title: "INSULIN Act of 2026",
        tagline: "Caps insulin at $35/month for everyone with private insurance.",
        summary:
          "A bipartisan Senate bill that would expand the existing $35 insulin price cap (currently limited to Medicare) to everyone with private insurance, and creates a $100 million grant program to guarantee $35 insulin for people who are uninsured.",
        topics: ["Healthcare"],
        status: "Hearing Scheduled",
        stage: "Senate committee hearing scheduled",
        sponsor: "Bipartisan Senate sponsors",
        sourceUrl: "https://www.congress.gov/bill/119th-congress/senate-bill/4189",
      },
      {
        id: "fed-hr-3062",
        level: "federal",
        scope: "federal",
        number: "H.R. 3062",
        title: "Promoting Cross-border Energy Infrastructure Act",
        tagline: "Streamlines permitting for cross-border energy pipelines and transmission lines.",
        summary:
          "Directs federal agencies to speed up permitting decisions for energy infrastructure projects that cross the U.S. border with Canada or Mexico, such as pipelines and transmission lines.",
        topics: ["Energy"],
        status: "Committee of the Whole",
        stage: "Committed to the Committee of the Whole House; ordered to be printed",
        sponsor: "House sponsor",
        sourceUrl: "https://www.congress.gov/bill/119th-congress/house-bill/3062",
      },
      {
        id: "fed-hr-8443",
        level: "federal",
        scope: "federal",
        number: "H.R. 8443",
        title: "End H-1B Visa Abuse Act of 2026",
        tagline: "Would pause new H-1B visa issuance to overhaul the program.",
        summary:
          "Amends the Immigration and Nationality Act to pause the issuance of new H-1B visas while Congress reworks eligibility and wage requirements for the program.",
        topics: ["Immigration", "Economy"],
        status: "In Committee",
        stage: "Referred to the House Judiciary Committee",
        sponsor: "House sponsor",
        sourceUrl: "https://www.congress.gov/bill/119th-congress/house-bill/8443",
      },
    ],
    reps: [
      {
        id: "rep-us-house-generic",
        role: "U.S. Representative",
        name: "Find your U.S. House member",
        note: "Your House member depends on your congressional district.",
        website: "https://www.house.gov/representatives/find-your-representative",
      },
    ],
    events: [
      {
        id: "event-no-kings",
        type: "event",
        title: "\"No Kings\" Nationwide Day of Action",
        tagline: "Recurring nationwide protest series; most recent mobilization was June 14, 2026.",
        description:
          "A recurring series of coordinated nationwide protests against the Trump administration's policies. Past mobilizations (June 2025, October 2025, March 2026, June 2026) each drew millions of participants across thousands of local events; organizers have discussed further dates including around July 4, 2026.",
        date: "Recurring — check organizers for the next date",
        location: "Nationwide (local chapters in most cities)",
        sourceUrl: "https://en.wikipedia.org/wiki/2026_No_Kings_protests",
      },
      {
        id: "event-gop-midterm-convention",
        type: "event",
        title: "2026 Republican Midterm Convention",
        tagline: "The GOP's first-ever midterm convention, in Dallas, TX.",
        description:
          "The Republican Party's first midterm convention, held in Dallas, Texas in September 2026, aimed at rallying support ahead of the November midterms.",
        date: "September 2026",
        location: "Dallas, TX",
        sourceUrl: "https://gopconvention.com/",
      },
    ],
  },

  states: {
    CA: {
      name: "California",
      bills: [
        {
          id: "state-ca-ab-736",
          level: "state",
          scope: "state",
          number: "AB 736 (Wicks)",
          title: "$10 Billion Affordable Housing Bond",
          tagline: "Would put a $10B affordable housing bond before voters.",
          summary:
            "Companion bill to SB 417 that would place a $10 billion general obligation bond on the ballot to finance affordable housing programs, including the Multifamily Housing Program, CalHOME, and farmworker housing grants.",
          topics: ["Housing"],
          status: "In Committee",
          stage: "Moving through policy committees ahead of the Aug 31, 2026 session deadline",
          sponsor: "Asm. Buffy Wicks",
          sourceUrl: "https://cayimby.org/2026-legislation/",
        },
        {
          id: "state-ca-sb-417",
          level: "state",
          scope: "state",
          number: "SB 417 (Cabaldon)",
          title: "$10 Billion Affordable Housing Bond (Senate companion)",
          tagline: "Senate companion to AB 736's affordable housing bond.",
          summary:
            "Senate companion to AB 736 — part of the same $10 billion affordable-housing bond package under consideration in the 2026 legislative session.",
          topics: ["Housing"],
          status: "In Committee",
          stage: "Moving through policy committees ahead of the Aug 31, 2026 session deadline",
          sponsor: "Sen. Christopher Cabaldon",
          sourceUrl: "https://cayimby.org/2026-legislation/",
        },
        {
          id: "state-ca-sb-53",
          level: "state",
          scope: "state",
          number: "SB 53",
          title: "Transparency in Frontier Artificial Intelligence Act",
          tagline: "California's landmark AI transparency law — already signed.",
          summary:
            "The most comprehensive AI transparency law in the country, requiring large AI developers to publish safety frameworks and report critical incidents. Signed by Gov. Newsom on Sept 29, 2025; the first law of its kind to take effect.",
          topics: ["Technology"],
          status: "Enacted",
          stage: "Signed into law — shown here for reference, not an open vote",
          sponsor: "Sen. Scott Wiener",
          sourceUrl: "https://en.wikipedia.org/wiki/Transparency_in_Frontier_Artificial_Intelligence_Act",
        },
      ],
      reps: [
        { id: "rep-ca-sen-padilla", role: "U.S. Senator", name: "Sen. Alex Padilla", party: "D", website: "https://www.padilla.senate.gov/" },
        { id: "rep-ca-sen-schiff", role: "U.S. Senator", name: "Sen. Adam Schiff", party: "D", website: "https://www.schiff.senate.gov/" },
        { id: "rep-ca-gov", role: "Governor", name: "Gov. Gavin Newsom", party: "D", note: "Newsom is term-limited; his successor is decided in the Nov 3, 2026 election.", website: "https://www.gov.ca.gov/" },
      ],
      events: [
        {
          id: "event-ca-dem-convention",
          type: "event",
          title: "California Democratic Party Convention",
          tagline: "State party convention — delegates did not endorse in the crowded governor's race.",
          description:
            "The California Democratic Party's 2026 convention brought together delegates from across the state; notably, they did not issue an endorsement in the crowded gubernatorial primary.",
          date: "2026",
          location: "California",
          sourceUrl: "https://www.yahoo.com/news/articles/recap-2026-california-democratic-convention-022646948.html",
        },
      ],
      candidates: [
        {
          id: "candidate-ca-governor-2026",
          type: "candidate",
          race: "California Governor",
          tagline: "Becerra vs. Hilton head to the Nov 3, 2026 general election.",
          description:
            "Xavier Becerra (D) and Steve Hilton (R) advanced out of the June 2, 2026 top-two primary (61 candidates ran) to face off in the November 3, 2026 general election for governor, since Gavin Newsom is term-limited.",
          date: "General election: Nov 3, 2026",
          candidates: ["Xavier Becerra (D)", "Steve Hilton (R)"],
          sourceUrl: "https://ballotpedia.org/California_gubernatorial_election,_2026",
        },
      ],
    },
  },

  locals: {
    "CA:san-francisco": {
      city: "San Francisco",
      county: "San Francisco County",
      state: "CA",
      bills: [
        {
          id: "local-sf-code-streamlining",
          level: "local",
          scope: "town",
          number: "Board File (2026)",
          title: "City Code Streamlining Ordinance",
          tagline: "Sweeping cleanup of San Francisco's municipal code, passed 7-4.",
          summary:
            "An ordinance making sweeping changes to San Francisco's municipal codes, originating from the City Attorney's office, which partnered with a Stanford University lab to use AI to identify redundant or outdated code sections. Passed by the Board of Supervisors 7-4.",
          topics: ["Government"],
          status: "Passed",
          stage: "Passed Board of Supervisors 7-4 (reported July 14, 2026)",
          sponsor: "Board President Rafael Mandelman",
          sourceUrl: "https://missionlocal.org/2026/07/sf-city-code-streamlining-mandelman/",
        },
        {
          id: "local-sf-transfer-tax-measure",
          level: "local",
          scope: "county",
          number: "Ballot Measure (Nov 2026)",
          title: "Real Property Transfer Tax Foreclosure Exemption Repeal",
          tagline: "Would end a transfer-tax exemption for foreclosures on larger properties.",
          summary:
            "A measure ordered onto the November 3, 2026 ballot that would amend the Business and Tax Regulations Code to eliminate the real property transfer tax foreclosure exemption for all properties except residential and mixed-use buildings with fewer than five units.",
          topics: ["Housing", "Economy"],
          status: "On Ballot",
          stage: "Goes to San Francisco voters on Nov 3, 2026",
          sponsor: "Board of Supervisors",
          sourceUrl: "https://media.api.sf.gov/documents/bag072126_agenda.pdf",
        },
      ],
      reps: [
        { id: "rep-sf-mayor", role: "Mayor", name: "Mayor Daniel Lurie", website: "https://www.sf.gov/departments--office-mayor" },
        { id: "rep-sf-board-president", role: "Board President, District 8", name: "Sup. Rafael Mandelman", website: "https://sfbos.org/" },
      ],
      events: [
        {
          id: "event-sf-bos-meetings",
          type: "event",
          title: "SF Board of Supervisors — weekly meetings",
          tagline: "Public comment is open at every meeting.",
          description:
            "The Board of Supervisors meets weekly at City Hall; agendas are posted in advance and public comment is open on every item, including the bills listed above.",
          date: "Weekly, Tuesdays",
          location: "San Francisco City Hall",
          sourceUrl: "https://sfbos.org/",
        },
      ],
      candidates: [
        {
          id: "candidate-ca11-house-2026",
          type: "candidate",
          race: "U.S. House, CA-11 (San Francisco)",
          tagline: "First open race for Pelosi's seat since 1987.",
          description:
            "State Sen. Scott Wiener and SF Supervisor Connie Chan advanced from the June 2026 primary to the November 3, 2026 general election for California's 11th Congressional District — the seat Nancy Pelosi is retiring from after 39 years.",
          date: "General election: Nov 3, 2026",
          candidates: ["Scott Wiener", "Connie Chan"],
          sourceUrl: "https://abc7news.com/post/election-2026-nancy-pelosis-ca-district-11-seat-is-grabs-top-candidates-connie-chan-scott-weiner-saikat-chakrabarti/19213650/",
        },
      ],
    },
  },
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = LIBERTY_REPOSITORY;
}
