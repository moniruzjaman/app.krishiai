export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  route: string;
}

export const TOOLS: Tool[] = [
  // Diagnosis & Analysis
  { id: 'analyzer', name: 'রোগ বিশ্লেষক', description: 'AI দিয়ে ছবি থেকে রোগ শনাক্ত করুন', icon: '🔬', color: '#0A8A1F', category: 'diagnosis', route: '/(tabs)/analyzer' },
  { id: 'disease-library', name: 'রোগ লাইব্রেরি', description: 'ফসলের রোগ ও পোকার তথ্যভাণ্ডার', icon: '📚', color: '#7c3aed', category: 'diagnosis', route: '/(tools)/disease-library' },
  { id: 'leaf-color', name: 'পাতার রঙ চার্ট', description: 'LCC দিয়ে নাইট্রোজেন ব্যবস্থাপনা', icon: '🍃', color: '#15803d', category: 'diagnosis', route: '/(tools)/leaf-color' },
  { id: 'field-monitoring', name: 'মাঠ পর্যবেক্ষণ', description: 'AI দিয়ে মাঠের স্বাস্থ্য পরীক্ষা করুন', icon: '🛰️', color: '#1d4ed8', category: 'diagnosis', route: '/(tools)/field-monitoring' },
  // Soil & Nutrients
  { id: 'soil-expert', name: 'মৃত্তিকা বিশেষজ্ঞ', description: 'মাটি পরীক্ষা ও সুপারিশ', icon: '🌍', color: '#92400e', category: 'soil', route: '/(tools)/soil-expert' },
  { id: 'soil-guide', name: 'মাটি পরীক্ষা গাইড', description: 'নমুনা সংগ্রহ ও ল্যাব তথ্য', icon: '🏺', color: '#78350f', category: 'soil', route: '/(tools)/soil-guide' },
  { id: 'nutrient', name: 'সার ক্যালকুলেটর', description: 'ফসল অনুযায়ী সারের হিসাব', icon: '⚗️', color: '#059669', category: 'soil', route: '/(tools)/nutrient' },
  // Pest & Protection
  { id: 'pesticide', name: 'কীটনাশক বিশেষজ্ঞ', description: 'DAE অনুমোদিত কীটনাশক পরামর্শ', icon: '🐛', color: '#b45309', category: 'pest', route: '/(tools)/pesticide' },
  { id: 'biocontrol', name: 'জৈব বালাই দমন', description: 'প্রাকৃতিক পোকা ও রোগ দমন', icon: '🐞', color: '#166534', category: 'pest', route: '/(tools)/biocontrol' },
  { id: 'plant-defense', name: 'উদ্ভিদ প্রতিরোধ', description: 'Brix ও প্রতিরোধ ক্ষমতার পিরামিড', icon: '🛡️', color: '#15803d', category: 'pest', route: '/(tools)/plant-defense' },
  // Planning & Yield
  { id: 'yield', name: 'ফলন হিসাব', description: 'স্যাম্পল কাটিং ও ফলন গণনা', icon: '📊', color: '#059669', category: 'planning', route: '/(tools)/yield' },
  { id: 'ai-yield', name: 'AI ফলন পূর্বাভাস', description: 'AI দিয়ে সম্ভাব্য ফলন জানুন', icon: '🤖', color: '#0369a1', category: 'planning', route: '/(tools)/ai-yield' },
  { id: 'calendar', name: 'চাষ পঞ্জিকা', description: 'মৌসুমী ফসল চাষের সময়সূচি', icon: '📅', color: '#d97706', category: 'planning', route: '/(tools)/calendar' },
  { id: 'tasks', name: 'কাজের তালিকা', description: 'মাঠের কাজ ট্র্যাক করুন', icon: '📋', color: '#1e40af', category: 'planning', route: '/(tools)/tasks' },
  // Weather
  { id: 'weather', name: 'আবহাওয়া', description: 'রিয়েল-টাইম আবহাওয়া ও পরামর্শ', icon: '🌤️', color: '#0284c7', category: 'weather', route: '/(tools)/weather' },
  // Learning
  { id: 'flashcards', name: 'ফ্ল্যাশকার্ড', description: 'AI দিয়ে কৃষি বিষয় শিখুন', icon: '🃏', color: '#7c3aed', category: 'learning', route: '/(tools)/flashcards' },
  { id: 'podcast', name: 'কৃষি পডকাস্ট', description: 'AI কৃষি পডকাস্ট শুনুন', icon: '🎙️', color: '#7e22ce', category: 'learning', route: '/(tools)/podcast' },
  { id: 'chat', name: 'AI চ্যাট', description: 'যেকোনো কৃষি প্রশ্নের উত্তর', icon: '💬', color: '#0A8A1F', category: 'learning', route: '/(tabs)/chat' },
];

export const TOOL_CATEGORIES = [
  { id: 'all', label: 'সব', icon: '🔧' },
  { id: 'diagnosis', label: 'রোগ নির্ণয়', icon: '🔬' },
  { id: 'soil', label: 'মাটি', icon: '🌍' },
  { id: 'pest', label: 'বালাই দমন', icon: '🐛' },
  { id: 'planning', label: 'পরিকল্পনা', icon: '📅' },
  { id: 'weather', label: 'আবহাওয়া', icon: '🌤️' },
  { id: 'learning', label: 'শিক্ষা', icon: '📚' },
];
