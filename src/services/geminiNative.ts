/**
 * Gemini AI service adapted for React Native / Expo
 * Uses process.env via expo-constants instead of import.meta.env
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Get API key from expo-constants (set via app.json extra or env)
function getApiKey(): string {
  // In Expo, use Constants.expoConfig.extra or process.env
  const key =
    (process.env.EXPO_PUBLIC_GEMINI_API_KEY as string) ||
    (process.env.GEMINI_API_KEY as string) ||
    '';
  if (!key) {
    console.warn('⚠️ EXPO_PUBLIC_GEMINI_API_KEY not set. Set it in .env');
  }
  return key;
}

type GeminiPart = { text: string } | { inline_data: { mime_type: string; data: string } };
type GeminiContent = { role: string; parts: GeminiPart[] };

async function callGemini(contents: GeminiContent[], systemInstruction?: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('API key missing. Set EXPO_PUBLIC_GEMINI_API_KEY in your .env file.');

  const body: any = {
    contents,
    generationConfig: { maxOutputTokens: 1200, temperature: 0.4 },
  };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'কোনো উত্তর পাওয়া যায়নি।';
}

/**
 * Analyze crop disease from base64 image
 */
export async function analyzeImageWithGemini(
  imageBase64: string,
  lang: 'bn' | 'en' = 'bn'
): Promise<{
  diagnosis: string;
  category: string;
  confidence: number;
  advisory: string;
  fullText: string;
}> {
  const systemPrompt = lang === 'bn'
    ? `আপনি বাংলাদেশের একজন বিশেষজ্ঞ কৃষি রোগ বিশ্লেষক। ছবি বিশ্লেষণ করে JSON ফরম্যাটে উত্তর দিন।`
    : `You are an expert agricultural disease analyst for Bangladesh. Analyze the image and respond in JSON format.`;

  const prompt = lang === 'bn'
    ? `এই ফসলের ছবিটি বিশ্লেষণ করুন এবং শুধুমাত্র নিচের JSON ফরম্যাটে উত্তর দিন (অন্য কিছু লিখবেন না):
{
  "diagnosis": "রোগের নাম বা সমস্যা",
  "category": "Disease|Pest|Deficiency|Other",
  "confidence": 85,
  "advisory": "বিস্তারিত পরামর্শ ও সমাধান",
  "fullText": "সম্পূর্ণ বিশ্লেষণ"
}`
    : `Analyze this crop image and respond ONLY in this JSON format (nothing else):
{
  "diagnosis": "Disease name or issue",
  "category": "Disease|Pest|Deficiency|Other",
  "confidence": 85,
  "advisory": "Detailed advice and solution",
  "fullText": "Complete analysis"
}`;

  const contents: GeminiContent[] = [{
    role: 'user',
    parts: [
      { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
      { text: prompt },
    ],
  }];

  const raw = await callGemini(contents, systemPrompt);

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        diagnosis: parsed.diagnosis || 'অজানা',
        category: parsed.category || 'Other',
        confidence: Math.min(100, Math.max(0, parsed.confidence || 70)),
        advisory: parsed.advisory || raw,
        fullText: parsed.fullText || raw,
      };
    }
  } catch {
    // fallback
  }

  return {
    diagnosis: lang === 'bn' ? 'বিশ্লেষণ ফলাফল' : 'Analysis Result',
    category: 'Other',
    confidence: 70,
    advisory: raw,
    fullText: raw,
  };
}

/**
 * Chat with Gemini for agricultural Q&A
 */
export async function chatWithGemini(
  message: string,
  history: { role: string; text: string }[] = []
): Promise<string> {
  const systemPrompt = `আপনি কৃষি AI - বাংলাদেশের কৃষকদের জন্য একজন বিশেষজ্ঞ কৃষি পরামর্শদাতা।
আপনি বাংলা ও ইংরেজি উভয় ভাষায় সাহায্য করতে পারেন।
সংক্ষিপ্ত, সহজ ভাষায় ব্যবহারিক পরামর্শ দিন।
BARI, BRRI, DAE-এর সুপারিশ অনুসরণ করুন।`;

  const contents: GeminiContent[] = [
    ...history.slice(-8).map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];

  return callGemini(contents, systemPrompt);
}

/**
 * Search agricultural information
 */
export async function searchAgriInfo(
  query: string
): Promise<{ title: string; content: string; source?: string }[]> {
  const prompt = `কৃষি বিষয়ক প্রশ্ন: "${query}"
  
নিচের JSON ফরম্যাটে ৩-৫টি তথ্যপূর্ণ ফলাফল দিন (শুধু JSON, অন্য কিছু নয়):
[
  {
    "title": "তথ্যের শিরোনাম",
    "content": "বিস্তারিত তথ্য (২-৩ বাক্য)",
    "source": "BARI/BRRI/DAE"
  }
]`;

  const contents: GeminiContent[] = [{ role: 'user', parts: [{ text: prompt }] }];
  const raw = await callGemini(contents);

  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {}

  return [{ title: 'অনুসন্ধান ফলাফল', content: raw }];
}

/**
 * Get weather-based agricultural advice
 */
export async function getWeatherAdvice(
  district: string,
  condition: string,
  lang: 'bn' | 'en' = 'bn'
): Promise<string> {
  const prompt = lang === 'bn'
    ? `${district} জেলায় ${condition} আবহাওয়ায় কৃষকদের জন্য ৩টি জরুরি পরামর্শ দিন।`
    : `Give 3 urgent agricultural tips for ${condition} weather in ${district} district.`;

  const contents: GeminiContent[] = [{ role: 'user', parts: [{ text: prompt }] }];
  return callGemini(contents);
}
