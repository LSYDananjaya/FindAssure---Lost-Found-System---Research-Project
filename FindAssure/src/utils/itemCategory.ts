import { ITEM_CATEGORIES } from '../constants/appConstants';

const normalizeCategoryKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const CATEGORY_ALIASES: Record<string, string> = {
  smartphone: 'Smart Phone',
  'smart phone': 'Smart Phone',
  phone: 'Smart Phone',
  mobile: 'Smart Phone',
  'mobile phone': 'Smart Phone',
  cellphone: 'Smart Phone',
  'cell phone': 'Smart Phone',
  backpack: 'Backpack',
  bag: 'Backpack',
  handbag: 'Handbag',
  purse: 'Handbag',
  wallet: 'Wallet',
  helmet: 'Helmet',
  key: 'Key',
  keys: 'Key',
  'power bank': 'Power Bank',
  powerbank: 'Power Bank',
  'portable charger': 'Power Bank',
  'phone charger': 'Laptop/Mobile chargers & cables',
  charger: 'Laptop/Mobile chargers & cables',
  chargers: 'Laptop/Mobile chargers & cables',
  cable: 'Laptop/Mobile chargers & cables',
  cables: 'Laptop/Mobile chargers & cables',
  'charging cable': 'Laptop/Mobile chargers & cables',
  'usb cable': 'Laptop/Mobile chargers & cables',
  'laptop charger': 'Laptop/Mobile chargers & cables',
  'mobile charger': 'Laptop/Mobile chargers & cables',
  'laptop mobile chargers cables': 'Laptop/Mobile chargers & cables',
  laptop: 'Laptop',
  'student id': 'Student ID',
  'student id card': 'Student ID',
  'id card': 'Student ID',
  id: 'Student ID',
  nic: 'NIC / National ID Card',
  'national id': 'NIC / National ID Card',
  'national id card': 'NIC / National ID Card',
  'nic card': 'NIC / National ID Card',
  'nic national id card': 'NIC / National ID Card',
  'earbud earbud case': 'Earbuds - Earbuds case',
  'earbuds earbud case': 'Earbuds - Earbuds case',
  'earbuds earbuds case': 'Earbuds - Earbuds case',
  'earbuds case': 'Earbuds - Earbuds case',
  earbuds: 'Earbuds - Earbuds case',
  earbud: 'Earbuds - Earbuds case',
  'earbud case': 'Earbuds - Earbuds case',
  'earbuds case cover': 'Earbuds - Earbuds case',
  headphone: 'Headphone',
  headphones: 'Headphone',
  headset: 'Headphone',
  headsets: 'Headphone',
};

const CATEGORY_LOOKUP = ITEM_CATEGORIES.reduce<Record<string, string>>((lookup, category) => {
  lookup[normalizeCategoryKey(category)] = category;
  return lookup;
}, {});

export const resolveItemCategory = (rawCategory?: string | null): string | undefined => {
  if (!rawCategory) {
    return undefined;
  }

  const normalized = normalizeCategoryKey(rawCategory);
  if (!normalized) {
    return undefined;
  }

  return CATEGORY_LOOKUP[normalized] || CATEGORY_ALIASES[normalized];
};
