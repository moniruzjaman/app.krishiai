# 🌾 Krishi AI — কৃষি এআই

AI-powered crop disease diagnosis app for Bangladesh farmers.  
Built with Expo React Native + Cloudflare Workers + Google Gemini.

**Version:** 2.4.0 (versionCode 10) | **Platform:** Android (arm64-v8a)

---

## 📱 App Features

| Feature | Description |
|---------|-------------|
| 🔬 Disease Diagnosis | Photo → AI diagnosis in Bangla (14 disease classes) |
| 💬 AI Chat | Ask any agriculture question |
| 🌤️ Weather | Real-time weather with farming advisory |
| ⚗️ Fertilizer Calculator | BARC-based nutrient recommendations |
| 📚 146 Crops | Searchable crop database |
| 📖 Offline Mode | Rule-based fallback when no internet |
| 🇧🇩 Bangla-first | All output in Bengali with English toggle |

---

## 🏗️ Architecture — Hybrid Crop Doctor

```
Farmer Phone (Android APK)
        ↓
        POST { imageBase64, cropHint }
        ↓
┌──────────────────────────────────────┐
│  Cloudflare Worker Gateway           │
│  app-krishiai.mithun-hstu.workers.dev│
│                                      │
│  Step 1: classifyDisease()           │
│  → Gemini vision  (20 tokens only)   │
│  → Returns label: "rice_blast"       │
│              ↓                       │
│  Step 2: getAdvisory()               │
│  → Disease-specific Bangla prompt    │
│  → Text only (no image = 80% cheaper)│
│  → Max 600 tokens                    │
└──────────────┬───────────────────────┘
               ↓
    ┌──────────────────┐   fail   ┌──────────────────────────┐
    │  Gemini 2.0 Flash│ ───────▶ │  OpenRouter Free Models  │
    │  (Primary)       │          │  deepseek-r1 / qwen-2.5  │
    └──────────────────┘          │  mistral-7b              │
                                  └──────────────────────────┘
```

**App-side AI cascade (if worker is down):**
1. ☁️ Cloudflare Worker (primary — API keys never in APK)
2. ⭐ Gemini 2.0 Flash direct
3. 🆓 OpenRouter free models
4. 📖 Rule-based offline system

**Cost saving:** ~70% fewer tokens vs raw image analysis every time.

---

## 🦠 Disease Coverage (14 Classes)

| Crop | Diseases / Pests |
|------|-----------------|
| 🌾 Rice | Blast, Bacterial Blight, Brown Spot, Sheath Blight, BPH, Stem Borer |
| 🌿 Wheat | Stripe Rust |
| 🥔 Potato | Late Blight |
| 🍅 Tomato | Leaf Curl Virus, Early Blight |
| 🍆 Brinjal | Shoot & Fruit Borer |
| 🌱 Deficiency | Nitrogen, Zinc (Khaira) |
| ✅ Healthy | Healthy leaf detection |

---

## 📁 Project Structure

```
app/
├── (tabs)/
│   ├── _layout.tsx          — Tab navigation
│   ├── index.tsx            — Home screen
│   ├── analyzer.tsx         — 🔬 Disease analyzer (main feature)
│   ├── chat.tsx             — 💬 AI chat
│   ├── search.tsx           — 🔍 Search
│   └── tools.tsx            — 🛠️ Tools grid
│
└── (tools)/                 — 17 agricultural tools
    ├── disease-library.tsx  — Disease encyclopedia
    ├── leaf-color.tsx       — LCC nitrogen management
    ├── field-monitoring.tsx — AI field health check
    ├── soil-expert.tsx      — Soil test AI advisor
    ├── soil-guide.tsx       — Soil sampling guide
    ├── nutrient.tsx         — Fertilizer calculator
    ├── pesticide.tsx        — DAE pesticide advisor
    ├── biocontrol.tsx       — Biological pest control
    ├── plant-defense.tsx    — Brix & plant immunity
    ├── yield.tsx            — Sample cutting yield calc
    ├── ai-yield.tsx         — AI yield forecasting
    ├── calendar.tsx         — Crop season calendar
    ├── tasks.tsx            — Field task tracker
    ├── weather.tsx          — Weather & pest risk
    ├── flashcards.tsx       — AI learning cards
    ├── podcast.tsx          — AI agriculture podcast
    └── field-map.tsx        — Agri-map (DAE offices)

src/
├── constants.ts             — 146 crops + seasons database
├── toolsData.ts             — Tool registry (19 tools)
└── services/
    ├── workerService.ts     — Cloudflare Worker API client
    ├── hybridModelService.ts — AI cascade logic
    ├── apiKeys.ts           — Key resolution (Constants.extra priority)
    └── geminiNative.ts      — Gemini direct client

worker/
├── worker.js                — Cloudflare Worker (Hybrid Crop Doctor v2)
├── wrangler.toml            — Cloudflare deployment config
└── README.md                — Worker API documentation

.github/workflows/
├── build-apk.yml            — EAS Android APK build
├── deploy-worker.yml        — Cloudflare Worker auto-deploy
├── deploy-page.yml          — GitHub Pages APK download page
└── test-worker.yml          — Worker API health test
```

---

## 🚀 Build & Deploy

### Android APK
Triggers automatically on every push to `main`:
```
https://github.com/moniruzjaman/app.krishiai/actions
```
Download latest APK: **https://expo.dev/accounts/moniruzjaman/projects/krishi-ai/builds**

### Cloudflare Worker
Triggers automatically when `worker/worker.js` changes:
```
https://github.com/moniruzjaman/app.krishiai/actions
```

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `EXPO_TOKEN` | Expo account token |
| `EXPO_PUBLIC_GEMINI_API_KEY` | Google Gemini API key |
| `EXPO_PUBLIC_OPENROUTER_API_KEY` | OpenRouter API key |
| `CLOUDFLARE_API_TOKEN` | Cloudflare Workers deploy token |
| `CLOUDFLARE_ACCOUNT_ID` | `4a2230e358905ad039e6ee0014fc9ce1` |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Play Store service account JSON |

---

## 🌐 Live URLs

| Service | URL |
|---------|-----|
| AI Gateway | https://app-krishiai.mithun-hstu.workers.dev |
| APK Download | https://app.krishiai.live |
| GitHub Actions | https://github.com/moniruzjaman/app.krishiai/actions |

---

## 🔬 Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile App | Expo SDK 52, React Native 0.76.5 |
| Language | TypeScript |
| Navigation | Expo Router v4 |
| AI Gateway | Cloudflare Workers (free tier) |
| Primary AI | Google Gemini 2.0 Flash |
| Fallback AI | OpenRouter — DeepSeek R1, Qwen 2.5, Mistral 7B |
| Build | EAS Build (arm64-v8a, ~25MB APK) |
| CI/CD | GitHub Actions |
| Minification | ProGuard + R8 resource shrinking |

---

## 🗺️ Roadmap

### ✅ Phase 1 (Complete)
- [x] Hybrid 2-step disease classifier + focused advisory
- [x] 14 disease classes for major Bangladesh crops
- [x] DAE/BRRI/BARI pesticide doses in Bangla
- [x] Cloudflare Worker gateway (API keys never in APK)
- [x] OpenRouter free model cascade
- [x] Offline rule-based fallback
- [x] 146 crop database, 17 agricultural tools

### 🔄 Phase 2 (Planned)
- [ ] TensorFlow Lite edge classifier (fully offline, zero API cost)
- [ ] Extended coverage: chili, jute, mustard, onion
- [ ] Pest recognition: leaf roller, whorl maggot
- [ ] Seasonal outbreak alerts by district

### 🔮 Phase 3 (Future)
- [ ] WhatsApp Bot — farmers send leaf photo → instant advice
- [ ] Messenger Bot — same via Facebook
- [ ] SMS fallback for feature phones (DAE 16123 integration)
- [ ] National pest outbreak heatmap

---

## 📊 Impact for Bangladesh

Designed to support Bangladesh's 17 million farming households:

- **Farmer advisory at scale** — instant diagnosis without visiting upazila office
- **Early pest outbreak alerts** — aggregate disease reports by district
- **Real-time crop health monitoring** — integrated weather risk engine
- **National AI advisory platform** — scalable to millions of farmers

> Built by krishi-ai-team for Bangladesh's agricultural extension ecosystem.
