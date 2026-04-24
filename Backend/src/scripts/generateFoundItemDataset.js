const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const countsByCategory = {
  Wallet: 10,
  Helmet: 10,
  Handbag: 5,
  Backpack: 5,
  Laptop: 5,
  'Smart Phone': 5,
  Key: 5,
  'Power Bank': 5,
  'Laptop/Mobile chargers & cables': 5,
  'Earbuds - Earbuds case': 5,
  Headphone: 5,
  'Student ID': 5,
};

const founderContacts = [
  { name: 'Nadeesha Perera', email: 'nadeesha.perera@example.com', phone: '+94771230001' },
  { name: 'Kavindu Silva', email: 'kavindu.silva@example.com', phone: '+94771230002' },
  { name: 'Sachini Fernando', email: 'sachini.fernando@example.com', phone: '+94771230003' },
  { name: 'Dulanjana Weerasekara', email: 'dulanjana.w@example.com', phone: '+94771230004' },
  { name: 'Hiruni Jayasinghe', email: 'hiruni.j@example.com', phone: '+94771230005' },
  { name: 'Yasith Gunawardena', email: 'yasith.g@example.com', phone: '+94771230006' },
];

const outdoorLocations = [
  { location: 'auditorium' },
  { location: 'anohana_canteen' },
  { location: 'basement_canteen' },
  { location: 'sliit_islands' },
  { location: 'reception' },
  { location: 'business_faculty' },
  { location: 'juice_bar' },
  { location: 'play_ground' },
  { location: 'sliit_beach' },
  { location: 'bird_nest' },
  { location: 'open_theater' },
  { location: 'volleyball_court' },
  { location: 'basketball_court' },
  { location: 'tennis_court' },
  { location: 'engineering_faculty' },
  { location: 'new_building_entrance' },
  { location: 'willium_angliss' },
  { location: 'green_house' },
  { location: 'lake' },
  { location: 'car_park1' },
  { location: 'guard_room' },
];

const mainBuildingLocations = [
  { location: 'main_building', floor_id: 'basement', hall_name: 'basement_liftarea' },
  { location: 'main_building', floor_id: '1', hall_name: '1_liftarea' },
  { location: 'main_building', floor_id: '1', hall_name: 'reception' },
  { location: 'main_building', floor_id: '2', hall_name: 'study_area' },
  { location: 'main_building', floor_id: '2', hall_name: 'sport_room' },
  { location: 'main_building', floor_id: '2', hall_name: 'counseling_area' },
  { location: 'main_building', floor_id: '3', hall_name: 'A301' },
  { location: 'main_building', floor_id: '3', hall_name: 'A303' },
  { location: 'main_building', floor_id: '3', hall_name: 'library' },
  { location: 'main_building', floor_id: '4', hall_name: 'A405' },
  { location: 'main_building', floor_id: '4', hall_name: 'A407_ITS_division' },
  { location: 'main_building', floor_id: '4', hall_name: 'A410' },
  { location: 'main_building', floor_id: '5', hall_name: 'A505' },
  { location: 'main_building', floor_id: '5', hall_name: 'A503' },
  { location: 'main_building', floor_id: '5', hall_name: 'A501' },
  { location: 'main_building', floor_id: '6', hall_name: 'CSSE_unit' },
  { location: 'main_building', floor_id: '7', hall_name: 'DS_unit' },
  { location: 'main_building', floor_id: '7', hall_name: 'IT_unit' },
];

const newBuildingLocations = [
  { location: 'new_building', floor_id: '1', hall_name: '1_liftarea' },
  { location: 'new_building', floor_id: '2', hall_name: 'canteen' },
  { location: 'new_building', floor_id: '2', hall_name: 'Library' },
  { location: 'new_building', floor_id: '3', hall_name: 'F301' },
  { location: 'new_building', floor_id: '3', hall_name: 'F305' },
  { location: 'new_building', floor_id: '4', hall_name: 'G4_Reading_Room' },
  { location: 'new_building', floor_id: '4', hall_name: 'F404' },
  { location: 'new_building', floor_id: '5', hall_name: 'G501' },
  { location: 'new_building', floor_id: '5', hall_name: 'F505' },
  { location: 'new_building', floor_id: '6', hall_name: 'G601' },
  { location: 'new_building', floor_id: '6', hall_name: 'F605' },
  { location: 'new_building', floor_id: '7', hall_name: 'G701' },
  { location: 'new_building', floor_id: '7', hall_name: 'F705' },
  { location: 'new_building', floor_id: '8', hall_name: 'G801' },
  { location: 'new_building', floor_id: '8', hall_name: 'F805' },
  { location: 'new_building', floor_id: '9', hall_name: 'G901' },
  { location: 'new_building', floor_id: '9', hall_name: 'F905' },
  { location: 'new_building', floor_id: '10', hall_name: 'G1001' },
  { location: 'new_building', floor_id: '10', hall_name: 'F1005' },
  { location: 'new_building', floor_id: '11', hall_name: 'G1101' },
  { location: 'new_building', floor_id: '11', hall_name: 'F1105' },
  { location: 'new_building', floor_id: '12', hall_name: 'G1201' },
  { location: 'new_building', floor_id: '12', hall_name: 'F1205' },
  { location: 'new_building', floor_id: '13', hall_name: 'G1301' },
  { location: 'new_building', floor_id: '13', hall_name: 'F1305' },
  { location: 'new_building', floor_id: '14', hall_name: 'G1401' },
  { location: 'new_building', floor_id: '14', hall_name: 'F1402' },
];

const locationPools = [...outdoorLocations, ...mainBuildingLocations, ...newBuildingLocations];

const questionTemplates = {
  Wallet: [
    { question: 'What color is the wallet?', type: 'color', level: 'core', weight: 1.0, key: 'color' },
    { question: 'What brand is on the wallet?', type: 'brand_identifier', level: 'strong', weight: 0.9, key: 'brand' },
    { question: 'What material is it made of?', type: 'descriptive', level: 'strong', weight: 0.8, key: 'material' },
    { question: 'How many card slots are visible?', type: 'numeric', level: 'supporting', weight: 0.6, key: 'count' },
    { question: 'What special mark or feature does it have?', type: 'descriptive', level: 'core', weight: 0.9, key: 'feature' },
  ],
  Helmet: [
    { question: 'What color is the helmet?', type: 'color', level: 'core', weight: 1.0, key: 'color' },
    { question: 'What brand is on the helmet?', type: 'brand_identifier', level: 'strong', weight: 0.9, key: 'brand' },
    { question: 'Is it full face or open face?', type: 'boolean', level: 'core', weight: 0.95, key: 'style' },
    { question: 'What sticker or mark is on it?', type: 'descriptive', level: 'strong', weight: 0.8, key: 'feature' },
    { question: 'What visor color does it have?', type: 'descriptive', level: 'supporting', weight: 0.6, key: 'detail' },
  ],
  Handbag: [
    { question: 'What color is the handbag?', type: 'color', level: 'core', weight: 1.0, key: 'color' },
    { question: 'What brand is on the handbag?', type: 'brand_identifier', level: 'strong', weight: 0.9, key: 'brand' },
    { question: 'What material is it made of?', type: 'descriptive', level: 'strong', weight: 0.8, key: 'material' },
    { question: 'How many main zip sections does it have?', type: 'numeric', level: 'supporting', weight: 0.6, key: 'count' },
    { question: 'What unique feature does it have?', type: 'descriptive', level: 'core', weight: 0.9, key: 'feature' },
  ],
  Backpack: [
    { question: 'What color is the backpack?', type: 'color', level: 'core', weight: 1.0, key: 'color' },
    { question: 'What brand is on the backpack?', type: 'brand_identifier', level: 'strong', weight: 0.9, key: 'brand' },
    { question: 'How many front pockets does it have?', type: 'numeric', level: 'supporting', weight: 0.6, key: 'count' },
    { question: 'What material is it made of?', type: 'descriptive', level: 'strong', weight: 0.8, key: 'material' },
    { question: 'What unique feature does it have?', type: 'descriptive', level: 'core', weight: 0.9, key: 'feature' },
  ],
  Laptop: [
    { question: 'What color is the laptop?', type: 'color', level: 'core', weight: 1.0, key: 'color' },
    { question: 'What brand is the laptop?', type: 'brand_identifier', level: 'core', weight: 1.0, key: 'brand' },
    { question: 'What is the screen size?', type: 'numeric', level: 'strong', weight: 0.8, key: 'count' },
    { question: 'What sticker or mark is on it?', type: 'descriptive', level: 'strong', weight: 0.8, key: 'feature' },
    { question: 'What bag or sleeve was it with?', type: 'descriptive', level: 'supporting', weight: 0.5, key: 'detail' },
  ],
  'Smart Phone': [
    { question: 'What color is the phone?', type: 'color', level: 'core', weight: 1.0, key: 'color' },
    { question: 'What brand is the phone?', type: 'brand_identifier', level: 'core', weight: 1.0, key: 'brand' },
    { question: 'What case color does it have?', type: 'descriptive', level: 'strong', weight: 0.8, key: 'material' },
    { question: 'How many rear cameras are there?', type: 'numeric', level: 'strong', weight: 0.8, key: 'count' },
    { question: 'What visible mark or wallpaper detail does it have?', type: 'descriptive', level: 'supporting', weight: 0.6, key: 'feature' },
  ],
  Key: [
    { question: 'What color key tag is attached?', type: 'color', level: 'core', weight: 1.0, key: 'color' },
    { question: 'How many keys are on the ring?', type: 'numeric', level: 'core', weight: 0.95, key: 'count' },
    { question: 'What brand or logo is on the keychain?', type: 'brand_identifier', level: 'strong', weight: 0.8, key: 'brand' },
    { question: 'What type of ring or holder is used?', type: 'descriptive', level: 'supporting', weight: 0.6, key: 'material' },
    { question: 'What unique feature does the key set have?', type: 'descriptive', level: 'strong', weight: 0.8, key: 'feature' },
  ],
  'Power Bank': [
    { question: 'What color is the power bank?', type: 'color', level: 'core', weight: 1.0, key: 'color' },
    { question: 'What brand is on the power bank?', type: 'brand_identifier', level: 'strong', weight: 0.9, key: 'brand' },
    { question: 'What capacity is printed on it?', type: 'numeric', level: 'core', weight: 0.95, key: 'count' },
    { question: 'What cable or strap was attached?', type: 'descriptive', level: 'supporting', weight: 0.6, key: 'detail' },
    { question: 'What special mark or feature does it have?', type: 'descriptive', level: 'strong', weight: 0.8, key: 'feature' },
  ],
  'Laptop/Mobile chargers & cables': [
    { question: 'What color is the charger or cable?', type: 'color', level: 'core', weight: 1.0, key: 'color' },
    { question: 'What brand is on the charger set?', type: 'brand_identifier', level: 'strong', weight: 0.9, key: 'brand' },
    { question: 'How many cables or pieces are there?', type: 'numeric', level: 'core', weight: 0.95, key: 'count' },
    { question: 'What connector type is visible?', type: 'descriptive', level: 'strong', weight: 0.8, key: 'material' },
    { question: 'What unique tie, wrap, or mark does it have?', type: 'descriptive', level: 'supporting', weight: 0.6, key: 'feature' },
  ],
  'Earbuds - Earbuds case': [
    { question: 'What color is the earbuds case?', type: 'color', level: 'core', weight: 1.0, key: 'color' },
    { question: 'What brand is on the earbuds case?', type: 'brand_identifier', level: 'core', weight: 1.0, key: 'brand' },
    { question: 'Is the case matte or glossy?', type: 'boolean', level: 'strong', weight: 0.8, key: 'material' },
    { question: 'How many earbuds were inside?', type: 'numeric', level: 'strong', weight: 0.8, key: 'count' },
    { question: 'What sticker or mark is on the case?', type: 'descriptive', level: 'supporting', weight: 0.6, key: 'feature' },
  ],
  Headphone: [
    { question: 'What color are the headphones?', type: 'color', level: 'core', weight: 1.0, key: 'color' },
    { question: 'What brand is on the headphones?', type: 'brand_identifier', level: 'core', weight: 1.0, key: 'brand' },
    { question: 'Are they wired or wireless?', type: 'boolean', level: 'strong', weight: 0.8, key: 'style' },
    { question: 'What material are the ear cushions?', type: 'descriptive', level: 'supporting', weight: 0.6, key: 'material' },
    { question: 'What unique feature or mark do they have?', type: 'descriptive', level: 'strong', weight: 0.8, key: 'feature' },
  ],
  'Student ID': [
    { question: 'What color is the lanyard or holder?', type: 'color', level: 'core', weight: 1.0, key: 'color' },
    { question: 'What institute name is on the ID?', type: 'brand_identifier', level: 'core', weight: 1.0, key: 'brand' },
    { question: 'What faculty or course is shown?', type: 'descriptive', level: 'strong', weight: 0.8, key: 'material' },
    { question: 'What year or intake is shown?', type: 'numeric', level: 'supporting', weight: 0.6, key: 'count' },
    { question: 'What unique feature does the ID have?', type: 'descriptive', level: 'strong', weight: 0.8, key: 'feature' },
  ],
};

const variants = {
  Wallet: {
    colors: ['black', 'brown', 'navy', 'gray', 'tan', 'maroon', 'dark green', 'blue', 'olive', 'charcoal'],
    brands: ['Wildcraft', 'Tommy Hilfiger', 'Fossil', 'Urban Forest', 'Polo', 'Levis', 'Nike', 'Adidas', 'Burlington', 'Tumi'],
    materials: ['leather', 'canvas', 'synthetic leather', 'fabric', 'matte leather', 'textured leather', 'nylon', 'soft leather', 'hard leather', 'suede'],
    counts: ['4', '5', '6', '7', '8', '3', '2', '9', '10', '5'],
    features: ['coin zip', 'small scratch', 'RFID tag', 'metal logo', 'inside note', 'clear ID slot', 'zip chain', 'fold mark', 'snap button', 'stitched stripe'],
    details: ['cash inside', 'bus card inside', 'receipt tucked in', 'blank note', 'no cash', 'gym card', 'library slip', 'parking ticket', 'old photo', 'membership card'],
  },
  Helmet: {
    colors: ['black', 'white', 'red', 'blue', 'yellow', 'gray', 'orange', 'green', 'silver', 'matte black'],
    brands: ['Studds', 'Vega', 'LS2', 'Steelbird', 'Axor', 'Shark', 'NHK', 'AGV', 'KYT', 'YOHE'],
    styles: ['full face', 'open face', 'full face', 'full face', 'open face', 'full face', 'open face', 'full face', 'full face', 'open face'],
    features: ['lion sticker', 'small dent', 'reflective strip', 'number 7 sticker', 'white stripe', 'side scratch', 'college sticker', 'star decal', 'plain shell', 'visor mark'],
    details: ['clear visor', 'smoke visor', 'mirror visor', 'clear visor', 'tinted visor', 'clear visor', 'smoke visor', 'blue visor', 'clear visor', 'tinted visor'],
  },
  Handbag: {
    colors: ['black', 'beige', 'pink', 'navy', 'brown'],
    brands: ['Charles & Keith', 'Guess', 'Aldo', 'Dune', 'Baggit'],
    materials: ['leather', 'synthetic leather', 'canvas', 'fabric', 'textured leather'],
    counts: ['2', '3', '1', '2', '3'],
    features: ['gold chain strap', 'front buckle', 'tassel zip', 'small flower charm', 'silver clasp'],
  },
  Backpack: {
    colors: ['black', 'blue', 'gray', 'green', 'maroon'],
    brands: ['American Tourister', 'Nike', 'Puma', 'Dell', 'HP'],
    materials: ['nylon', 'polyester', 'canvas', 'waterproof fabric', 'mesh fabric'],
    counts: ['1', '2', '2', '3', '1'],
    features: ['laptop sleeve', 'side bottle holder', 'front badge', 'rain cover', 'USB port'],
  },
  Laptop: {
    colors: ['silver', 'gray', 'black', 'blue', 'white'],
    brands: ['Dell', 'HP', 'Lenovo', 'Asus', 'Acer'],
    counts: ['14', '15.6', '13.3', '14', '15'],
    features: ['CS sticker', 'small dent', 'name sticker', 'touchpad scratch', 'blue sleeve'],
    details: ['black sleeve', 'gray sleeve', 'no sleeve', 'fabric pouch', 'laptop bag'],
  },
  'Smart Phone': {
    colors: ['black', 'blue', 'white', 'green', 'purple'],
    brands: ['Samsung', 'Apple', 'Xiaomi', 'OnePlus', 'Vivo'],
    materials: ['black case', 'clear case', 'blue case', 'silicone case', 'hard case'],
    counts: ['3', '2', '3', '2', '4'],
    features: ['cracked corner', 'anime wallpaper', 'camera protector', 'small sticker', 'ring holder'],
  },
  Key: {
    colors: ['red', 'blue', 'black', 'yellow', 'green'],
    brands: ['Toyota', 'Honda', 'Yamaha', 'Kawasaki', 'None'],
    materials: ['metal ring', 'carabiner', 'leather loop', 'plastic ring', 'steel loop'],
    counts: ['2', '3', '1', '4', '2'],
    features: ['house key + locker key', 'bike key attached', 'tiny torch', 'USB tag', 'rectangular tag'],
  },
  'Power Bank': {
    colors: ['black', 'white', 'blue', 'gray', 'red'],
    brands: ['Anker', 'Xiaomi', 'Baseus', 'Remax', 'Samsung'],
    counts: ['10000', '20000', '10000', '15000', '20000'],
    features: ['digital display', 'side scratch', 'built-in cable', 'logo sticker', 'rubber finish'],
    details: ['short cable', 'wrist strap', 'no cable', 'white cable', 'type-c cable'],
  },
  'Laptop/Mobile chargers & cables': {
    colors: ['black', 'white', 'gray', 'blue', 'red'],
    brands: ['Dell', 'HP', 'Anker', 'Samsung', 'Apple'],
    materials: ['USB-C', 'micro USB', 'lightning', 'barrel pin', 'USB-A to C'],
    counts: ['2', '1', '3', '2', '2'],
    features: ['velcro tie', 'yellow tape', 'label mark', 'cable clip', 'small knot'],
  },
  'Earbuds - Earbuds case': {
    colors: ['white', 'black', 'blue', 'pink', 'gray'],
    brands: ['Apple', 'Samsung', 'Redmi', 'JBL', 'Huawei'],
    materials: ['glossy', 'matte', 'glossy', 'matte', 'glossy'],
    counts: ['2', '2', '1', '2', '2'],
    features: ['clear cover', 'small scratch', 'cartoon sticker', 'silicone sleeve', 'keyring loop'],
  },
  Headphone: {
    colors: ['black', 'white', 'blue', 'red', 'gray'],
    brands: ['Sony', 'JBL', 'Boat', 'Skullcandy', 'Logitech'],
    styles: ['wireless', 'wired', 'wireless', 'wired', 'wireless'],
    materials: ['leatherette', 'foam', 'mesh', 'leatherette', 'foam'],
    features: ['foldable arms', 'red cable', 'left ear mark', 'gold ring', 'travel pouch'],
  },
  'Student ID': {
    colors: ['blue', 'black', 'red', 'green', 'gray'],
    brands: ['SLIIT', 'SLIIT', 'SLIIT', 'SLIIT', 'SLIIT'],
    materials: ['Computing', 'Engineering', 'Business', 'Architecture', 'Humanities'],
    counts: ['2022', '2023', '2021', '2024', '2022'],
    features: ['plastic holder', 'broken clip', 'QR sticker', 'photo faded', 'key tag attached'],
  },
};

const categoryOrder = Object.keys(countsByCategory);

function pick(list, index) {
  return list[index % list.length];
}

function buildQuestionMetadata(category) {
  return questionTemplates[category].map((item) => ({
    question: item.question,
    type: item.type,
    level: item.level,
    weight: item.weight,
  }));
}

function buildAnswers(category, variant, index) {
  return questionTemplates[category].map((item) => {
    if (item.key === 'detail' && variant.details) {
      return pick(variant.details, index);
    }
    if (item.key === 'style' && variant.styles) {
      return pick(variant.styles, index);
    }
    return pick(variant[`${item.key}s`] || variant[item.key] || ['n/a'], index);
  });
}

function buildDescription(category, answers) {
  const [a1, a2, a3, a4, a5] = answers;

  switch (category) {
    case 'Wallet':
      return `${capitalize(a1)} ${a2} wallet made of ${a3} with ${a4} visible card slots and ${a5}. ${capitalize(a5)} is clearly visible.`;
    case 'Helmet':
      return `${capitalize(a1)} ${a2} ${a3} helmet with ${a5} and ${a4}. Item looks used but intact.`;
    case 'Handbag':
      return `${capitalize(a1)} ${a2} handbag made of ${a3} with ${a4} main zip sections and ${a5}.`;
    case 'Backpack':
      return `${capitalize(a1)} ${a2} backpack made of ${a4} with ${a3} front pockets and ${a5}.`;
    case 'Laptop':
      return `${capitalize(a1)} ${a2} laptop, ${a3} inch screen, seen with ${a5} and ${a4}.`;
    case 'Smart Phone':
      return `${capitalize(a1)} ${a2} smartphone with ${a3}, ${a4} rear cameras, and ${a5}.`;
    case 'Key':
      return `Key set with ${a2} keys, ${a1} tag, ${a4}, and ${a5}. ${a3 !== 'None' ? `${a3} branding is visible.` : 'No obvious brand is visible.'}`;
    case 'Power Bank':
      return `${capitalize(a1)} ${a2} power bank marked ${a3} mAh with ${a4} and ${a5}.`;
    case 'Laptop/Mobile chargers & cables':
      return `${capitalize(a1)} ${a2} charger and cable set with ${a3} pieces, ${a4} connector, and ${a5}.`;
    case 'Earbuds - Earbuds case':
      return `${capitalize(a1)} ${a2} earbuds case with ${a3} finish, ${a4} earbud(s) inside, and ${a5}.`;
    case 'Headphone':
      return `${capitalize(a1)} ${a2} headphones with ${a3} design, ${a4} ear cushions, and ${a5}.`;
    case 'Student ID':
      return `${a2} student ID with ${a1} lanyard or holder, ${a3} faculty/course, ${a4} intake/year, and ${a5}.`;
    default:
      return `${category} with visible identifying details.`;
  }
}

function capitalize(value) {
  if (!value || typeof value !== 'string') return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildImageUrl(category, index) {
  const text = encodeURIComponent(`${category} ${index + 1}`);
  return `https://placehold.co/600x400/png?text=${text}`;
}

function buildOid(seed) {
  return crypto.createHash('md5').update(seed).digest('hex').slice(0, 24);
}

function buildPythonItemId(seed) {
  const hex = crypto.createHash('sha1').update(seed).digest('hex').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function buildVector128(seed) {
  const hash = crypto.createHash('sha512').update(seed).digest();
  const vector = [];

  for (let i = 0; i < 128; i += 1) {
    const byte = hash[i % hash.length];
    const normalized = ((byte / 255) * 2 - 1) * 4;
    vector.push(Number(normalized.toFixed(6)));
  }

  return vector;
}

function buildLocation(globalIndex) {
  const location = locationPools[globalIndex % locationPools.length];
  return [{
    location: location.location,
    floor_id: location.floor_id ?? null,
    hall_name: location.hall_name ?? null,
  }];
}

function buildCreatedAt(globalIndex) {
  const day = (globalIndex % 28) + 1;
  const hour = 8 + (globalIndex % 10);
  return new Date(Date.UTC(2026, 1, day, hour, 15, 0)).toISOString();
}

const dataset = [];
let globalIndex = 0;

for (const category of categoryOrder) {
  const total = countsByCategory[category];
  const variant = variants[category];

  for (let i = 0; i < total; i += 1) {
    const answers = buildAnswers(category, variant, i);
    const questions = questionTemplates[category].map((item) => item.question);
    const createdAt = buildCreatedAt(globalIndex);
    const itemSeed = `${category}-${i}-${createdAt}`;
    const itemId = buildOid(`found-item-${itemSeed}`);
    const createdBy = buildOid(`user-${globalIndex % founderContacts.length}`);
    const pythonItemId = buildPythonItemId(`python-${itemSeed}`);
    const location = buildLocation(globalIndex);
    const description = buildDescription(category, answers);

    dataset.push({
      _id: { $oid: itemId },
      imageUrl: buildImageUrl(category, i),
      category,
      description,
      questions,
      questionMetadata: buildQuestionMetadata(category),
      founderAnswers: answers,
      founderContact: founderContacts[globalIndex % founderContacts.length],
      found_location: location,
      status: 'available',
      createdBy: { $oid: createdBy },
      analysisMode: 'pp1',
      pythonItemId,
      faissId: globalIndex + 1000,
      faissIds: [globalIndex + 1000],
      detectedCategory: category,
      detectedDescription: description,
      detectedColor: answers[0] || null,
      vector128: buildVector128(itemSeed),
      searchable: true,
      pipelineResponse: {
        source: 'sample-generator',
        version: 1,
        matchedTemplate: category,
      },
      createdAt: { $date: createdAt },
      updatedAt: { $date: createdAt },
      __v: 0,
    });

    globalIndex += 1;
  }
}

const outputDir = path.join(__dirname, '..', '..', 'sample-data');
const outputPath = path.join(outputDir, 'found-items.sample.json');
const mongoStyleOutputPath = path.join(__dirname, '..', '..', 'findassure.founditems.sample.json');

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 2));
fs.writeFileSync(mongoStyleOutputPath, JSON.stringify(dataset, null, 2));

console.log(`Generated ${dataset.length} found items at ${outputPath}`);
console.log(`Generated Mongo-style export at ${mongoStyleOutputPath}`);
