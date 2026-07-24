/**
 * Seed representative directory for Liberty.
 *
 * In production, look these up per-user by address via the Google Civic
 * Information API (https://developers.google.com/civic-information) or
 * a state/local equivalent, instead of hardcoding a single set of names.
 */

const LIBERTY_REPS = [
  // Federal
  {
    id: "rep-us-sen-1",
    level: "federal",
    jurisdiction: "United States Congress",
    role: "U.S. Senator",
    name: "Sen. M. Halloway",
    party: "D",
    email: "senator.halloway@senate.gov",
    phone: "(202) 555-0142",
    website: "https://www.senate.gov/",
  },
  {
    id: "rep-us-sen-2",
    level: "federal",
    jurisdiction: "United States Congress",
    role: "U.S. Senator",
    name: "Sen. K. Marsh",
    party: "R",
    email: "senator.marsh@senate.gov",
    phone: "(202) 555-0198",
    website: "https://www.senate.gov/",
  },
  {
    id: "rep-us-house-1",
    level: "federal",
    jurisdiction: "United States Congress",
    role: "U.S. Representative",
    name: "Rep. A. Delgado",
    party: "D",
    email: "rep.delgado@mail.house.gov",
    phone: "(202) 555-0113",
    website: "https://www.house.gov/",
  },

  // State
  {
    id: "rep-state-sen-1",
    level: "state",
    jurisdiction: "State Senate",
    role: "State Senator",
    name: "Sen. L. Okafor",
    party: "D",
    email: "senator.okafor@statesenate.gov",
    phone: "(555) 010-2200",
    website: "",
  },
  {
    id: "rep-state-house-1",
    level: "state",
    jurisdiction: "State House",
    role: "State Representative",
    name: "Rep. T. Nguyen",
    party: "R",
    email: "rep.nguyen@statehouse.gov",
    phone: "(555) 010-2255",
    website: "",
  },

  // Local
  {
    id: "rep-mayor",
    level: "local",
    jurisdiction: "City Hall",
    role: "Mayor",
    name: "Mayor S. Whitaker",
    party: "",
    email: "mayor@cityhall.gov",
    phone: "(555) 010-3000",
    website: "",
  },
  {
    id: "rep-council-3",
    level: "local",
    jurisdiction: "City Council, District 3",
    role: "Council Member",
    name: "D. Ruiz",
    party: "",
    email: "d.ruiz@citycouncil.gov",
    phone: "(555) 010-3103",
    website: "",
  },
  {
    id: "rep-council-7",
    level: "local",
    jurisdiction: "City Council, District 7",
    role: "Council Member",
    name: "P. Alvarez",
    party: "",
    email: "p.alvarez@citycouncil.gov",
    phone: "(555) 010-3107",
    website: "",
  },
  {
    id: "rep-county-board",
    level: "local",
    jurisdiction: "County Board",
    role: "County Supervisor",
    name: "Supervisor J. Kim",
    party: "",
    email: "j.kim@countyboard.gov",
    phone: "(555) 010-4000",
    website: "",
  },
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = LIBERTY_REPS;
}
