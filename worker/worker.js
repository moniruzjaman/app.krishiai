/**
 * KrishiAI Gateway v3 — Cloudflare Worker
 * HYBRID CROP DOCTOR
 *
 * CLASSIFIER cascade (image → label, ~20 tokens):
 *   1. Gemini 2.5 Flash-Lite  — Google      1500/day FREE
 *   2. Gemini 2.5 Flash       — Google      1000/day FREE
 *   3. Gemini 2.0 Flash       — Google      1500/day FREE
 *   4. GLM-4.6V               — Z.AI        free tier
 *   5. llama-4-scout:free     — OpenRouter  200/day FREE
 *
 * ADVISORY cascade (text prompt, ~600 tokens):
 *   1. Gemini 2.5 Flash       — Google      FREE
 *   2. Gemini 2.0 Flash       — Google      FREE
 *   3. GLM-4.7                — Z.AI        free tier
 *   4. llama-4-maverick:free  — OpenRouter  FREE
 *   5. deepseek-r1:free       — OpenRouter  FREE
 *   6. qwen-2.5-7b:free       — OpenRouter  FREE
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};


const TIMEOUTS = {
  classifyMs: 5000,
  advisoryMs: 8000,
  chatMs: 8000,
};

function withTimeout(promise, ms, label = 'timeout') {
  let t;
  const timeout = new Promise((_, reject) => {
    t = setTimeout(() => reject(new Error(`${label} after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

function json(data, status = 200, requestId) {
  const headers = { ...CORS };
  if (requestId) headers['X-Request-Id'] = requestId;
  return new Response(JSON.stringify(data), { status, headers });
}

function errPayload({ code, stage, provider, model, message, requestId, retryable = true }) {
  return {
    ok: false,
    code,
    stage,
    provider,
    model,
    retryable,
    requestId,
    error: message,
  };
}

const DISEASE_KB = {
  rice_blast: {
    bn: 'ধানের ব্লাস্ট রোগ',
    prompt: `রোগ: ধানের ব্লাস্ট রোগ (Pyricularia oryzae)। ফসল: {crop}।
বাংলাদেশের কৃষকের জন্য লিখুন (১৫০ শব্দ): লক্ষণ, কারণ, ছত্রাকনাশক ডোজ (DAE অনুমোদিত), প্রতিরোধী জাত (BRRI dhan28/29)।`,
  },
  rice_blight: {
    bn: 'ধানের ব্যাকটেরিয়াল ব্লাইট',
    prompt: `রোগ: ধানের ব্যাকটেরিয়াল লিফ ব্লাইট (Xanthomonas oryzae)। ফসল: {crop}।
বাংলাদেশের কৃষকের জন্য লিখুন (১৫০ শব্দ): লক্ষণ, কপার স্প্রে ডোজ, প্রতিরোধী জাত।`,
  },
  rice_brown_spot: {
    bn: 'ধানের বাদামী দাগ রোগ',
    prompt: `রোগ: ধানের বাদামী দাগ রোগ (Helminthosporium oryzae)। ফসল: {crop}।
বাংলাদেশের কৃষকের জন্য লিখুন (১৫০ শব্দ): লক্ষণ, ম্যানকোজেব ডোজ, পটাশ সার।`,
  },
  rice_sheath_blight: {
    bn: 'ধানের শিথ ব্লাইট',
    prompt: `রোগ: ধানের শিথ ব্লাইট (Rhizoctonia solani)। ফসল: {crop}।
বাংলাদেশের কৃষকের জন্য লিখুন (১৫০ শব্দ): লক্ষণ, হেক্সাকোনাজোল ডোজ, জলাবদ্ধতা নিয়ন্ত্রণ।`,
  },
  rice_bph: {
    bn: 'ধানের বাদামী গাছফড়িং (BPH)',
    prompt: `পোকা: ধানের বাদামী গাছফড়িং (BPH)। ফসল: {crop}।
বাংলাদেশের কৃষকের জন্য লিখুন (১৫০ শব্দ): লক্ষণ, IPM পদ্ধতি, ইমিডাক্লোপ্রিড ডোজ, প্রতিরোধী জাত।`,
  },
  rice_stem_borer: {
    bn: 'ধানের কাণ্ড ছিদ্রকারী পোকা',
    prompt: `পোকা: ধানের কাণ্ড ছিদ্রকারী পোকা (Scirpophaga spp.)। ফসল: {crop}।
বাংলাদেশের কৃষকের জন্য লিখুন (১৫০ শব্দ): মরা ডিগ লক্ষণ, কার্বোফুরান ডোজ, আলোক ফাঁদ।`,
  },
  wheat_rust: {
    bn: 'গমের মরিচা রোগ',
    prompt: `রোগ: গমের স্ট্রাইপ রাস্ট (Puccinia striiformis)। ফসল: {crop}।
বাংলাদেশের কৃষকের জন্য লিখুন (১৫০ শব্দ): লক্ষণ, টেবুকোনাজোল ডোজ, BARI Gom 28/30 জাত।`,
  },
  potato_late_blight: {
    bn: 'আলুর মড়ক রোগ',
    prompt: `রোগ: আলুর মড়ক রোগ (Phytophthora infestans)। ফসল: {crop}।
বাংলাদেশের কৃষকের জন্য লিখুন (১৫০ শব্দ): লক্ষণ, রিডোমিল গোল্ড ডোজ, স্প্রে সময়সূচি।`,
  },
  tomato_leaf_curl: {
    bn: 'টমেটোর পাতা মোড়ানো ভাইরাস',
    prompt: `রোগ: টমেটোর পাতা মোড়ানো ভাইরাস (TYLCV)। ফসল: {crop}।
বাংলাদেশের কৃষকের জন্য লিখুন (১৫০ শব্দ): লক্ষণ, সাদামাছি নিয়ন্ত্রণ, ইমিডাক্লোপ্রিড ডোজ।`,
  },
  tomato_blight: {
    bn: 'টমেটোর আগাম ধ্বসা রোগ',
    prompt: `রোগ: টমেটোর আগাম ধ্বসা রোগ (Alternaria solani)। ফসল: {crop}।
বাংলাদেশের কৃষকের জন্য লিখুন (১৫০ শব্দ): চক্রাকার দাগ লক্ষণ, ম্যানকোজেব ডোজ।`,
  },
  brinjal_borer: {
    bn: 'বেগুনের ডগা ও ফল ছিদ্রকারী পোকা',
    prompt: `পোকা: বেগুনের ডগা ও ফল ছিদ্রকারী পোকা (FSB)। ফসল: {crop}।
বাংলাদেশের কৃষকের জন্য লিখুন (১৫০ শব্দ): লক্ষণ, ফেরোমন ফাঁদ, সাইপারমেথ্রিন ডোজ।`,
  },
  nitrogen_deficiency: {
    bn: 'নাইট্রোজেন ঘাটতি',
    prompt: `সমস্যা: নাইট্রোজেন ঘাটতি। ফসল: {crop}।
বাংলাদেশের কৃষকের জন্য লিখুন (১২০ শব্দ): লক্ষণ, ইউরিয়া ডোজ, জৈব সার।`,
  },
  zinc_deficiency: {
    bn: 'জিংক ঘাটতি (খায়রা রোগ)',
    prompt: `সমস্যা: জিংক ঘাটতি। ফসল: {crop}।
বাংলাদেশের কৃষকের জন্য লিখুন (১২০ শব্দ): লক্ষণ, জিংক সালফেট ডোজ, BARC সুপারিশ।`,
  },
  healthy: {
    bn: 'পাতা সুস্থ',
    prompt: `পাতা সুস্থ। ফসল: {crop}।
বাংলাদেশের কৃষকের জন্য লিখুন (১০০ শব্দ): মৌসুমী সতর্কতা ও নিয়মিত পরিদর্শনের টিপস।`,
  },
};

const DISEASE_LABELS = Object.keys(DISEASE_KB).join(', ');
const CLASSIFY_PROMPT = `You are a plant disease classifier for Bangladesh crops.
Crop hint: {crop}. Examine this image carefully.
Reply with ONLY one label from this exact list (no punctuation, no explanation):
${DISEASE_LABELS}
If none match, reply: unknown`;

// ── OpenAI-compatible vision call ────────────────────────────────────────────
async function callVision(baseUrl, apiKey, model, imageBase64, textPrompt, maxTokens = 20) {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        { type: 'text', text: textPrompt },
      ]}],
      max_tokens: maxTokens,
      temperature: 0.1,
    }),
  });
  if (!res.ok) throw new Error(`${model} ${res.status}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error(`${model} empty`);
  return text;
}

// ── OpenAI-compatible text call ──────────────────────────────────────────────
async function callText(baseUrl, apiKey, model, prompt, maxTokens = 600, extraHeaders = {}) {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  });
  if (!res.ok) throw new Error(`${model} ${res.status}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error(`${model} empty`);
  return { text, model };
}

// ── Gemini native call ───────────────────────────────────────────────────────
async function callGemini(model, prompt, imageBase64, apiKey, maxTokens = 600) {
  const parts = imageBase64
    ? [{ inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }, { text: prompt }]
    : [{ text: prompt }];
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.1 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${model} ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error(`Gemini ${model} empty`);
  return text;
}

// ── Step 1: Classify disease ─────────────────────────────────────────────────
async function classifyDisease(imageBase64, cropHint, env) {
  const prompt = CLASSIFY_PROMPT.replace('{crop}', cropHint || 'unknown');

  const attempts = [
    async () => {
      const text = await callGemini('gemini-2.5-flash-lite-preview-06-17', prompt, imageBase64, env.GEMINI_API_KEY, 15);
      return { text, model: 'gemini-2.5-flash-lite' };
    },
    async () => {
      const text = await callGemini('gemini-2.5-flash-preview-05-20', prompt, imageBase64, env.GEMINI_API_KEY, 15);
      return { text, model: 'gemini-2.5-flash' };
    },
    async () => {
      const text = await callGemini('gemini-2.0-flash', prompt, imageBase64, env.GEMINI_API_KEY, 15);
      return { text, model: 'gemini-2.0-flash' };
    },
    async () => {
      if (!env.ZAI_API_KEY) throw new Error('no ZAI key');
      const text = await callVision('https://api.z.ai/v1', env.ZAI_API_KEY, 'glm-4.6v', imageBase64, prompt, 15);
      return { text, model: 'glm-4.6v' };
    },
    async () => {
      if (!env.OPENROUTER_API_KEY) throw new Error('no OR key');
      const text = await callVision('https://openrouter.ai/api/v1', env.OPENROUTER_API_KEY,
        'meta-llama/llama-4-scout:free', imageBase64, prompt, 15);
      return { text, model: 'llama-4-scout' };
    },
  ];

  for (const attempt of attempts) {
    try {
      const { text, model } = await withTimeout(attempt(), TIMEOUTS.classifyMs, 'classify timeout');
      const raw = text.toLowerCase().replace(/[^a-z_]/g, '');
      const match = Object.keys(DISEASE_KB).find(k => raw === k || raw.includes(k));
      if (match) return { diseaseKey: match, classifierModel: model };
    } catch (e) {}
  }
  return { diseaseKey: 'unknown', classifierModel: 'none' };
}

// ── Step 2: Advisory ─────────────────────────────────────────────────────────
async function getAdvisory(diseaseKey, crop, imageBase64, env) {
  const disease = DISEASE_KB[diseaseKey];
  const prompt = disease
    ? disease.prompt.replace('{crop}', crop || 'ফসল')
    : `ফসল: ${crop || 'অজানা'}। এই ফসলের ছবি দেখে রোগ/পোকা শনাক্ত করুন। DAE/BARI/BRRI সুপারিশ অনুযায়ী সহজ বাংলায় পরামর্শ দিন। ১৫০ শব্দ।`;
  const useImage = diseaseKey === 'unknown' && imageBase64;

  const attempts = [
    async () => {
      const text = await callGemini('gemini-2.5-flash-preview-05-20', prompt, useImage ? imageBase64 : null, env.GEMINI_API_KEY, 700);
      return { text, model: 'gemini-2.5-flash' };
    },
    async () => {
      const text = await callGemini('gemini-2.0-flash', prompt, useImage ? imageBase64 : null, env.GEMINI_API_KEY, 700);
      return { text, model: 'gemini-2.0-flash' };
    },
    async () => {
      if (!env.ZAI_API_KEY) throw new Error('no ZAI key');
      return callText('https://api.z.ai/v1', env.ZAI_API_KEY, 'glm-4.7', prompt, 700);
    },
    async () => {
      if (!env.OPENROUTER_API_KEY) throw new Error('no OR key');
      return callText('https://openrouter.ai/api/v1', env.OPENROUTER_API_KEY,
        'meta-llama/llama-4-maverick:free', prompt, 700,
        { 'HTTP-Referer': 'https://krishiai.live', 'X-Title': 'KrishiAI' });
    },
    async () => {
      if (!env.OPENROUTER_API_KEY) throw new Error('no OR key');
      return callText('https://openrouter.ai/api/v1', env.OPENROUTER_API_KEY,
        'deepseek/deepseek-r1:free', prompt, 700,
        { 'HTTP-Referer': 'https://krishiai.live', 'X-Title': 'KrishiAI' });
    },
    async () => {
      if (!env.OPENROUTER_API_KEY) throw new Error('no OR key');
      return callText('https://openrouter.ai/api/v1', env.OPENROUTER_API_KEY,
        'qwen/qwen-2.5-7b-instruct:free', prompt, 700,
        { 'HTTP-Referer': 'https://krishiai.live', 'X-Title': 'KrishiAI' });
    },
  ];

  for (const attempt of attempts) {
    try {
      const result = await withTimeout(attempt(), TIMEOUTS.advisoryMs, 'advisory timeout');
      if (result?.text) return result;
    } catch (e) {}
  }
  throw new Error('All advisory providers failed');
}

// ── Chat ─────────────────────────────────────────────────────────────────────
async function handleChat(prompt, env) {
  const full = `আপনি কৃষি AI — বাংলাদেশের কৃষকদের বিশেষজ্ঞ। BARI, BRRI, DAE, BARC সুপারিশ মেনে সহজ বাংলায় উত্তর দিন।\n\n${prompt}`;

  const attempts = [
    async () => {
      const text = await callGemini('gemini-2.5-flash-preview-05-20', full, null, env.GEMINI_API_KEY, 800);
      return { text, model: 'gemini-2.5-flash' };
    },
    async () => {
      const text = await callGemini('gemini-2.0-flash', full, null, env.GEMINI_API_KEY, 800);
      return { text, model: 'gemini-2.0-flash' };
    },
    async () => {
      if (!env.ZAI_API_KEY) throw new Error('no ZAI key');
      return callText('https://api.z.ai/v1', env.ZAI_API_KEY, 'glm-4.7', full, 800);
    },
    async () => {
      if (!env.OPENROUTER_API_KEY) throw new Error('no OR key');
      return callText('https://openrouter.ai/api/v1', env.OPENROUTER_API_KEY,
        'meta-llama/llama-4-maverick:free', full, 800,
        { 'HTTP-Referer': 'https://krishiai.live', 'X-Title': 'KrishiAI' });
    },
    async () => {
      if (!env.OPENROUTER_API_KEY) throw new Error('no OR key');
      return callText('https://openrouter.ai/api/v1', env.OPENROUTER_API_KEY,
        'deepseek/deepseek-r1:free', full, 800,
        { 'HTTP-Referer': 'https://krishiai.live', 'X-Title': 'KrishiAI' });
    },
    async () => {
      if (!env.OPENROUTER_API_KEY) throw new Error('no OR key');
      return callText('https://openrouter.ai/api/v1', env.OPENROUTER_API_KEY,
        'qwen/qwen-2.5-7b-instruct:free', full, 800,
        { 'HTTP-Referer': 'https://krishiai.live', 'X-Title': 'KrishiAI' });
    },
  ];

  for (const attempt of attempts) {
    try {
      const result = await withTimeout(attempt(), TIMEOUTS.chatMs, 'chat timeout');
      if (result?.text) return result;
    } catch (e) {}
  }
  throw new Error('All providers failed');
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const requestId = (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    if (request.method === 'GET') {
      return json({
        ok: true,
        status: 'ok',
        service: 'KrishiAI Gateway v3',
        version: '3.1.0',
        classifier_cascade: ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash', 'glm-4.6v', 'llama-4-scout'],
        advisory_cascade: ['gemini-2.5-flash', 'gemini-2.0-flash', 'glm-4.7', 'llama-4-maverick', 'deepseek-r1', 'qwen-2.5-7b'],
        diseases_covered: Object.keys(DISEASE_KB).length,
        timestamp: new Date().toISOString(),
        requestId,
      }, 200, requestId);
    }

    if (request.method !== 'POST')
      return json(errPayload({
        code: 'METHOD_NOT_ALLOWED',
        stage: 'request',
        provider: 'gateway',
        model: 'none',
        message: 'POST required',
        requestId,
        retryable: false,
      }), 405, requestId);

    let body;
    try { body = await request.json(); }
    catch {
      return json(errPayload({
        code: 'INVALID_JSON',
        stage: 'request',
        provider: 'gateway',
        model: 'none',
        message: 'Invalid JSON',
        requestId,
        retryable: false,
      }), 400, requestId);
    }

    const { prompt, imageBase64, cropHint } = body;

    // skipClassify — local model already classified, just get advisory
    if (!imageBase64) {
      if (body.skipClassify && body.cropHint) {
        try {
          const diseaseKey = Object.keys(DISEASE_KB).includes(body.cropHint) ? body.cropHint : 'unknown';
          const { text, model } = await getAdvisory(diseaseKey, body.cropHint, null, env);
          return json({
            text, model, diseaseKey,
            diseaseName: DISEASE_KB[diseaseKey]?.bn || 'অজানা রোগ',
            architecture: 'local-classify+cloud-advisory',
            requestId,
          }, 200, requestId);
        } catch (err) {
          return json(errPayload({
            code: 'ADVISORY_PROVIDER_FAILED',
            stage: 'advisory',
            provider: 'multi',
            model: 'cascade',
            message: err.message,
            requestId,
          }), 503, requestId);
        }
      }
      if (!prompt?.trim())
        return json(errPayload({
          code: 'PROMPT_REQUIRED',
          stage: 'request',
          provider: 'gateway',
          model: 'none',
          message: 'prompt required',
          requestId,
          retryable: false,
        }), 400, requestId);
      try {
        const result = await handleChat(prompt.trim(), env);
        return json({ ...result, requestId }, 200, requestId);
      } catch (err) {
        return json(errPayload({
          code: 'CHAT_PROVIDER_FAILED',
          stage: 'chat',
          provider: 'multi',
          model: 'cascade',
          message: err.message,
          requestId,
        }), 503, requestId);
      }
    }

    // Diagnose mode — hybrid 2-step
    try {
      let diseaseKey, classifierModel;
      if (body.skipClassify && body.cropHint && Object.keys(DISEASE_KB).includes(body.cropHint)) {
        diseaseKey = body.cropHint;
        classifierModel = 'mobilenetv2-local';
      } else {
        ({ diseaseKey, classifierModel } = await classifyDisease(imageBase64, cropHint || prompt, env));
      }
      const { text, model: advisoryModel } = await getAdvisory(diseaseKey, cropHint || prompt || 'ফসল', imageBase64, env);
      return json({
        text, model: advisoryModel, classifierModel, diseaseKey,
        diseaseName: DISEASE_KB[diseaseKey]?.bn || 'অজানা রোগ',
        architecture: 'hybrid-2step-v3',
        requestId,
      }, 200, requestId);
    } catch (err) {
      return json(errPayload({
        code: 'DIAGNOSE_PROVIDER_FAILED',
        stage: 'diagnose',
        provider: 'multi',
        model: 'cascade',
        message: `সব AI প্রদানকারী অনুপলব্ধ। ${err.message || ''}`.trim(),
        requestId,
      }), 503, requestId);
    }
  },
};
