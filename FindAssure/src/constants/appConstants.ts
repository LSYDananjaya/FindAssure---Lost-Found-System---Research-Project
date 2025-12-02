/**
 * Application-wide constants for FindAssure mobile app
 */

export const LOCATIONS = [
  'Main Building',
  'Canteen',
  'New Building',
  'Birds Nest',
  'Ground',
  'Library',
  'Parking Lot',
  'Gym',
  'Auditorium',
  'Labs',
  'Admin Block',
  'Other',
] as const;

export type LocationType = typeof LOCATIONS[number];

export const ITEM_CATEGORIES = [
  'Wallet',
  'Laptop',
  'Smartphone',
  'Backpack',
  'Handbag',
  'Helmet',
  'Key',
  'Earbud/Earbud Case',
  'Student ID',
  'Charger',
  'Notebook',
] as const;

export type ItemCategoryType = typeof ITEM_CATEGORIES[number];

export const CONFIDENCE_LEVEL_MIN = 1;
export const CONFIDENCE_LEVEL_MAX = 100;
export const CONFIDENCE_LEVEL_DEFAULT = 50;
