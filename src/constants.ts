export const COMMODITIES_DATA = [
  { id: 1, name: 'চাল (সরু)', category: 'শস্য', unit: 'কেজি', wholesale: [68, 72], retail: [75, 80], trend: 'up', change: '+২%' },
  { id: 2, name: 'চাল (মাঝারি)', category: 'শস্য', unit: 'কেজি', wholesale: [58, 62], retail: [65, 68], trend: 'stable', change: '০%' },
  { id: 3, name: 'আলু (ডায়মন্ড)', category: 'সবজি', unit: 'কেজি', wholesale: [38, 42], retail: [48, 52], trend: 'down', change: '-৫%' },
  { id: 4, name: 'পেঁয়াজ (দেশি)', category: 'মসলা', unit: 'কেজি', wholesale: [85, 95], retail: [105, 115], trend: 'up', change: '+১২%' },
  { id: 5, name: 'কাঁচামরিচ', category: 'সবজি', unit: 'কেজি', wholesale: [120, 140], retail: [160, 180], trend: 'up', change: '+১৫%' },
  { id: 6, name: 'মসুর ডাল', category: 'ডাল', unit: 'কেজি', wholesale: [130, 135], retail: [145, 150], trend: 'stable', change: '০%' },
  { id: 7, name: 'সয়াবিন তেল', category: 'তেল', unit: 'লিটার', wholesale: [155, 160], retail: [165, 167], trend: 'down', change: '-১%' },
  { id: 8, name: 'ডিম (ফার্ম)', category: 'পোল্ট্রি', unit: '১২ টি', wholesale: [135, 140], retail: [150, 155], trend: 'up', change: '+৩%' },
  { id: 9, name: 'গরুর মাংস', category: 'মাংস', unit: 'কেজি', wholesale: [700, 720], retail: [750, 780], trend: 'stable', change: '০%' },
  { id: 10, name: 'রসুন (দেশি)', category: 'মসলা', unit: 'কেজি', wholesale: [180, 200], retail: [220, 240], trend: 'up', change: '+৮%' },
  { id: 11, name: 'টমেটো', category: 'সবজি', unit: 'কেজি', wholesale: [60, 70], retail: [80, 90], trend: 'down', change: '-১০%' },
  { id: 12, name: 'চিনি', category: 'অন্যান্য', unit: 'কেজি', wholesale: [125, 130], retail: [135, 140], trend: 'stable', change: '০%' },
];

export const CROP_CATEGORIES = [
  { id: 'cereals', label: 'দানা ফসল', icon: '🌾' },
  { id: 'oilseeds', label: 'তৈলবীজ', icon: '🌻' },
  { id: 'pulses', label: 'ডাল ফসল', icon: '🍲' },
  { id: 'fruits', label: 'ফল', icon: '🍎' },
  { id: 'vegetables', label: 'সবজি ফসল', icon: '🥦' },
  { id: 'spices', label: 'মসলা', icon: '🌶️' },
];

export const AGRI_SEASONS = [
  {
    id: 'rabi', name: 'রবি (শীতকাল)',
    months: [10, 11, 0, 1, 2],
    desc: 'প্রধান ফসল: বোরো ধান, গম, আলু, সরিষা, শীতকালীন সবজি।',
  },
  {
    id: 'kharif1', name: 'খরিফ-১ (গ্রীষ্মকাল)',
    months: [3, 4, 5, 6],
    desc: 'প্রধান ফসল: আউশ ধান, পাট, ভুট্টা, তিল।',
  },
  {
    id: 'kharif2', name: 'খরিফ-২ (বর্ষাকাল)',
    months: [7, 8, 9],
    desc: 'প্রধান ফসল: আমন ধান।',
  },
];

export const CROPS_BY_CATEGORY: Record<string, string[]> = {
  cereals: ['ধান', 'গম', 'ভুট্টা', 'যব', 'জোয়ার', 'বাজরা', 'কাউন'],
  oilseeds: ['সরিষা', 'তিল', 'চীনাবাদাম', 'সয়াবিন', 'সূর্যমুখী', 'তিসি'],
  pulses: ['মসুর', 'মুগ', 'মাষকলাই', 'ছোলা', 'খেসারি', 'অড়হর', 'মটর'],
  fruits: ['আম', 'কাঁঠাল', 'কলা', 'পেঁপে', 'পেয়ারা', 'লিচু', 'নারিকেল', 'আনারস', 'তরমুজ', 'আমলকি'],
  vegetables: ['আলু', 'টমেটো', 'বেগুন', 'পেঁয়াজ', 'রসুন', 'মরিচ', 'বাঁধাকপি', 'ফুলকপি', 'লাউ', 'কুমড়া', 'শিম', 'করলা', 'ঢেঁড়স'],
  spices: ['আদা', 'হলুদ', 'ধনিয়া', 'জিরা', 'মেথি', 'কালিজিরা', 'দারুচিনি'],
};
