# RK GEM AI — Free APIs ka master list

> Founder & CEO: **Krishn Gupta** · Co-Founder: **Riya Gupta**
> Last verified: Nov 2026 (free tiers badalte rehte hain — apply karne se pehle link par confirm karein)

Legend: **✅ in-app** = RK GEM AI ke Settings mein provider ready hai · **+1 file** = `lib/providers.js` +
`lib/providerUi.js` mein entry add karke on ho jaata hai · **server** = server-side proxy chahiye.

---

## 1. Chat / LLM (text) — free

| # | Provider | Free kya | Key | Status |
|---|---|---|---|---|
| 1 | **OpenRouter** (`:free` models) | DeepSeek R1/V3, Qwen3, Llama 3.3 70B, Gemma 3, Kimi K2 — daily request cap | openrouter.ai/keys | ✅ in-app |
| 2 | **Groq** | Llama 3.3 70B, GPT-OSS 120B, Qwen3 — bahut fast, generous free tier | console.groq.com/keys | ✅ in-app |
| 3 | **Google Gemini** (AI Studio) | 2.5 Flash / Flash-Lite free tier; Pro paid | aistudio.google.com/app/apikey | ✅ in-app |
| 4 | **Cerebras** | Llama 70B @ ~2000 tok/s, free dev tier | cloud.cerebras.ai | ✅ in-app |
| 5 | **Mistral** | free "experiment" tier (1 req/s) | console.mistral.ai | ✅ in-app |
| 6 | **Together AI** | `*-Free` endpoints (Llama 3.3 70B, DeepSeek distill) | api.together.ai | ✅ in-app |
| 7 | **Ollama** (local) | unlimited, offline, private | none | ✅ in-app |
| 8 | GitHub Models | GPT-4o/GPT-4.1-mini, Llama, Phi — free playground + low rate API | github.com/settings/tokens (models:read) | +1 file |
| 9 | Cloudflare Workers AI | Llama 3.1/3.3, Qwen, Mistral — 10k neurons/day free | CF dashboard | +1 file (OpenAI-compatible `/ai/v1`) |
| 10 | Google **Vertex AI** | $300 free credits (90 din) | service account | +1 file |
| 11 | Hugging Face Inference | free monthly credits, kai models | hf.co/settings/tokens | +1 file |
| 12 | NVIDIA NIM | 1000 free credits, Llama/Nemotron | build.nvidia.com | +1 file |
| 13 | SambaNova Cloud | free tier, Llama 405B tak | cloud.sambanova.ai | +1 file |
| 14 | Hyperbolic | free credits on signup | app.hyperbolic.xyz | +1 file |
| 15 | Chutes / DeepInfra / Novita | free trials/credits | respective dashboards | +1 file |
| 16 | Cohere | trial key (command-r) | dashboard.cohere.com | server (non-OpenAI shape) |
| 17 | xAI Grok | $25/mo free credits (beta regions) | console.x.ai | +1 file |
| 18 | LM Studio / vLLM / llama.cpp | apne PC par OpenAI-compatible server | none | ✅ in-app (Custom) |

## 2. Image generation — free

| Provider | Free kya | Note |
|---|---|---|
| **Google AI Studio — Gemini 2.5 Flash Image ("Nano Banana")** | free tier, image edit + generate | best free quality |
| **Cloudflare Workers AI — Flux-1-schnell** | 10k neurons/day | fast, free |
| **Hugging Face Inference — SDXL / FLUX.1-schnell / Playground v2.5** | free credits/mo | Spaces se unlimited-ish bhi |
| **Pollinations.ai** | **key ke bina** URL-based image API | `https://image.pollinations.ai/prompt/<text>` |
| **Together AI** — FLUX.1-schnell-Free | free endpoint | rate limited |
| **NVIDIA NIM** — SDXL / Flux | free credits | |
| **Replicate** | naye account par free credits | Flux, SDXL |
| **fal.ai** | signup credits | FLUX, Qwen-Image |
| **Ollama / sd.cpp (local)** | unlimited | Stable Diffusion locally |
| **Wikipedia/Openverse/Pexels/Unsplash APIs** | free stock images/videos | real photos, not AI |
| **Leonardo.ai** | 150 free tokens/day | good anime/illustration |
| Ideogram / Recraft / Krea | free daily quota | watermark on free |

## 3. Video generation — free / sasta

| Provider | Free kya |
|---|---|
| **Google Veo (AI Studio / Gemini)** | limited free generations (2.5 Flash veo) |
| **Kling AI** | 66 free credits/day |
| **Hailuo (MiniMax)** | daily free credits |
| **Runway** | 125 one-time credits |
| **Luma Dream Machine** | free tier (watermarked) |
| **Pika** | free monthly credits |
| **Wan 2.1/2.2 (local, Wan2GP)** | fully free on your GPU |
| **LTX-Video (local)** | free, fast |
| **HunyuanVideo (local)** | free, heavy |
| **Muapi (studio ke andar)** | ₹ free credits on signup — image/video/lipsync 200+ models |

## 4. Audio / voice / music — free

| Provider | Free kya |
|---|---|
| **Edge TTS** (`edge-tts`) | unlimited free neural voices, no key |
| **Google Cloud TTS** | 1M chars/mo free (Standard) |
| **Gemini TTS** | free tier |
| **ElevenLabs** | 10k chars/mo free |
| **Play.ht / Speechify** | trial |
| **Whisper (local, faster-whisper)** | unlimited transcription |
| **Groq Whisper** | free tier, bahut fast STT |
| **Deepgram** | $200 free credits |
| **Suno / Udio** | free daily songs (watermark) |
| **MusicGen (local, via HF)** | unlimited |
| **Stable Audio / Riffusion** | free credits |

## 5. Video/audio editing, upscaling, utilities

| Kaam | Free option |
|---|---|
| Video clipping (Opus Clip jaisa) | **ffmpeg** + Whisper (local) |
| Upscale | **Real-ESRGAN** (local), Upscayl, Replicate free credits |
| Background remove | **rembg** (local), remove.bg 50/mo |
| Lip sync | Wav2Lip (local), Muapi free credits |
| Subtitles | Whisper + ffmpeg |
| Screen/AI browser | Playwright (free) |

---

## 6. RK GEM AI mein naya provider kaise add karein (2 minute)

`lib/providers.js` (server) — ek object:

```js
myprovider: {
  id: 'myprovider',
  label: 'My Free Provider',
  emoji: '🆓',
  kind: 'openai',                       // 'openai' | 'gemini'
  defaultBaseUrl: 'https://api.example.com/v1',
  requiresKey: true,
  keyHint: 'xxx-…',
  docs: 'https://example.com/keys',
  staticModels: ['model-a', 'model-b'],
  dynamicModels: true,
  supportsListModels: true,             // /models endpoint hai to true
},
```

`lib/providerUi.js` (client) — matching card (naam, rang, hint). Bas. Settings aur chat switcher khud utha lenge.

`.env` mein chahein to shared key daal dein:

```bash
MYPROVIDER_API_KEY=...
```
— phir har visitor bina key ke use kar sakta hai.

---

## 7. Free hosting + free backend (bonus)

| Cheez | Free option |
|---|---|
| Frontend/Next.js | Vercel Hobby, Cloudflare Pages, Netlify |
| Serverless functions | Vercel, CF Workers (100k/day), Deno Deploy |
| Postgres + Auth + Storage | **Supabase free** (500 MB DB, 1 GB storage) — yahi project use ho raha hai |
| Vector DB (RAG) | Supabase pgvector, Qdrant Cloud free |
| Cron | GitHub Actions, CF Cron |
| CDN | Cloudflare (unlimited bandwidth free) |
| Error tracking | Sentry free |
| Analytics | Umami self-host, Vercel Analytics |
| E-mail | Resend 3k/mo, Brevo 300/day |

**India ke users ke liye best combo:** Cloudflare (CDN/edge) + Vercel ya CF Workers (app) + Supabase
`ap-south-1` Mumbai (DB/auth) + R2/Storage. Latency ~20–40 ms, cost ₹0.
