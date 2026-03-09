# 🌾 KrishiAI Gateway v3 — Cloudflare Worker

Hybrid Crop Doctor with maximum free vision coverage across 6 providers.

## Architecture

```
Image → Step 1: Classify (20 tokens)  →  Step 2: Advisory (600 tokens)
         6 vision providers                7 text providers
         ~0 cost for known diseases
```

## Vision Cascade (Classifier — Step 1)

| # | Provider | Model | Free Quota | Notes |
|---|----------|-------|-----------|-------|
| 1 | Google | gemini-2.5-flash-lite | 1,500/day | Primary |
| 2 | Google | gemini-2.5-flash | 1,000/day | Fallback |
| 3 | Google | gemini-2.0-flash | 1,500/day | Reliable fallback |
| 4 | NVIDIA NIM | kimi-k2.5 | 1,000 credits free signup | Moonshot vision |
| 5 | Z.AI | glm-4.6v | Free tier | Zhipu vision |
| 6 | OpenRouter | llama-4-scout:free | 200/day | Meta vision |

## Advisory Cascade (Step 2 — text only for known diseases)

| # | Provider | Model | Free Quota |
|---|----------|-------|-----------|
| 1 | Google | gemini-2.5-flash | 1,000/day |
| 2 | Google | gemini-2.0-flash | 1,500/day |
| 3 | NVIDIA NIM | kimi-k2.5 | free credits |
| 4 | Z.AI | glm-4.7 | free tier |
| 5 | OpenRouter | llama-4-maverick:free | 200/day |
| 6 | OpenRouter | deepseek-r1:free | 200/day |
| 7 | OpenRouter | qwen-2.5-7b:free | 200/day |

## Required Cloudflare Secrets

| Secret | Required | Get From |
|--------|----------|---------|
| `GEMINI_API_KEY` | ✅ Primary | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `OPENROUTER_API_KEY` | ✅ Fallback | [openrouter.ai](https://openrouter.ai/keys) |
| `NVIDIA_API_KEY` | 🔴 Add now | [build.nvidia.com](https://build.nvidia.com) — free signup, 1000 credits |
| `ZAI_API_KEY` | 🔴 Add now | [platform.z.ai](https://platform.z.ai) — free tier |

## Disease Coverage (14 classes)

Rice: blast, bacterial blight, brown spot, sheath blight, BPH, stem borer  
Wheat: stripe rust | Potato: late blight  
Tomato: leaf curl virus, early blight | Brinjal: shoot & fruit borer  
Deficiency: nitrogen, zinc | Healthy leaf detection

## API

**GET** — Health check → returns cascade config  
**POST** `{ imageBase64, cropHint }` → diagnose  
**POST** `{ prompt }` → chat  

**Response:**
```json
{
  "text": "ধানের ব্লাস্ট রোগ...",
  "model": "gemini-2.5-flash",
  "classifierModel": "gemini-2.5-flash-lite",
  "diseaseKey": "rice_blast",
  "diseaseName": "ধানের ব্লাস্ট রোগ",
  "architecture": "hybrid-2step-v3"
}
```

## Deploy
Auto-deploys via GitHub Actions on push to `worker/worker.js`.
