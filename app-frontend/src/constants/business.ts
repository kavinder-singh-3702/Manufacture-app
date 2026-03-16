export const BUSINESS_ACCOUNT_TYPES = ["normal", "trader", "manufacturer"] as const;

export type BusinessAccountType = (typeof BUSINESS_ACCOUNT_TYPES)[number];

export const BUSINESS_CATEGORIES = [
  "food & beverage manufacturing",
  "textile & apparel manufacturing",
  "paper & packaging industry",
  "chemical manufacturing",
  "pharmaceutical & medical manufacturing",
  "plastic & polymer industry",
  "rubber industry",
  "metal & steel industry",
  "automobile & auto components",
  "electrical & electronics manufacturing",
  "machinery & heavy engineering",
  "wood & furniture industry",
  "construction material industry",
  "leather industry",
  "petroleum & energy-based manufacturing",
  "defence & aerospace manufacturing",
  "consumer goods (fmcg) manufacturing",
  "printing & publishing",
  "toys & sports goods manufacturing",
  "handicrafts & cottage industries",
  "finished goods",
  "components & parts",
  "raw materials",
  "machinery & equipment",
  "packaging",
  "services",
  "other",
] as const;
