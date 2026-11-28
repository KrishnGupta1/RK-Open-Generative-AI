# Website par kya banega, kya nahi — aur dikkat kaise door karein

> RK GEM AI · Krishn Gupta · Riya Gupta

## Seedha jawab

| Cheez | Local (aapke PC par) | Website (hosted) |
|---|---|---|
| Chat (LLM) | ✅ unlimited, free | ✅ free tiers / apni key |
| Image (AI) | ✅ unlimited, free (aapka GPU) | ⚠️ free tiers (limited) ya apna GPU tunnel se |
| **Video** | ✅ unlimited, free (GPU chahiye) | ⚠️ paid API, ya **apna GPU** (`/studio-remote`) |
| Voice / TTS | ✅ unlimited (edge-tts) | ✅ mostly free |
| Users / login / database | ✅ | ✅ Supabase free |

**Kyun?** Website ek *server* par chalti hai jiske paas **GPU nahi** hota. Local par GPU aapke paas hai.
Free hosting (Vercel/Cloudflare) aapko GPU kabhi nahi degi — wo sirf CPU + thoda RAM deti hai.
Isliye "unlimited free video" = **aapka GPU + internet se access** (jo humne bana diya hai).

---

## 3 raaste — jo aapke case mein best hai

### Rasta 1 — Local everything (₹0, unlimited) ⭐ best
```
Ollama (chat) + ComfyUI/Wan2GP (image+video)  →  sab aapke PC par
```
- Kharcha: ₹0, limit: nahi (bijli chhod ke)
- Dikkat: aapka PC on rehna chahiye; doston ko access dena mushkil
- Guide: `docs/LOCAL-GENERATION.md`

### Rasta 2 — Website + apna GPU (sabse smart) ⭐⭐ recommended
```
Browser → app (Vercel) → aapka ComfyUI (tunnel) → image/video
```
- Ye **already bana diya hai**: `/studio-remote` page
- Kharcha: ₹0 (Cloudflare tunnel free) ya VPS ₹400/mo
- Dikkat: tunnel URL public hota hai → password lagao; PC on rehna chahiye

```bash
# apne PC par
python main.py --listen 0.0.0.0 --port 8188
cloudflared tunnel --url http://127.0.0.1:8188
# → https://xxxx.trycloudflare.com  ko /studio-remote ke Endpoint mein daalo
```

### Rasta 3 — Cloud GPU (professional, thoda kharcha)
| Service | Rate | Free |
|---|---|---|
| **RunPod** | ~$0.2–0.4/hr (RTX 4090) | signup credits |
| **Vast.ai** | ~$0.15–0.3/hr | — |
| **Modal** | per-second billing | $30/mo free credits |
| **Google Colab** | free GPU (T4) | ✅ free, par session 12h |
| **Kaggle** | free GPU 30h/week | ✅ free |

In par ComfyUI ka template 1-click milta hai → wahi tunnel URL app mein daal do. Video banane ka
total kharcha: **~₹15–30 per 10 clips** (sirf jab render kar rahe ho). Ye sabse sasta paid rasta hai.

---

## Dikkat kya aayegi (honest list)

| Problem | Wajah | Fix |
|---|---|---|
| Free hosting par video nahi bana | serverless = no GPU | rasta 2 ya 3 use karo |
| Tunnel URL public hai | cloudflared free = no auth | ComfyUI par basic-auth, kaam ke baad tunnel band |
| 6 GB VRAM par video slow | 480p, 3–5 sec limit | chhota model (Wan 2.1 1.3B), ya Colab/RunPod |
| Vercel function timeout | 10s limit (hobby) | hum job-queue use karte hain (render ComfyUI par hota hai, app sirf poll karti hai) |
| Bandwidth khatam | video files bhaari | R2/Supabase storage + CDN |
| Free tier rate limit (OpenRouter) | daily cap | apni key, ya credit add |

---

## Architecture (jo abhi live hai)

```
┌─────────────┐        ┌──────────────────────┐        ┌────────────────┐
│  Browser    │  ────► │  RK GEM AI (Next.js) │  ────► │  ComfyUI/Wan2GP│
│ /chat       │        │  /api/rk/comfy/*     │        │  (aapka GPU)   │
│ /local      │  ◄──── │  proxy + poll        │  ◄──── │  render        │
│ /studio-remote│      └──────────────────────┘        └────────────────┘
└─────────────┘         Vercel / Cloudflare / VPS      tunnel / VPS / RunPod
```

- `GET /api/rk/comfy/ping?endpoint=` → server online? checkpoints kaunse hain?
- `POST /api/rk/comfy/render` → koi bhi ComfyUI workflow queue karo
- `GET /api/rk/comfy/job?id=` → status + output files
- `GET /api/rk/comfy/view?filename=` → file proxy (CORS ki dikkat khatam)

Security: `COMFY_ALLOWED_HOSTS` env se host allowlist laga sakte ho (public deploy par recommended).

---

## Recommendation (aapke liye)

1. **Abhi:** app Vercel par deploy karo (free) + apne PC par ComfyUI/Wan2GP + tunnel → `/studio-remote`.
   Isse aapke paas *unlimited free* image/video hoga aur website bhi live rahegi.
2. **Jab users badhein:** RunPod/Modal par GPU on-demand (per-hour) — tabhi paisa lagega jab render ho.
3. **Long term:** kuch free-tier API providers (fal/Replicate/Muapi credits) ko fallback rakho, taaki aapka PC
   off ho tab bhi users ko kuch mile.
