# 🌾 KrishiAI AI Gateway — Cloudflare Worker

Serverless AI gateway for Bangladesh farmers. Routes crop disease queries to multiple AI providers with automatic fallback.

## Architecture

```
App / Browser
     │
     ▼ POST { prompt, imageBase64? }
┌─────────────────────────┐
│   Cloudflare Worker     │
│   krishiai-ai-gateway   │
└──────────┬──────────────┘
           │
    ┌──────▼──────┐
    │ Gemini 2.0  │ ✅ Primary (vision + text)
    │    Flash    │
    └──────┬──────┘
           │ fail
    ┌──────▼──────────────────┐
    │  OpenRouter Free Models │ ✅ Fallback
    │  deepseek-r1            │
    │  qwen-2.5-7b            │
    │  mistral-7b             │
    └─────────────────────────┘
           │
     JSON Response
     { text, model, log }
```

## Deploy

```bash
# Install wrangler
npm install -g wrangler

# Login
wrangler login

# Set API key secrets
wrangler secret put GEMINI_API_KEY
wrangler secret put OPENROUTER_API_KEY

# Deploy
wrangler deploy
```

## API Usage

**POST** `https://krishiai-ai-gateway.<your-subdomain>.workers.dev`

```json
{
  "prompt": "ধান পাতায় বাদামী দাগ কেন হচ্ছে?",
  "imageBase64": "<optional base64 image>"
}
```

**Response:**
```json
{
  "text": "ধান পাতায় বাদামী দাগ ব্লাস্ট রোগের লক্ষণ...",
  "model": "gemini-2.0-flash"
}
```

**GET** — Health check
```json
{ "status": "ok", "service": "KrishiAI Gateway", "models": [...] }
```

## Secrets

| Secret | Description |
|--------|-------------|
| `GEMINI_API_KEY` | Google AI Studio key (aistudio.google.com) |
| `OPENROUTER_API_KEY` | OpenRouter key (openrouter.ai) |

Keys are stored as Cloudflare secrets — never exposed to users.
