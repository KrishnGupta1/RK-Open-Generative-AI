# 🧩 Model Control — GPU par poora control, app se

Aapka GPU, aapka model — lekin **saara button hamare app me**. Kaggle/Colab me
kuch type nahi karna, sirf ek baar tunnel URL paste karna.

## Kaise kholo

`/studio/apna-gpu` → upar **🧩 Models** (ya header par "🧩 Models" button).

## Kya-kya kar sakte ho

| Kaam | Kaise | Kahan hota hai |
|---|---|---|
| **Download** | model card par **⬇ Download** | GPU par seedha (ComfyUI ke models/ folder me) |
| **Progress** | live % + MB/s | wahi card |
| **Switch** | **✓ Use karo** | studio ka prompt usi model par chala jata hai |
| **Delete** | **🗑 Delete** → **Pakka delete?** | file `models/.rkgem-trash/` me jaati hai (recoverable) |
| **Disk/VRAM dekho** | upar ki patti | GPU ka free space + VRAM |

## Catalog (jo abhi available hai)

| Model | Type | Size | VRAM | Note |
|---|---|---|---|---|
| SDXL Base 1.0 | image | 6.9 GB | 6 GB | sabse reliable |
| SDXL Turbo | image | 6.9 GB | 6 GB | 1–4 step, sabse fast |
| Z-Image Turbo | image | 2.5 GB | 6 GB | kam disk, 8-step |
| Wan 2.1 T2V 1.3B | video | 3.6 GB | 8 GB | text → 3–5 s clip |
| Wan 2.1 I2V 14B (fp8) | video | 14.3 GB | 16 GB | photo → video |
| UMT5-XXL encoder | helper | 5.0 GB | 2 GB | Wan ke liye zaroori |
| Wan 2.1 VAE | helper | 0.25 GB | 1 GB | Wan ke liye zaroori |
| CLIP Vision H | helper | 1.2 GB | 1 GB | sirf i2v |

Naya model add karna ho to `lib/modelControl.js` ke `MODELS` array me ek entry
daal do — UI khud dikha dega.

## Free quota bachane ka tarika

Kaggle: 30 ghante/hafta + 19.5 GB disk. Isliye:

1. Sirf jo model use karna hai wahi download karo (Wan helper files apne aap list me dikhti hain)
2. Kaam khatam → **🗑 Delete** → disk free
3. Zarurat pade → **⬇ Download** dobara (2-4 min me wapas)
4. Session band hone par GPU disk bhi chala jata hai — koi charge nahi

## Andar kaise kaam karta hai

```
Browser (/studio/apna-gpu → Models)
        │
        ├─ GET  /api/rk/comfy/models?endpoint=…          → catalog + kya installed hai
        ├─ POST /api/rk/comfy/models/download            → { jobId }
        ├─ GET  /api/rk/comfy/models/download?job=…      → live %
        └─ POST /api/rk/comfy/models/delete              → trash me move
                       │
                       ▼
        tunnel (trycloudflare)
                       │
        ┌──────────────┴───────────────┐
        │  ComfyUI  +  rkgem_agent     │   ← docs/rkgem_agent.py (auto-installed)
        │  /rkgem/status /models       │
        │  /rkgem/download /delete     │
        └──────────────────────────────┘
```

Agent ComfyUI ke **custom node** ke roop me chalta hai, isliye **alag port ya
alag tunnel URL ki zarurat nahi** — jo URL aapke paas hai, wahi kaafi hai.

Agar purana notebook chal raha ho (agent ke bina) to Models tab phir bhi khulega
aur ✅/❌ dikhayega (`/object_info` se), par Download/Delete ke liye naya script
chalana padega: `docs/kaggle-all-in-one.py`.

## Safety

- Sirf `models/<folder>` ke andar likhta hai; filename basename hona zaroori
- Delete = trash me move (`models/.rkgem-trash/`), turant destroy nahi
- Sirf https URLs, sirf catalog me declared URL hi download hota hai
- Koi API key, koi third-party account nahi
