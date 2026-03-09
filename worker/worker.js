/**
 * KrishiAI Gateway v2 — Cloudflare Worker
 * HYBRID CROP DOCTOR: 2-step classify then advise
 * Reduces AI token usage 70-80% vs raw image analysis
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const DISEASE_KB = {
  rice_blast: {
    bn: 'ধানের ব্লাস্ট রোগ',
    prompt: `রোগ: ধানের ব্লাস্ট রোগ (Pyricularia oryzae)। ফসল: {crop}।
বাংলাদেশের কৃষকের জন্য লিখুন (১৫০ শব্দের মধ্যে):
১. লক্ষণ  ২. কারণ  ৩. ছত্রাকনাশক (DAE অনুমোদিত, ডোজসহ)  ৪. প্রতিরোধী জাত (BRRI dhan28/29)`,
  },
  rice_blight: {
    bn: 'ধানের ব্যাকটেরিয়াল ব্লাইট',
    prompt: `রোগ: ধানের ব্যাকটেরিয়াল লিফ ব্লাইট (Xanthomonas oryzae)। ফসল: {crop}।
বাংলাদেশের কৃষকের জন্য লিখুন (১৫০ শব্দ): লক্ষণ, কারণ, কপার স্প্রে ডোজ, প্রতিরোধী জাত।`,
  },
  rice_brown_spot: {
    bn: 'ধানের বাদামী দাগ রোগ',
    prompt: `রোগ: ধানের বাদামী দাগ রোগ (Helminthosporium oryzae)। ফসল: {crop}।
বাংলাদেশের কৃষকের জন্য লিখুন (১৫০ শব্দ): লক্ষণ, কারণ, ম্যানকোজেব স্প্রে ডোজ, পটাশ সার।`,
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
বাংলাদেশের কৃষকের জন্য লিখুন (১৫০ শব্দ): চক্রাকার দাগ লক্ষণ, ম্যানকোজেব ডোজ, mulching।`,
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

async function classifyDisease(imageBase64, cropHint, geminiKey) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
            { text: `Crop: ${cropHint || 'unknown'}. Classify this plant image. Reply with ONLY one label from: ${DISEASE_LABELS}. No explanation.` },
          ],
        }],
        generationConfig: { maxOutputTokens: 15, temperature: 0.1 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Classify ${res.status}`);
  const data = await res.json();
  const raw = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim().toLowerCase().replace(/[^a-z_]/g, '');
  return Object.keys(DISEASE_KB).find(k => raw === k || raw.includes(k)) || 'unknown';
}

async function getAdvisory(diseaseKey, crop, imageBase64, geminiKey, openRouterKey) {
  const disease = DISEASE_KB[diseaseKey];
  let prompt;
  if (disease) {
    prompt = disease.prompt.replace('{crop}', crop || 'ফসল');
  } else {
    prompt = `ফসল: ${crop || 'অজানা'}। এই ছবি দেখে রোগ/পোকা শনাক্ত করুন। বাংলাদেশ DAE/BARI/BRRI সুপারিশ অনুযায়ী সহজ বাংলায় পরামর্শ দিন। ১৫০ শব্দের মধ্যে।`;
  }

  // Gemini — use image only for unknown disease
  if (geminiKey) {
    try {
      const parts = (diseaseKey === 'unknown' && imageBase64)
        ? [{ inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }, { text: prompt }]
        : [{ text: prompt }];
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: { maxOutputTokens: 600, temperature: 0.3 },
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return { text, model: 'gemini-2.0-flash' };
      }
    } catch (e) {}
  }

  // OpenRouter fallback
  for (const model of ['deepseek/deepseek-r1:free', 'qwen/qwen-2.5-7b-instruct:free', 'mistralai/mistral-7b-instruct:free']) {
    if (!openRouterKey) break;
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${openRouterKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://krishiai.live', 'X-Title': 'KrishiAI' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 600, temperature: 0.3 }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return { text, model };
      }
    } catch (e) {}
  }
  throw new Error('All providers failed');
}

async function handleChat(prompt, geminiKey, openRouterKey) {
  const sys = `আপনি কৃষি AI — বাংলাদেশের কৃষকদের বিশেষজ্ঞ। BARI, BRRI, DAE, BARC সুপারিশ মেনে সহজ বাংলায় উত্তর দিন।`;
  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: sys }] },
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 800, temperature: 0.4 },
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return { text, model: 'gemini-2.0-flash' };
      }
    } catch (e) {}
  }
  for (const model of ['deepseek/deepseek-r1:free', 'qwen/qwen-2.5-7b-instruct:free', 'mistralai/mistral-7b-instruct:free']) {
    if (!openRouterKey) break;
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${openRouterKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://krishiai.live' },
        body: JSON.stringify({ model, messages: [{ role: 'system', content: sys }, { role: 'user', content: prompt }], max_tokens: 600 }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return { text, model };
      }
    } catch (e) {}
  }
  throw new Error('All providers unavailable');
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

    if (request.method === 'GET') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'KrishiAI Gateway v2',
        version: '2.0.0',
        architecture: 'hybrid-crop-doctor',
        diseases_covered: Object.keys(DISEASE_KB).length,
        crops: ['rice', 'wheat', 'potato', 'tomato', 'brinjal', 'general'],
        timestamp: new Date().toISOString(),
      }), { headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'POST required' }), { status: 405, headers: CORS_HEADERS });

    let body;
    try { body = await request.json(); }
    catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: CORS_HEADERS }); }

    const { prompt, imageBase64, cropHint } = body;

    // Chat mode — text only
    if (!imageBase64) {
      if (!prompt?.trim()) return new Response(JSON.stringify({ error: 'prompt required' }), { status: 400, headers: CORS_HEADERS });
      try {
        const result = await handleChat(prompt.trim(), env.GEMINI_API_KEY, env.OPENROUTER_API_KEY);
        return new Response(JSON.stringify(result), { headers: CORS_HEADERS });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 503, headers: CORS_HEADERS });
      }
    }

    // Diagnose mode — hybrid 2-step
    try {
      let diseaseKey = 'unknown';
      if (env.GEMINI_API_KEY) {
        try { diseaseKey = await classifyDisease(imageBase64, cropHint || prompt, env.GEMINI_API_KEY); }
        catch (e) {}
      }
      const { text, model } = await getAdvisory(diseaseKey, cropHint || prompt || 'ফসল', imageBase64, env.GEMINI_API_KEY, env.OPENROUTER_API_KEY);
      return new Response(JSON.stringify({
        text,
        model,
        diseaseKey,
        diseaseName: DISEASE_KB[diseaseKey]?.bn || 'অজানা রোগ',
        architecture: 'hybrid-2step',
      }), { headers: CORS_HEADERS });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'সব AI প্রদানকারী অনুপলব্ধ।', detail: err.message }), { status: 503, headers: CORS_HEADERS });
    }
  },
};
