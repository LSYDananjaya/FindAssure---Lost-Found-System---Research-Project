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
  'Phone',
  'Wallet',
  'Keys',
  'Bag',
  'Laptop',
  'Headphones',
  'Watch',
  'Glasses',
  'ID Card',
  'Books',
  'Clothing',
  'Jewelry',
  'Other',
] as const;

export type ItemCategoryType = typeof ITEM_CATEGORIES[number];
