# Local generation — image, video, audio (bina internet, bina paisa)

> RK GEM AI · Krishn Gupta (Founder & CEO) · Riya Gupta (Co-Founder)

Chhota jawab: **haan, video local bhi ban sakta hai** — par video image se ~50× bhaari hai.
Image local ek normal laptop par ban jaati hai; video ke liye GPU (8 GB+ VRAM) chahiye.

---

## 0. App kis-kis mode mein chal sakta hai?

| Mode | Kaise | Internet | Paisa | Video? |
|---|---|---|---|---|
| **Web (hosted)** | Vercel/CF par deploy | haan | ₹0 | ❌ (serverless GPU nahi) |
| **Desktop app** | `npm run electron:build` | nahi | ₹0 | ✅ (aapke PC ka GPU) |
| **Local server** | `npm run dev` + Ollama/ComfyUI | nahi | ₹0 | ✅ |

Desktop shell already repo mein hai (`electron/main.js` → `localInference` + `wan2gpProvider`),
matlab RK GEM AI ko local engines se baat karne ka code pehle se maujood hai.

---

## 1. Text chat local (sabse aasan)

```bash
# 1) Ollama install
curl -fsSL https://ollama.com/install.sh | sh          # Linux
# Windows/macOS: https://ollama.com/download

# 2) model kheencho (size ke hisaab se chuno)
ollama pull llama3.2        # 2 GB — 8 GB RAM par chalega
ollama pull qwen2.5:7b      # 4.7 GB — better Hindi/Hinglish
ollama pull gemma3:4b       # 3 GB — laptop friendly

# 3) check
curl http://127.0.0.1:11434/v1/models
```

RK GEM AI → `/settings` → **Ollama** → Base URL `http://127.0.0.1:11434/v1` → Save.
Ab chat fully offline chalega. (Model list auto-detect ho jaati hai.)

---

## 2. Image local — 3 raste (aasan → advanced)

### A. sd.cpp (app ke andar bundled, sirf Desktop)
`Settings → Local Models → sd.cpp` → Z-Image Turbo (2.5 GB) download → **Image Studio** mein
"Local" model chunein. Metal/CUDA/Vulkan/Vulkan-AMD — sab support.

### B. ComfyUI (recommended — image + video dono)
```bash
git clone https://github.com/comfyanonymous/ComfyUI && cd ComfyUI
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python main.py --listen 127.0.0.1 --port 8188
```
Phir ComfyUI ke andar:
- **SDXL / FLUX.1-schnell** (4-8 GB VRAM) → quality images
- **Qwen-Image / HiDream** → text rendering (posters, Hindi text bhi)
- **Real-ESRGAN / 4x-UltraSharp** → upscale

### C. API se local server (app ke "Custom" provider jaisa)
ComfyUI/StableSwarm ko API mode mein chala kar RK GEM AI se `http://127.0.0.1:8188` par request bhej sakte hain.

**Hardware sach:**
| VRAM | Kya chalega |
|---|---|
| CPU only | SD1.5 / SDXL-Turbo (1 image ≈ 1-3 min) |
| 6 GB | SDXL, FLUX.1-schnell (1024px) |
| 8-12 GB | FLUX dev, Qwen-Image, **Wan 2.1 1.3B video** |
| 16 GB+ | Wan 2.2 14B, HunyuanVideo, LTX-Video |

---

## 3. Video local — ye asli sawaal hai 🎬

Video = 100+ frames × diffusion. Isliye 3 options, sab free:

### Option 1 — Wan2GP (app ka built-in support) ⭐
[Wan2GP](https://github.com/deepbeepmeep/Wan2GP) = low-VRAM friendly video lab.
```bash
git clone https://github.com/deepbeepmeep/Wan2GP && cd Wan2GP
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python wgp.py --port 7860
```
RK GEM AI mein: **Desktop app → Settings → Local Models → Wan2GP**
→ "Local folder" mein Wan2GP ka path, ya MCP server ka URL (`http://127.0.0.1:7860`).
Phir **Video Studio** mein model = Wan 2.1 (1.3B T2V) / Wan 2.2 / Hunyuan / LTX-2.

VRAM guide:
- 6-8 GB → **Wan 2.1 1.3B** (480p, 3-5 sec) — GTX 1660 / RTX 3060 laptop bhi chalega
- 12 GB → Wan 2.1 14B (480p) / LTX-Video (fast, 720p-ish)
- 24 GB → Wan 2.2 14B 720p, HunyuanVideo

### Option 2 — ComfyUI video workflows
ComfyUI mein built-in templates: **Wan 2.2**, **LTX-Video**, **HunyuanVideo**, **CogVideoX**, **AnimateDiff**.
Text-to-video, image-to-video, aur "first frame + last frame" wale workflows free milte hain.
Model files Hugging Face se (Wan2.1-T2V-1.3B ≈ 6 GB, LTX-Video ≈ 5 GB).

### Option 3 — Image → Video trick (sasta jugaad)
1. Local image banao (FLUX/SDXL)
2. Us image ko **image-to-video** model mein daalo (Wan 2.1 I2V 1.3B)
3. ffmpeg se frames jodo / upscale karo:
```bash
ffmpeg -framerate 24 -i frame_%04d.png -c:v libx264 -pix_fmt yuv420p out.mp4
```

### Local audio/video editing — sab free
| Kaam | Tool |
|---|---|
| Voice/TTS | `edge-tts` (unlimited, free) |
| Speech-to-text | faster-whisper (`whisper.cpp`) |
| Video cut/join/subtitle | ffmpeg |
| Lip sync | Wav2Lip / LatentSync |
| Upscale | Real-ESRGAN |

---

## 4. Hosted app + local GPU — dono saath kaise?

Agar app Vercel par hai par video aapke PC par banana hai:
```bash
# PC par ComfyUI public karo (tunnel se)
cloudflared tunnel --url http://127.0.0.1:8188
# ya
ngrok http 8188
```
Jo `https://xxxx.trycloudflare.com` URL mile, wo RK GEM AI ke Settings mein daal dein.
⚠️ Us tunnel par password/auth laga dein, warna koi bhi aapka GPU use kar lega.

---

## 5. Ek line ka summary

| Chahiye | Rasta |
|---|---|
| Free chat, offline | Ollama + `/settings` |
| Free image | sd.cpp (desktop) / ComfyUI |
| **Free video** | **Wan2GP (app-integrated)** ya ComfyUI Wan 2.2 |
| Free voice | edge-tts + faster-whisper |
| GPU nahi hai | hosted API (Muapi free credits / fal / Replicate free credits) |

GPU spec bata dena (konsa laptop/PC, VRAM kitna) — main usi ke hisaab se exact model + settings
recommend kar dunga, aur chaaho to `scripts/` mein ek one-command setup script bhi likh dunga.
