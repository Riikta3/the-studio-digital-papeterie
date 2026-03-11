export const DIETARY_OPTIONS_FR = [
  "Végétarien",
  "Végétalien / Vegan",
  "Sans gluten",
  "Sans lactose",
  "Sans porc",
  "Sans fruits de mer",
  "Sans noix / Allergie noix",
  "Halal",
  "Casher",
  "Autre",
] as const;

export const DIETARY_OPTIONS_EN = [
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Lactose-free",
  "No pork",
  "No seafood",
  "No nuts / Nut allergy",
  "Halal",
  "Kosher",
  "Other",
] as const;

export type DietaryOption =
  | (typeof DIETARY_OPTIONS_FR)[number]
  | (typeof DIETARY_OPTIONS_EN)[number];
