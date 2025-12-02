/**
 * Application-wide constants
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
