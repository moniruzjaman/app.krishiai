/**
 * KrishiAI Gateway — Cloudflare Worker
 * 
 * Serverless AI gateway for Bangladesh farmers.
 * Cascades: Gemini 2.0 Flash → OpenRouter free models
 * Supports text + vision (Base64 image) queries in Bangla.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const SYSTEM_PROMPT = `আপনি কৃষি AI — বাংলাদেশের কৃষকদের জন্য বিশেষজ্ঞ কৃষি পরামর্শদাতা।
BARI, BRRI, DAE, BARC-এর সুপারিশ অনুসরণ করুন।
সংক্ষিপ্ত, সহজ বাংলা ভাষায় ব্যবহারিক পরামর্শ দিন।
রোগ/পোকার ক্ষেত্রে: রোগের নাম, কারণ, এবং সমাধান বলুন।`;

const OPENROUTER_MODELS = [
  'deepseek/deepseek-r1:free',
  'qwen/qwen-2.5-7b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
];

// ── Gemini ────────────────────────────────────────────────────────────────────

async function callGemini(prompt, imageBase64, apiKey) {
  const parts = [];
  if (imageBase64) {
    parts.push({ inline_data: { mime_type: 'image/jpeg', data: imageBase64 } });
  }
  parts.push({ text: prompt });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts }],
        generationConfig: { maxOutputTokens: 1000, temperature: 0.3 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Gemini ${res.status}: ${err?.error?.message || 'unknown error'}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty response');
  return text;
}

// ── OpenRouter ────────────────────────────────────────────────────────────────

async function callOpenRouter(prompt, imageBase64, model, apiKey) {
  const userContent = imageBase64
    ? [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        { type: 'text', text: prompt },
      ]
    : prompt;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://krishiai.live',
      'X-Title': 'KrishiAI',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      max_tokens: 800,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`OpenRouter ${res.status}: ${err?.error?.message || model}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error(`Empty response from ${model}`);
  return text;
}

// ── Main Handler ──────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // Health check
    if (request.method === 'GET') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'KrishiAI Gateway',
        models: ['gemini-2.0-flash', ...OPENROUTER_MODELS],
        timestamp: new Date().toISOString(),
      }), { headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405, headers: CORS_HEADERS,
      });
    }

    // Parse body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400, headers: CORS_HEADERS,
      });
    }

    const { prompt, imageBase64 } = body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'prompt is required' }), {
        status: 400, headers: CORS_HEADERS,
      });
    }

    const log = [];

    // 1️⃣ Try Gemini first
    if (env.GEMINI_API_KEY) {
      try {
        const text = await callGemini(prompt.trim(), imageBase64 || null, env.GEMINI_API_KEY);
        return new Response(JSON.stringify({ text, model: 'gemini-2.0-flash', log }), {
          headers: CORS_HEADERS,
        });
      } catch (err) {
        log.push({ model: 'gemini-2.0-flash', error: err.message });
      }
    } else {
      log.push({ model: 'gemini-2.0-flash', error: 'GEMINI_API_KEY not set' });
    }

    // 2️⃣ Try OpenRouter free models in order
    if (env.OPENROUTER_API_KEY) {
      for (const model of OPENROUTER_MODELS) {
        try {
          const text = await callOpenRouter(
            prompt.trim(), imageBase64 || null, model, env.OPENROUTER_API_KEY
          );
          return new Response(JSON.stringify({ text, model, log }), {
            headers: CORS_HEADERS,
          });
        } catch (err) {
          log.push({ model, error: err.message });
        }
      }
    } else {
      log.push({ model: 'openrouter', error: 'OPENROUTER_API_KEY not set' });
    }

    // All failed
    return new Response(
      JSON.stringify({
        error: 'সব AI প্রদানকারী অনুপলব্ধ। পরে আবার চেষ্টা করুন।',
        error_en: 'All AI providers unavailable. Please try again later.',
        log,
      }),
      { status: 503, headers: CORS_HEADERS }
    );
  },
};
