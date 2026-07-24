/**
 * Seed legislative data for Liberty.
 *
 * This is hand-written sample data so the app has something real to browse
 * out of the box. In production, replace this file's contents with data
 * fetched from real legislative APIs, e.g.:
 *   - Federal:  https://api.congress.gov/
 *   - State:    https://v3.openstates.org/
 *   - Local:    varies by city/county (Legistar, Municode, CivicPlus, etc.)
 *   - Reps:     https://www.googleapis.com/civicinfo/v2/representatives
 *
 * Keep the shape of each object the same and the rest of the app keeps working.
 */

const LIBERTY_BILLS = [
  {
    id: "fed-hr-3021",
    level: "federal",
    jurisdiction: "United States Congress",
    number: "H.R. 3021",
    title: "Broadband Affordability Act",
    summary:
      "Extends the FCC's Affordable Connectivity Program with new funding, subsidizing home internet costs for low-income households and expanding eligibility to include qualifying rural residents.",
    topics: ["Technology", "Economy", "Rural Affairs"],
    status: "In Committee",
    stage: "Referred to House Energy and Commerce Committee",
    sponsor: "Rep. A. Delgado (D)",
    dateIntroduced: "2026-03-11",
    voteDate: "2026-08-19",
    sourceUrl: "https://www.congress.gov/",
  },
  {
    id: "fed-s-1187",
    level: "federal",
    jurisdiction: "United States Congress",
    number: "S. 1187",
    title: "Veterans Mental Health Access Act",
    summary:
      "Directs the VA to open 50 new mental health clinics in underserved counties and funds a national suicide-prevention hotline expansion for veterans.",
    topics: ["Veterans", "Healthcare"],
    status: "Passed Committee",
    stage: "Placed on Senate calendar",
    sponsor: "Sen. K. Marsh (R)",
    dateIntroduced: "2026-02-02",
    voteDate: "2026-08-05",
    sourceUrl: "https://www.congress.gov/",
  },
  {
    id: "fed-hr-4410",
    level: "federal",
    jurisdiction: "United States Congress",
    number: "H.R. 4410",
    title: "Clean Grid Investment Act",
    summary:
      "Authorizes federal tax credits for utility-scale battery storage and grants to states that retire coal plants ahead of schedule.",
    topics: ["Energy", "Environment"],
    status: "Floor Vote Scheduled",
    stage: "Scheduled for a full House vote",
    sponsor: "Rep. J. Whitfield (D)",
    dateIntroduced: "2026-01-20",
    voteDate: "2026-08-01",
    sourceUrl: "https://www.congress.gov/",
  },

  {
    id: "state-sb-214",
    level: "state",
    jurisdiction: "State Senate",
    number: "SB 214",
    title: "Statewide Rent Stabilization Act",
    summary:
      "Caps annual rent increases at 5% plus inflation for buildings over 15 years old, with exemptions for new construction and small landlords with fewer than 4 units.",
    topics: ["Housing", "Economy"],
    status: "In Committee",
    stage: "Senate Housing Committee hearing scheduled",
    sponsor: "Sen. L. Okafor",
    dateIntroduced: "2026-04-02",
    voteDate: "2026-08-12",
    sourceUrl: "https://openstates.org/",
  },
  {
    id: "state-hb-88",
    level: "state",
    jurisdiction: "State House",
    number: "HB 88",
    title: "K-12 Computer Science Requirement",
    summary:
      "Requires all public high schools to offer at least one computer science course and funds teacher certification programs to meet the mandate.",
    topics: ["Education", "Technology"],
    status: "Passed House",
    stage: "Awaiting State Senate vote",
    sponsor: "Rep. T. Nguyen",
    dateIntroduced: "2026-01-14",
    voteDate: "2026-07-30",
    sourceUrl: "https://openstates.org/",
  },
  {
    id: "state-sb-77",
    level: "state",
    jurisdiction: "State Senate",
    number: "SB 77",
    title: "Water Rights Modernization Act",
    summary:
      "Overhauls the state's century-old water rights permitting system, prioritizing drought resilience and giving regulators authority to curtail agricultural usage during emergencies.",
    topics: ["Environment", "Agriculture"],
    status: "In Committee",
    stage: "Senate Natural Resources Committee markup",
    sponsor: "Sen. R. Castillo",
    dateIntroduced: "2026-03-28",
    voteDate: "2026-09-02",
    sourceUrl: "https://openstates.org/",
  },

  {
    id: "local-ord-2026-45",
    level: "local",
    jurisdiction: "City Council",
    number: "Ordinance 2026-45",
    title: "Protected Bike Lane Expansion",
    summary:
      "Funds 12 miles of physically protected bike lanes on major downtown corridors and reallocates 200 street parking spots to bike infrastructure.",
    topics: ["Transportation", "Public Safety"],
    status: "Public Comment Period",
    stage: "Open for public comment before council vote",
    sponsor: "Council Member D. Ruiz (District 3)",
    dateIntroduced: "2026-05-06",
    voteDate: "2026-07-31",
    sourceUrl: "",
  },
  {
    id: "local-ord-2026-51",
    level: "local",
    jurisdiction: "City Council",
    number: "Ordinance 2026-51",
    title: "Short-Term Rental Cap",
    summary:
      "Limits short-term rental permits to 1 per owner in residential zones and imposes a $2,500 annual registration fee to fund enforcement staff.",
    topics: ["Housing", "Economy"],
    status: "Committee Review",
    stage: "Planning & Zoning Committee review",
    sponsor: "Council Member P. Alvarez (District 7)",
    dateIntroduced: "2026-04-18",
    voteDate: "2026-08-14",
    sourceUrl: "",
  },
  {
    id: "local-meas-b",
    level: "local",
    jurisdiction: "County Board",
    number: "Measure B",
    title: "County Parks & Trails Bond",
    summary:
      "Authorizes $85M in bonds to acquire open space, build new trailheads, and renovate aging park facilities across the county.",
    topics: ["Environment", "Recreation"],
    status: "On Ballot",
    stage: "Goes to voters on the November ballot",
    sponsor: "County Board of Supervisors",
    dateIntroduced: "2026-02-10",
    voteDate: "2026-11-03",
    sourceUrl: "",
  },
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = LIBERTY_BILLS;
}
