export type ToolCategory = 'diagnosis' | 'calculator' | 'planning' | 'knowledge' | 'monitoring';

export type Tool = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: ToolCategory;
  route: string;
};

export const TOOLS: Tool[] = [
  // Diagnosis
  {
    id: 'analyzer',
    name: 'রোগ বিশ্লেষণ',
    description: 'ছবি দিয়ে ফসলের রোগ ও পোকা শনাক্ত করুন',
    icon: '🔬',
    color: '#dc2626',
    category: 'diagnosis',
    route: '/(tabs)/analyzer',
  },
  {
    id: 'disease-library',
    name: 'রোগ লাইব্রেরি',
    description: 'সব ফসলের রোগের তথ্য ও সমাধান',
    icon: '📚',
    color: '#7c3aed',
    category: 'diagnosis',
    route: '/(tools)/disease-library',
  },
  {
    id: 'pest-expert',
    name: 'কীটনাশক বিশেষজ্ঞ',
    description: 'সঠিক কীটনাশক নির্বাচন ও প্রয়োগ',
    icon: '🐛',
    color: '#b45309',
    category: 'diagnosis',
    route: '/(tools)/pesticide',
  },
  // Calculators
  {
    id: 'nutrient',
    name: 'সার হিসাব',
    description: 'ফসল ও জমির ধরন অনুযায়ী সার পরিমাণ',
    icon: '⚗️',
    color: '#0891b2',
    category: 'calculator',
    route: '/(tools)/nutrient',
  },
  {
    id: 'yield',
    name: 'ফলন হিসাব',
    description: 'প্রত্যাশিত ফলন ও আয় গণনা',
    icon: '📊',
    color: '#059669',
    category: 'calculator',
    route: '/(tools)/yield',
  },
  {
    id: 'ai-yield',
    name: 'AI ফলন পূর্বাভাস',
    description: 'কৃত্রিম বুদ্ধিমত্তা দিয়ে ফলন পূর্বানুমান',
    icon: '🤖',
    color: '#2563eb',
    category: 'calculator',
    route: '/(tools)/ai-yield',
  },
  // Planning
  {
    id: 'calendar',
    name: 'ফসল ক্যালেন্ডার',
    description: 'মৌসুম অনুযায়ী ফসলের সময়সূচি',
    icon: '📅',
    color: '#0A8A1F',
    category: 'planning',
    route: '/(tools)/calendar',
  },
  {
    id: 'task-scheduler',
    name: 'কাজের তালিকা',
    description: 'কৃষি কাজের পরিকল্পনা ও রিমাইন্ডার',
    icon: '✅',
    color: '#6d28d9',
    category: 'planning',
    route: '/(tools)/tasks',
  },
  {
    id: 'field-map',
    name: 'মাঠ মানচিত্র',
    description: 'আপনার জমির মানচিত্র তৈরি করুন',
    icon: '🗺️',
    color: '#065f46',
    category: 'monitoring',
    route: '/(tools)/field-map',
  },
  // Knowledge
  {
    id: 'soil-guide',
    name: 'মাটি গাইড',
    description: 'মাটির ধরন, পিএইচ ও উর্বরতা ব্যবস্থাপনা',
    icon: '🌍',
    color: '#92400e',
    category: 'knowledge',
    route: '/(tools)/soil-guide',
  },
  {
    id: 'biocontrol',
    name: 'জৈব নিয়ন্ত্রণ',
    description: 'পরিবেশবান্ধব পোকামাকড় দমন পদ্ধতি',
    icon: '🌿',
    color: '#166534',
    category: 'knowledge',
    route: '/(tools)/biocontrol',
  },
  {
    id: 'leaf-color',
    name: 'পাতার রঙ চার্ট',
    description: 'পাতার রঙ দেখে পুষ্টির ঘাটতি নির্ণয়',
    icon: '🍃',
    color: '#15803d',
    category: 'diagnosis',
    route: '/(tools)/leaf-color',
  },
  {
    id: 'learning',
    name: 'শিক্ষা কেন্দ্র',
    description: 'কৃষি প্রশিক্ষণ, ভিডিও ও কোর্স',
    icon: '🎓',
    color: '#1d4ed8',
    category: 'knowledge',
    route: '/(tools)/learning',
  },
  {
    id: 'flashcards',
    name: 'ফ্ল্যাশকার্ড',
    description: 'কৃষি জ্ঞান পরীক্ষার কার্ড',
    icon: '🃏',
    color: '#7c3aed',
    category: 'knowledge',
    route: '/(tools)/flashcards',
  },
  // Monitoring
  {
    id: 'weather',
    name: 'আবহাওয়া',
    description: 'বর্তমান আবহাওয়া ও কৃষি পরামর্শ',
    icon: '🌤️',
    color: '#0369a1',
    category: 'monitoring',
    route: '/(tools)/weather',
  },
  {
    id: 'field-monitoring',
    name: 'মাঠ পর্যবেক্ষণ',
    description: 'ফসলের অবস্থা ট্র্যাক করুন',
    icon: '👁️',
    color: '#0f766e',
    category: 'monitoring',
    route: '/(tools)/field-monitoring',
  },
];
