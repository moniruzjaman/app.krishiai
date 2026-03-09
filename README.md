# 🌾 Krishi AI — কৃষি এআই

AI-powered crop disease diagnosis app for Bangladesh farmers.  
Built with Expo React Native + Cloudflare Workers + Google Gemini.

---

## 📱 App Features

- **🔬 Disease Diagnosis** — Take a photo, get instant AI diagnosis in Bangla
- **💬 AI Chat** — Ask any agriculture question
- **🌤️ Weather** — Real-time weather with farming advisory
- **⚗️ Fertilizer Calculator** — BARC-based nutrient recommendations
- **📚 146 Crops** — Searchable crop database
- **📖 Offline Mode** — Rule-based fallback when no internet
- **🇧🇩 Bangla-first** — All output in Bengali with English toggle

---

## 🏗️ Architecture

```
Farmer Phone (Android APK)
        ↓
Cloudflare Worker Gateway
app-krishiai.mithun-hstu.workers.dev
        ↓
Step 1: Disease Classifier (20 tokens)
        ↓
Step 2: Focused Bangla Advisory (600 tokens)
        ↓
┌──────────────┐    ┌────────────────────────┐
│ Gemini 2.0   │ or │ OpenRouter Free Models │
│ Flash        │    │ deepseek / qwen / llama│
└──────────────┘    └────────────────────────┘
```

**AI Cascade (app-side fallback):**
1. ☁️ Cloudflare Worker (primary — keys never in APK)
2. ⭐ Gemini 2.0 Flash direct
3. 🆓 OpenRouter free models
4. 📖 Rule-based offline system

---

## 🦠 Disease Coverage

14 disease classes across major Bangladesh crops:

**Rice:** blast, bacterial blight, brown spot, sheath blight, BPH, stem borer  
**Wheat:** stripe rust  
**Potato:** late blight  
**Tomato:** leaf curl virus, early blight  
**Brinjal:** shoot & fruit borer  
**Deficiency:** nitrogen, zinc  

---

## 📁 Project Structure

```
app/
  (tabs)/        — Main screens (home, analyzer, chat, search, tools)
  (tools)/       — 18 agricultural tools
src/
  constants.ts          — 146 crops database
  services/
    workerService.ts    — Cloudflare Worker API client
    hybridModelService.ts — AI cascade logic
    apiKeys.ts          — Key resolution (Constants.extra priority)
worker/
  worker.js      — Cloudflare Worker (Hybrid Crop Doctor v2)
  wrangler.toml  — Cloudflare config
```

---

## 🚀 Build & Deploy

### Android APK
Automated via GitHub Actions on push to `main`:
```
https://github.com/moniruzjaman/app.krishiai/actions
```

### Cloudflare Worker
Automated via GitHub Actions on push to `worker/worker.js`:
```
https://github.com/moniruzjaman/app.krishiai/actions
```

### Required GitHub Secrets
| Secret | Description |
|--------|-------------|
| `EXPO_TOKEN` | Expo account token |
| `EXPO_PUBLIC_GEMINI_API_KEY` | Google Gemini key |
| `EXPO_PUBLIC_OPENROUTER_API_KEY` | OpenRouter key |
| `CLOUDFLARE_API_TOKEN` | Cloudflare deploy token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Play Store service account |

---

## 🌐 Live URLs

| Service | URL |
|---------|-----|
| AI Gateway | https://app-krishiai.mithun-hstu.workers.dev |
| APK Download | https://app.krishiai.live |

---

## 🔬 Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile App | Expo SDK 52, React Native 0.76 |
| Language | TypeScript |
| Navigation | Expo Router v4 |
| AI Gateway | Cloudflare Workers |
| Primary AI | Google Gemini 2.0 Flash |
| Fallback AI | OpenRouter (DeepSeek, Qwen, Mistral) |
| Build | EAS Build (arm64-v8a) |
| Deploy | GitHub Actions |

---

## 📊 Impact

Designed to support Bangladesh's 17 million farming households with:
- Instant crop disease diagnosis from phone photos
- DAE/BRRI/BARI-approved treatment recommendations
- Local pesticide names and doses in Bangla
- Works in low-connectivity rural areas
