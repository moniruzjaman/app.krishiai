/**
 * Krishi AI - Hybrid Model Service (Expo/React Native)
 *
 * Cascade strategy (mirrors CABI diagnosis app):
 *   1. Gemini 2.0 Flash (premium, vision)          ← primary
 *   2. Gemini 1.5 Flash via OpenRouter (free tier)  ← fallback 1
 *   3. Llama 3.1 8B via OpenRouter (free tier)      ← fallback 2
 *   4. Rule-based analyzer (offline, no API)        ← fallback 3
 *   5. Generic helpful message                      ← last resort
 *
 * Environment keys (in .env):
 *   EXPO_PUBLIC_GEMINI_API_KEY      — Gemini direct API
 *   EXPO_PUBLIC_OPENROUTER_API_KEY  — OpenRouter (free + paid models)
 */

import { getGeminiKey, getOpenRouterKey } from './apiKeys';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ModelProvider = 'gemini' | 'openrouter';
export type ModelTier = 'premium' | 'free';

export interface AIModel {
  id: string;
  name: string;
  provider: ModelProvider;
  tier: ModelTier;
  supportsVision: boolean;
  banglaCapable: boolean;
  openRouterId?: string; // full path for openrouter e.g. "google/gemini-flash-1.5"
}

export interface AnalysisResult {
  diagnosis: string;
  category: 'Pest' | 'Disease' | 'Deficiency' | 'Other';
  confidence: number;
  advisory: string;
  fullText: string;
  officialSource: string;
  modelUsed: string;
  tier: ModelTier | 'rule-based';
}

// ─── Model Registry ───────────────────────────────────────────────────────────

export const MODELS: Record<string, AIModel> = {
  'gemini-2.0-flash': {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'gemini',
    tier: 'premium',
    supportsVision: true,
    banglaCapable: true,
  },
  'gemini-1.5-flash': {
    id: 'google/gemini-flash-1.5',
    name: 'Gemini 1.5 Flash (Free)',
    provider: 'openrouter',
    tier: 'free',
    supportsVision: true,
    banglaCapable: true,
    openRouterId: 'google/gemini-flash-1.5',
  },
  'llama-3.1-8b': {
    id: 'meta-llama/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B (Free)',
    provider: 'openrouter',
    tier: 'free',
    supportsVision: false,
    banglaCapable: true,
    openRouterId: 'meta-llama/llama-3.1-8b-instruct:free',
  },
  'mistral-7b': {
    id: 'mistralai/mistral-7b-instruct',
    name: 'Mistral 7B (Free)',
    provider: 'openrouter',
    tier: 'free',
    supportsVision: false,
    banglaCapable: true,
    openRouterId: 'mistralai/mistral-7b-instruct:free',
  },
};

// ─── API Key helpers ──────────────────────────────────────────────────────────
// (resolved via ./apiKeys.ts)

// ─── Prompts (three tiers, matching the original modelService.ts) ─────────────

function getPremiumPrompt(cropFamily: string, lang: string, query?: string): string {
  return `Role: Senior Scientific Officer (Plant Pathology / Soil Science / Entomology) at BARI/BRRI/DAE, Bangladesh.
Task: Precisely identify Pests, Diseases, or Nutrient Deficiencies in the crop image.

STRICT GROUNDING RULES:
1. Mandatory Primary Sources: dae.gov.bd, bari.gov.bd, brri.gov.bd, ais.gov.bd, barc.gov.bd
2. Pest/Disease Protocols: Follow "Krishoker Janala" (Plant Doctor) guidelines
3. Nutrient Deficiencies: Strictly follow BARC Fertilizer Recommendation Guide 2024

Crop Context: ${cropFamily}. Observation: ${query || 'Conduct full scientific audit'}.
Language: ${lang === 'bn' ? 'Bangla' : 'English'}.

OUTPUT FORMAT:
- DIAGNOSIS: [Official Name]
- CATEGORY: [Pest / Disease / Deficiency / Other]
- CONFIDENCE: [Score 0-100]
- AUTHENTIC SOURCE: [Citing BARI/BRRI/DAE]
- MANAGEMENT PROTOCOL: [Practical steps with local product names]
- TECHNICAL SUMMARY: [2-3 sentences]`;
}

function getFreeTierPrompt(cropFamily: string, lang: string, query?: string): string {
  return `You are a senior agricultural officer at BARI, Bangladesh. Analyze this crop condition.
Use only official Bangladesh government sources (dae.gov.bd, bari.gov.bd, brri.gov.bd, barc.gov.bd).
Respond in ${lang === 'bn' ? 'Bangla' : 'English'} with simple language for farmers.
Keep response under 200 words. Focus on most common issues. Provide practical solutions.

Crop: ${cropFamily}. Observation: ${query || 'Full audit'}.

OUTPUT FORMAT:
- DIAGNOSIS: [Name]
- CATEGORY: [Pest / Disease / Deficiency / Other]
- CONFIDENCE: [0-100]
- MANAGEMENT: [Simple steps]
- AUTHENTIC SOURCE: [DAE/BARI/BRRI]`;
}

function getTextOnlyPrompt(cropFamily: string, lang: string, symptoms?: string): string {
  return `You are a Bangladesh agricultural expert. A farmer describes crop symptoms.
Based on the description, provide the most likely diagnosis.
Crop: ${cropFamily}. Symptoms described: ${symptoms || 'general issues'}.
Respond in ${lang === 'bn' ? 'Bangla' : 'English'}.
Format:
- DIAGNOSIS: [Name]
- CATEGORY: [Pest / Disease / Deficiency / Other]
- CONFIDENCE: [0-100]
- MANAGEMENT: [Steps]
- AUTHENTIC SOURCE: [DAE/BARI/BRRI]`;
}

// ─── Response Parser ──────────────────────────────────────────────────────────

function parseAnalysisText(
  text: string,
  modelName: string,
  tier: ModelTier | 'rule-based',
): AnalysisResult {
  const diagnosis =
    text.match(/DIAGNOSIS:\s*(.*)/i)?.[1]?.trim() ||
    text.match(/রোগ:\s*(.*)/i)?.[1]?.trim() ||
    'Unknown Condition';

  const categoryRaw = text.match(/CATEGORY:\s*(Pest|Disease|Deficiency|Other)/i)?.[1];
  const category = (categoryRaw as AnalysisResult['category']) || 'Other';

  const confidence = Math.min(
    100,
    parseInt(text.match(/CONFIDENCE:\s*(\d+)/i)?.[1] || '65', 10),
  );

  const advisory =
    text.match(/MANAGEMENT(?:\s*PROTOCOL)?:\s*([\s\S]*?)(?=\n-\s+[A-Z]|$)/i)?.[1]?.trim() ||
    text.match(/MANAGEMENT:\s*([\s\S]*?)(?=\n-|$)/i)?.[1]?.trim() ||
    'স্থানীয় কৃষি সম্প্রসারণ অফিসের সাথে যোগাযোগ করুন।';

  const officialSource =
    text.match(/AUTHENTIC SOURCE:\s*(.*)/i)?.[1]?.trim() ||
    'Bangladesh Agricultural Research Sources';

  return {
    diagnosis,
    category,
    confidence,
    advisory,
    fullText: text,
    officialSource,
    modelUsed: modelName,
    tier,
  };
}

// ─── Gemini Direct API ────────────────────────────────────────────────────────

async function analyzeWithGemini(
  imageBase64: string,
  mimeType: string,
  cropFamily: string,
  lang: string,
  query?: string,
): Promise<AnalysisResult> {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error('Gemini API key not configured');

  const prompt = getPremiumPrompt(cropFamily, lang, query);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: imageBase64 } },
            { text: `Crop Context: ${cropFamily}. ${query || 'Conduct full scientific audit.'}` },
          ],
        }],
        system_instruction: { parts: [{ text: prompt }] },
        generationConfig: { maxOutputTokens: 1000, temperature: 0.3 },
      }),
    },
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `Gemini error ${res.status}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!text) throw new Error('Empty response from Gemini');

  const result = parseAnalysisText(text, 'Gemini 2.0 Flash', 'premium');

  // Validate confidence - if too low, we'll cascade to next model
  if (result.confidence < 45) throw new Error(`Low confidence: ${result.confidence}`);
  return result;
}

// ─── OpenRouter API (free vision + text models) ───────────────────────────────

async function analyzeWithOpenRouter(
  model: AIModel,
  imageBase64: string | null,
  mimeType: string,
  cropFamily: string,
  lang: string,
  query?: string,
): Promise<AnalysisResult> {
  const apiKey = getOpenRouterKey();
  if (!apiKey) throw new Error('OpenRouter API key not configured');

  const isVision = model.supportsVision && imageBase64;
  const prompt = isVision
    ? getFreeTierPrompt(cropFamily, lang, query)
    : getTextOnlyPrompt(cropFamily, lang, query);

  const userContent = isVision
    ? [
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
        { type: 'text', text: `Crop: ${cropFamily}. ${query || 'Full audit.'}` },
      ]
    : `Crop: ${cropFamily}. Symptoms/query: ${query || 'general crop health issue'}. Provide diagnosis.`;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://krishiai.app',
      'X-Title': 'Krishi AI',
    },
    body: JSON.stringify({
      model: model.openRouterId || model.id,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: userContent },
      ],
      max_tokens: 800,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenRouter error ${res.status}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('Empty response from OpenRouter');

  return parseAnalysisText(text, model.name, model.tier);
}

// ─── Rule-Based Fallback (offline, no API) ────────────────────────────────────

const RULE_DB: Record<string, Record<string, { diagnosis: string; category: AnalysisResult['category']; advisory: string; source: string }>> = {
  rice: {
    yellowing: { diagnosis: 'Brown Plant Hopper (BPH) / নাইট্রোজেন ঘাটতি', category: 'Pest', advisory: 'নিম তেল ৫মিলি/লিটার পানিতে স্প্রে করুন। ইউরিয়া ৫০ কেজি/হেক্টর প্রয়োগ করুন।', source: 'DAE Krishi Janala Guide 2024' },
    spots: { diagnosis: 'Leaf Blast Disease (ব্লাস্ট রোগ)', category: 'Disease', advisory: 'কারবেনডাজিম ১গ্রাম/লিটার পানিতে স্প্রে করুন। BRRI dhan29 জাত ব্যবহার করুন।', source: 'BRRI Rice Disease Management Manual' },
    stunted: { diagnosis: 'Zinc Deficiency (জিংক ঘাটতি)', category: 'Deficiency', advisory: 'জিংক সালফেট ১০ কেজি/হেক্টর প্রয়োগ করুন।', source: 'BARC Fertilizer Recommendation Guide 2024' },
    blight: { diagnosis: 'Bacterial Blight (ব্যাকটেরিয়াল ব্লাইট)', category: 'Disease', advisory: 'কপার অক্সিক্লোরাইড ২গ্রাম/লিটার পানিতে স্প্রে করুন।', source: 'DAE Plant Disease Guide' },
  },
  wheat: {
    stripes: { diagnosis: 'Stripe Rust (স্ট্রাইপ রাস্ট)', category: 'Disease', advisory: 'টেবুকোনাজোল ০.৫গ্রাম/লিটার স্প্রে করুন। BARI Gom 28 জাত ব্যবহার করুন।', source: 'BARI Wheat Disease Guide' },
    yellowing: { diagnosis: 'Iron Deficiency / Stripe Rust', category: 'Deficiency', advisory: 'ফেরাস সালফেট ৫গ্রাম/লিটার ফোলিয়ার স্প্রে করুন।', source: 'BARC Fertilizer Guide' },
  },
  potato: {
    blight: { diagnosis: 'Late Blight (পাতা ঝলসানো রোগ)', category: 'Disease', advisory: 'রিডোমিল গোল্ড ২গ্রাম/লিটার স্প্রে করুন। জমিতে পানি নিষ্কাশন নিশ্চিত করুন।', source: 'BARI Potato Disease Guide' },
    yellowing: { diagnosis: 'Potato Leaf Roll Virus', category: 'Disease', advisory: 'আক্রান্ত গাছ সরিয়ে ফেলুন। রোগমুক্ত বীজ আলু ব্যবহার করুন।', source: 'DAE Potato Management Guide' },
  },
  general: {
    yellowing: { diagnosis: 'Nitrogen Deficiency (নাইট্রোজেন ঘাটতি)', category: 'Deficiency', advisory: 'ইউরিয়া ৫০ কেজি/হেক্টর প্রয়োগ করুন। জৈব সার ব্যবহার করুন।', source: 'BARC Fertilizer Recommendation Guide 2024' },
    spots: { diagnosis: 'Fungal Leaf Spot (ছত্রাকজনিত পাতার দাগ)', category: 'Disease', advisory: 'কারবেনডাজিম বা ম্যানকোজেব ২গ্রাম/লিটার পানিতে স্প্রে করুন।', source: 'DAE Plant Protection Guide' },
    wilting: { diagnosis: 'Root Rot / Water Stress', category: 'Disease', advisory: 'জমির পানি নিষ্কাশন নিশ্চিত করুন। ট্রাইকোডার্মা মাটিতে প্রয়োগ করুন।', source: 'BARI Agricultural Guide' },
    insects: { diagnosis: 'Pest Infestation (পোকার আক্রমণ)', category: 'Pest', advisory: 'নিম তেল ৫মিলি/লিটার পানিতে স্প্রে করুন। আলোক ফাঁদ ব্যবহার করুন।', source: 'DAE IPM Guidelines' },
  },
};

function getRuleBasedResult(cropFamily: string, query?: string, lang: string = 'bn'): AnalysisResult {
  const crop = cropFamily.toLowerCase().replace(/[^a-z]/g, '') || 'general';
  const queryLower = (query || '').toLowerCase();

  // Try to match symptoms from query
  const matchKeys = ['yellowing', 'spots', 'stunted', 'blight', 'stripes', 'wilting', 'insects'];
  let matchedKey = matchKeys.find(k => queryLower.includes(k)) || 'yellowing';

  const db = RULE_DB[crop] || RULE_DB.general;
  const match = db[matchedKey] || db.yellowing || Object.values(RULE_DB.general)[0];

  return {
    diagnosis: match.diagnosis,
    category: match.category,
    confidence: 55,
    advisory: match.advisory,
    fullText: `[Rule-Based Analysis]\n${match.diagnosis}\n\n${match.advisory}\n\nSource: ${match.source}`,
    officialSource: match.source,
    modelUsed: 'Rule-Based Expert System',
    tier: 'rule-based',
  };
}

// ─── Main Hybrid Analyzer ─────────────────────────────────────────────────────

export interface AnalysisOptions {
  imageBase64?: string;
  mimeType?: string;
  cropFamily?: string;
  query?: string;
  lang?: 'bn' | 'en';
  budget?: 'free' | 'premium';
}

export interface HybridAnalysisResult extends AnalysisResult {
  attemptLog: { model: string; status: 'success' | 'failed'; reason?: string }[];
}

export async function analyzeWithHybridModels(
  options: AnalysisOptions,
): Promise<HybridAnalysisResult> {
  const {
    imageBase64,
    mimeType = 'image/jpeg',
    cropFamily = 'General',
    query,
    lang = 'bn',
    budget = 'free',
  } = options;

  const log: HybridAnalysisResult['attemptLog'] = [];

  // ── Step 1: Gemini 2.0 Flash (premium, best vision) ──
  if (imageBase64 && getGeminiKey()) {
    try {
      console.log('[HybridAnalyzer] Trying Gemini 2.0 Flash (premium)...');
      const result = await analyzeWithGemini(imageBase64, mimeType, cropFamily, lang, query);
      log.push({ model: 'Gemini 2.0 Flash', status: 'success' });
      return { ...result, attemptLog: log };
    } catch (err: any) {
      console.warn('[HybridAnalyzer] Gemini failed:', err.message);
      log.push({ model: 'Gemini 2.0 Flash', status: 'failed', reason: err.message });
    }
  }

  // ── Step 2: Gemini 1.5 Flash via OpenRouter (free, vision) ──
  if (imageBase64 && getOpenRouterKey()) {
    try {
      console.log('[HybridAnalyzer] Trying Gemini 1.5 Flash via OpenRouter (free)...');
      const result = await analyzeWithOpenRouter(
        MODELS['gemini-1.5-flash'],
        imageBase64,
        mimeType,
        cropFamily,
        lang,
        query,
      );
      log.push({ model: 'Gemini 1.5 Flash (OpenRouter)', status: 'success' });
      return { ...result, attemptLog: log };
    } catch (err: any) {
      console.warn('[HybridAnalyzer] OpenRouter Gemini failed:', err.message);
      log.push({ model: 'Gemini 1.5 Flash (OpenRouter)', status: 'failed', reason: err.message });
    }
  }

  // ── Step 3: Llama 3.1 8B via OpenRouter (free, text-only fallback) ──
  if (getOpenRouterKey()) {
    try {
      console.log('[HybridAnalyzer] Trying Llama 3.1 8B via OpenRouter (free, text-only)...');
      const result = await analyzeWithOpenRouter(
        MODELS['llama-3.1-8b'],
        null, // no image - text description only
        mimeType,
        cropFamily,
        lang,
        query,
      );
      log.push({ model: 'Llama 3.1 8B (OpenRouter)', status: 'success' });
      return { ...result, attemptLog: log };
    } catch (err: any) {
      console.warn('[HybridAnalyzer] Llama fallback failed:', err.message);
      log.push({ model: 'Llama 3.1 8B (OpenRouter)', status: 'failed', reason: err.message });
    }
  }

  // ── Step 4: Rule-based offline analyzer ──
  console.log('[HybridAnalyzer] All API models failed. Using rule-based system...');
  log.push({ model: 'Rule-Based System', status: 'success' });
  const ruleResult = getRuleBasedResult(cropFamily, query, lang);
  return { ...ruleResult, attemptLog: log };
}

// ─── Chat hybrid: Gemini → OpenRouter free → Rule-based tip ──────────────────

export async function chatWithHybridModels(
  message: string,
  history: { role: string; text: string }[] = [],
  lang: 'bn' | 'en' = 'bn',
): Promise<{ text: string; modelUsed: string }> {
  const systemPrompt = `আপনি কৃষি AI - বাংলাদেশের কৃষকদের জন্য বিশেষজ্ঞ কৃষি পরামর্শদাতা।
BARI, BRRI, DAE, BARC-এর সুপারিশ অনুসরণ করুন।
সংক্ষিপ্ত, সহজ ভাষায় ব্যবহারিক পরামর্শ দিন।`;

  // Step 1: Gemini
  if (getGeminiKey()) {
    try {
      const contents = [
        ...history.slice(-6).map(h => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }],
        })),
        { role: 'user', parts: [{ text: message }] },
      ];

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${getGeminiKey()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            system_instruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { maxOutputTokens: 800, temperature: 0.4 },
          }),
        },
      );
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) return { text, modelUsed: 'Gemini 2.0 Flash' };
      }
    } catch {}
  }

  // Step 2: OpenRouter free model
  if (getOpenRouterKey()) {
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-6).map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.text })),
        { role: 'user', content: message },
      ];

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getOpenRouterKey()}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://krishiai.app',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct:free',
          messages,
          max_tokens: 600,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || '';
        if (text) return { text, modelUsed: 'Llama 3.1 8B (Free)' };
      }
    } catch {}
  }

  // Step 3: Rule-based tip
  const tip = lang === 'bn'
    ? 'ইন্টারনেট সংযোগ নেই বা AI সার্ভিস বন্ধ। স্থানীয় কৃষি সম্প্রসারণ অফিসে যোগাযোগ করুন অথবা কৃষি কল সেন্টারে ফোন করুন: 16123'
    : 'AI service unavailable. Contact your local Agricultural Extension Office or call: 16123';
  return { text: tip, modelUsed: 'Offline Fallback' };
}

// ─── Search hybrid ────────────────────────────────────────────────────────────

export async function searchWithHybridModels(
  query: string,
  lang: 'bn' | 'en' = 'bn',
): Promise<{ title: string; content: string; source?: string }[]> {
  const prompt = `কৃষি বিষয়ক প্রশ্ন: "${query}"
নিচের JSON ফরম্যাটে ৩-৪টি তথ্যপূর্ণ ফলাফল দিন (শুধু JSON):
[{"title":"শিরোনাম","content":"বিস্তারিত তথ্য","source":"BARI/BRRI/DAE"}]`;

  // Try Gemini first
  if (getGeminiKey()) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${getGeminiKey()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 600 },
          }),
        },
      );
      if (res.ok) {
        const data = await res.json();
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const match = raw.match(/\[[\s\S]*\]/);
        if (match) return JSON.parse(match[0]);
      }
    } catch {}
  }

  // Fallback to OpenRouter
  if (getOpenRouterKey()) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getOpenRouterKey()}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://krishiai.app',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct:free',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 600,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content || '';
        const match = raw.match(/\[[\s\S]*\]/);
        if (match) return JSON.parse(match[0]);
      }
    } catch {}
  }

  // Static fallback
  return [{
    title: `"${query}" - অনুসন্ধান ফলাফল`,
    content: 'অনলাইন সংযোগ নেই। আপনার নিকটস্থ উপজেলা কৃষি অফিসে যোগাযোগ করুন অথবা 16123 নম্বরে কল করুন।',
    source: 'DAE Bangladesh',
  }];
}
