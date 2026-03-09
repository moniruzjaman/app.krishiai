# 🌾 KrishiAI AI Gateway v2 — Cloudflare Worker

Serverless Hybrid Crop Doctor for Bangladesh farmers. Combines lightweight vision classification with AI reasoning to detect crop diseases accurately at low cost.

---

## 🏗️ Architecture — Hybrid Crop Doctor

```
Farmer Mobile App
      ↓
      POST { imageBase64, cropHint }
      ↓
┌─────────────────────────────────────┐
│   Cloudflare Worker                 │
│   app-krishiai.mithun-hstu.workers.dev │
│                                     │
│  Step 1: classifyDisease()          │
│  → Gemini vision (20 tokens only)   │
│  → Returns disease label            │
│  e.g. "rice_blast"                  │
│                ↓                    │
│  Step 2: getAdvisory()              │
│  → Disease-specific Bangla prompt   │
│  → Text only (no image = 80% cheaper│
│  → 600 tokens focused advisory      │
└────────────┬────────────────────────┘
             ↓
    ┌────────────────┐
    │ Gemini 2.0     │ ← Primary
    │ Flash          │
    └───────┬────────┘
            │ fail
    ┌───────▼────────────────────┐
    │ OpenRouter Free Models     │ ← Fallback
    │ • deepseek/deepseek-r1     │
    │ • qwen/qwen-2.5-7b         │
    │ • mistralai/mistral-7b     │
    └────────────────────────────┘
             ↓
    Bangla advisory for farmer
```

### Why This Architecture?

| | Old Approach | New Hybrid |
|---|---|---|
| Image sent to AI | Every time (full) | Step 1 only (20 tokens) |
| Advisory tokens | ~1500 per query | ~620 per query |
| Cost at scale | High | **~70% cheaper** |
| Accuracy | Generic | Disease-specific |
| Response time | Slow | Faster |

---

## 🦠 Disease Coverage (14 Classes)

### Rice
| Code | Disease | বাংলা |
|------|---------|-------|
| `rice_blast` | Leaf/Neck Blast | ব্লাস্ট রোগ |
| `rice_blight` | Bacterial Leaf Blight | ব্যাকটেরিয়াল ব্লাইট |
| `rice_brown_spot` | Brown Spot | বাদামী দাগ রোগ |
| `rice_sheath_blight` | Sheath Blight | শিথ ব্লাইট |
| `rice_bph` | Brown Planthopper | বাদামী গাছফড়িং |
| `rice_stem_borer` | Stem Borer | কাণ্ড ছিদ্রকারী পোকা |

### Other Crops
| Code | Disease | বাংলা |
|------|---------|-------|
| `wheat_rust` | Stripe Rust | গমের মরিচা রোগ |
| `potato_late_blight` | Late Blight | আলুর মড়ক রোগ |
| `tomato_leaf_curl` | Leaf Curl Virus | টমেটোর পাতা মোড়ানো |
| `tomato_blight` | Early Blight | আগাম ধ্বসা রোগ |
| `brinjal_borer` | Shoot & Fruit Borer | বেগুনের ডগা ছিদ্রকারী |

### Nutrient Deficiencies
| Code | Problem | বাংলা |
|------|---------|-------|
| `nitrogen_deficiency` | Nitrogen deficiency | নাইট্রোজেন ঘাটতি |
| `zinc_deficiency` | Zinc deficiency / Khaira | জিংক ঘাটতি |
| `healthy` | No disease | পাতা সুস্থ |

---

## 🔌 API Usage

**Base URL:** `https://app-krishiai.mithun-hstu.workers.dev`

### GET — Health Check
```bash
curl https://app-krishiai.mithun-hstu.workers.dev
```
```json
{
  "status": "ok",
  "service": "KrishiAI Gateway v2",
  "version": "2.0.0",
  "architecture": "hybrid-crop-doctor",
  "diseases_covered": 14
}
```

### POST — Diagnose from Image
```json
{
  "imageBase64": "<base64 encoded image>",
  "cropHint": "ধান"
}
```
**Response:**
```json
{
  "text": "ধানের ব্লাস্ট রোগ শনাক্ত হয়েছে...",
  "model": "gemini-2.0-flash",
  "diseaseKey": "rice_blast",
  "diseaseName": "ধানের ব্লাস্ট রোগ",
  "architecture": "hybrid-2step"
}
```

### POST — Chat (text only)
```json
{
  "prompt": "ধান পাতায় বাদামী দাগ কেন হয়?"
}
```
**Response:**
```json
{
  "text": "ধান পাতায় বাদামী দাগ হলো...",
  "model": "gemini-2.0-flash"
}
```

---

## 🔐 Secrets Required

Set in Cloudflare Workers dashboard → Settings → Variables & Secrets:

| Secret | Description | Get From |
|--------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `OPENROUTER_API_KEY` | OpenRouter key (free models) | [openrouter.ai](https://openrouter.ai) |

---

## 🚀 Deploy

Deployment is automated via GitHub Actions on every push to `worker/worker.js`.

**Manual deploy:**
1. Go to [GitHub Actions](https://github.com/moniruzjaman/app.krishiai/actions)
2. Click **"🚀 Deploy Cloudflare Worker"**
3. Click **"Run workflow"**

**Required GitHub Secrets:**
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

---

## 🗺️ Roadmap

### Phase 1 ✅ (Current)
- [x] Hybrid 2-step classifier + advisory
- [x] 14 disease classes for major Bangladesh crops
- [x] Bangla advisory with DAE/BRRI/BARI pesticide doses
- [x] OpenRouter free model fallback

### Phase 2 (Planned)
- [ ] TensorFlow Lite edge classifier (offline, no API cost)
- [ ] Disease coverage: chili, jute, mustard, onion
- [ ] Pest recognition: leaf roller, whorl maggot
- [ ] Seasonal outbreak alerts

### Phase 3 (Future)
- [ ] WhatsApp Bot — farmers send leaf photo → get advice
- [ ] Messenger Bot — same via Facebook
- [ ] SMS fallback for feature phones (16123 integration)
- [ ] National pest outbreak heatmap

---

## 🌍 Impact for Bangladesh

With integration into DAE's extension network, this system can support:

- **Farmer advisory at scale** — instant diagnosis without visiting upazila office
- **Early pest outbreak alerts** — aggregate reports by district/upazila
- **Real-time crop health monitoring** — integration with weather risk engine
- **National agricultural AI platform** — scalable to millions of farmers

> *"Eventually your system becomes a digital crop doctor."*

---

## 📁 Files

```
worker/
  worker.js      — Cloudflare Worker source (hybrid crop doctor)
  wrangler.toml  — Cloudflare deployment config
  README.md      — This file
```
