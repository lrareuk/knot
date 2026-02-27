export type SupportedCurrencyCode = "GBP" | "USD" | "CAD";
export type JurisdictionCountryCode = "GB" | "US" | "CA";
export type JurisdictionRegionType = "country_constituent" | "state" | "province_territory";

export type JurisdictionProfile = {
  code: string;
  display_name: string;
  country: JurisdictionCountryCode;
  region_type: JurisdictionRegionType;
  default_currency: SupportedCurrencyCode;
  property_framework: string;
  maintenance_framework: string;
  child_support_reference: {
    label: string;
    url: string;
  };
  key_caveats: string[];
  last_reviewed_at: string;
};

const LAST_REVIEWED_AT = "2026-02-27";

const ENGLAND_AND_WALES: JurisdictionProfile = {
  code: "GB-EAW",
  display_name: "England and Wales",
  country: "GB",
  region_type: "country_constituent",
  default_currency: "GBP",
  property_framework: "Discretionary fairness framework under the Matrimonial Causes Act 1973 with needs/sharing principles.",
  maintenance_framework: "Needs-led spousal maintenance with broad judicial discretion on amount and duration.",
  child_support_reference: {
    label: "UK Child Maintenance Service",
    url: "https://www.gov.uk/calculate-child-maintenance",
  },
  key_caveats: [
    "Court outcomes are discretionary and fact-sensitive.",
    "Needs, non-matrimonial property treatment, and child arrangements can materially change outcomes.",
  ],
  last_reviewed_at: LAST_REVIEWED_AT,
};

const SCOTLAND: JurisdictionProfile = {
  code: "GB-SCT",
  display_name: "Scotland",
  country: "GB",
  region_type: "country_constituent",
  default_currency: "GBP",
  property_framework: "Fair sharing of matrimonial property under Scots law, adjusted for statutory factors.",
  maintenance_framework: "Needs-based spousal support with broad judicial discretion and limited-duration trends.",
  child_support_reference: {
    label: "UK Child Maintenance Service",
    url: "https://www.gov.uk/calculate-child-maintenance",
  },
  key_caveats: [
    "Court outcomes are discretionary and fact-sensitive.",
    "Valuation date and matrimonial/non-matrimonial classification can materially change outcomes.",
  ],
  last_reviewed_at: LAST_REVIEWED_AT,
};

const COMMUNITY_PROPERTY_STATES = new Set([
  "US-AZ",
  "US-CA",
  "US-ID",
  "US-LA",
  "US-NV",
  "US-NM",
  "US-TX",
  "US-WA",
  "US-WI",
]);

const US_STATES: Array<{ code: string; name: string }> = [
  { code: "US-AL", name: "Alabama" },
  { code: "US-AK", name: "Alaska" },
  { code: "US-AZ", name: "Arizona" },
  { code: "US-AR", name: "Arkansas" },
  { code: "US-CA", name: "California" },
  { code: "US-CO", name: "Colorado" },
  { code: "US-CT", name: "Connecticut" },
  { code: "US-DE", name: "Delaware" },
  { code: "US-DC", name: "District of Columbia" },
  { code: "US-FL", name: "Florida" },
  { code: "US-GA", name: "Georgia" },
  { code: "US-HI", name: "Hawaii" },
  { code: "US-ID", name: "Idaho" },
  { code: "US-IL", name: "Illinois" },
  { code: "US-IN", name: "Indiana" },
  { code: "US-IA", name: "Iowa" },
  { code: "US-KS", name: "Kansas" },
  { code: "US-KY", name: "Kentucky" },
  { code: "US-LA", name: "Louisiana" },
  { code: "US-ME", name: "Maine" },
  { code: "US-MD", name: "Maryland" },
  { code: "US-MA", name: "Massachusetts" },
  { code: "US-MI", name: "Michigan" },
  { code: "US-MN", name: "Minnesota" },
  { code: "US-MS", name: "Mississippi" },
  { code: "US-MO", name: "Missouri" },
  { code: "US-MT", name: "Montana" },
  { code: "US-NE", name: "Nebraska" },
  { code: "US-NV", name: "Nevada" },
  { code: "US-NH", name: "New Hampshire" },
  { code: "US-NJ", name: "New Jersey" },
  { code: "US-NM", name: "New Mexico" },
  { code: "US-NY", name: "New York" },
  { code: "US-NC", name: "North Carolina" },
  { code: "US-ND", name: "North Dakota" },
  { code: "US-OH", name: "Ohio" },
  { code: "US-OK", name: "Oklahoma" },
  { code: "US-OR", name: "Oregon" },
  { code: "US-PA", name: "Pennsylvania" },
  { code: "US-RI", name: "Rhode Island" },
  { code: "US-SC", name: "South Carolina" },
  { code: "US-SD", name: "South Dakota" },
  { code: "US-TN", name: "Tennessee" },
  { code: "US-TX", name: "Texas" },
  { code: "US-UT", name: "Utah" },
  { code: "US-VT", name: "Vermont" },
  { code: "US-VA", name: "Virginia" },
  { code: "US-WA", name: "Washington" },
  { code: "US-WV", name: "West Virginia" },
  { code: "US-WI", name: "Wisconsin" },
  { code: "US-WY", name: "Wyoming" },
];

function usPropertyFramework(code: string) {
  if (COMMUNITY_PROPERTY_STATES.has(code)) {
    return "Community property framework for marital/community assets, with state-specific exceptions and tracing rules.";
  }

  if (code === "US-AK") {
    return "Equitable distribution framework; couples may opt into community property treatment by agreement.";
  }

  return "Equitable distribution framework with state-specific factors and discretion in allocation.";
}

function usCaveats(code: string) {
  const caveats = [
    "State statutes and case law change over time; confirm current local rules.",
    "Classification, tracing, and valuation disputes frequently drive outcomes.",
  ];

  if (COMMUNITY_PROPERTY_STATES.has(code) || code === "US-AK") {
    caveats.push("Pre-marital, separate, and commingled property analysis can materially change community/equitable treatment.");
  }

  return caveats;
}

const US_JURISDICTIONS: JurisdictionProfile[] = US_STATES.map((state) => ({
  code: state.code,
  display_name: state.name,
  country: "US",
  region_type: "state",
  default_currency: "USD",
  property_framework: usPropertyFramework(state.code),
  maintenance_framework: "Spousal support/alimony determined under state-specific statutory factors and judicial discretion.",
  child_support_reference: {
    label: "U.S. state child support agencies",
    url: "https://www.acf.hhs.gov/css/parents/how-do-i-contact-my-state",
  },
  key_caveats: usCaveats(state.code),
  last_reviewed_at: LAST_REVIEWED_AT,
}));

const CANADA_REGIONS: Array<{ code: string; name: string }> = [
  { code: "CA-AB", name: "Alberta" },
  { code: "CA-BC", name: "British Columbia" },
  { code: "CA-MB", name: "Manitoba" },
  { code: "CA-NB", name: "New Brunswick" },
  { code: "CA-NL", name: "Newfoundland and Labrador" },
  { code: "CA-NS", name: "Nova Scotia" },
  { code: "CA-NT", name: "Northwest Territories" },
  { code: "CA-NU", name: "Nunavut" },
  { code: "CA-ON", name: "Ontario" },
  { code: "CA-PE", name: "Prince Edward Island" },
  { code: "CA-QC", name: "Quebec" },
  { code: "CA-SK", name: "Saskatchewan" },
  { code: "CA-YT", name: "Yukon" },
];

function canadaPropertyFramework(code: string) {
  if (code === "CA-QC") {
    return "Civil law framework with family patrimony and Quebec-specific matrimonial property regime rules.";
  }

  return "Provincial/territorial equalization and family property framework with jurisdiction-specific exclusions and valuation rules.";
}

const CANADA_JURISDICTIONS: JurisdictionProfile[] = CANADA_REGIONS.map((region) => ({
  code: region.code,
  display_name: region.name,
  country: "CA",
  region_type: "province_territory",
  default_currency: "CAD",
  property_framework: canadaPropertyFramework(region.code),
  maintenance_framework: "Spousal support determined under federal/provincial principles, guidelines context, and court discretion.",
  child_support_reference: {
    label: "Government of Canada child support resources",
    url: "https://www.justice.gc.ca/eng/fl-df/child-enfant/guide/index.html",
  },
  key_caveats: [
    "Provincial/territorial statutes apply differently, especially for unmarried spouses and exclusions.",
    "Tax treatment and support-duration factors require local legal review.",
  ],
  last_reviewed_at: LAST_REVIEWED_AT,
}));

export const JURISDICTIONS: JurisdictionProfile[] = [ENGLAND_AND_WALES, SCOTLAND, ...US_JURISDICTIONS, ...CANADA_JURISDICTIONS];

export const JURISDICTION_BY_CODE = new Map(JURISDICTIONS.map((entry) => [entry.code, entry]));

export function getJurisdictionProfile(code: string | null | undefined): JurisdictionProfile | null {
  if (!code) {
    return null;
  }

  return JURISDICTION_BY_CODE.get(code) ?? null;
}

export function isSupportedJurisdiction(code: string | null | undefined): boolean {
  return Boolean(getJurisdictionProfile(code));
}

export function defaultCurrencyForJurisdiction(code: string | null | undefined): SupportedCurrencyCode {
  return getJurisdictionProfile(code)?.default_currency ?? "GBP";
}

export function jurisdictionGroupsForApi() {
  const countries = [
    { code: "GB", label: "United Kingdom", subdivisions: [] as JurisdictionProfile[] },
    { code: "US", label: "United States", subdivisions: [] as JurisdictionProfile[] },
    { code: "CA", label: "Canada", subdivisions: [] as JurisdictionProfile[] },
  ];

  for (const item of JURISDICTIONS) {
    const bucket = countries.find((country) => country.code === item.country);
    if (!bucket) {
      continue;
    }
    bucket.subdivisions.push(item);
  }

  for (const country of countries) {
    country.subdivisions.sort((a, b) => a.display_name.localeCompare(b.display_name));
  }

  return countries;
}
