# Free GPU — sach, options, aur RK GEM AI se kaise jodna hai

> RK GEM AI · Krishn Gupta (Founder & CEO) · Riya Gupta (Co-Founder)

## Pehle ek line ka sach

**Koi bhi company 24×7 free GPU nahi deti.** GPU mahanga hai (₹1.5–3 lakh ek card, ya ₹25–60/hour cloud par).
Jo "free" milta hai wo **time-limited** hota hai — 12 ghante ka session, 30 ghante/hafta, ya $5–30 credits.

Lekin **haan — free GPU par video ban sakta hai**, agar aap in 4 me se koi rasta chunein. Neeche exact numbers.

---

## 1. Free GPU options — numbers ke saath

| # | Service | GPU | Free kitna | Video possible? | Nukkad |
|---|---|---|---|---|---|
| 1 | **Google Colab (free)** | T4 16 GB | ~12 ghante/session, din mein 1–2 session | ✅ Wan 2.1 1.3B (480p, 3-5s), SDXL images | best free shuruaat |
| 2 | **Kaggle Notebooks** | **P100 16 GB** ya 2× T4 | **30 ghante/hafta** | ✅ Wan 2.1 / LTX-Video | Colab se zyada stable |
| 3 | **HF Spaces (ZeroGPU)** | A100 40 GB (shared) | daily quota (login se) | ⚠️ chhote demos | app host kar sakte ho |
| 4 | **Modal** | T4/A10G | **$30/month credits** (~40–60 min A10G) | ✅ | card verify lagta hai |
| 5 | **Lightning AI** | L4/T4 | 1 month free trial | ✅ | trial ke baad paid |
| 6 | **RunPod** | RTX 4090 | signup credits (~$5) | ✅ | ₹0.2–0.35/hr baad mein |
| 7 | **Paperspace** | Free GPU (M4000 8 GB) | limited hours | ⚠️ bahut slow | queue lamba |
| 8 | **Vast.ai** ⚠️ | RTX 3090/4090 | **NAHI — 100% paid** (~$0.15–0.35/hr) | ✅ | "Vast" = bahut, free nahi |

**Aapka "vast" ka matlab Vast.ai tha?** Us par ₹0 nahi milta — par sabse sasta hai: ₹12–30/hour.
10 video clips ≈ 1 ghanta ≈ **₹20–30**.

---

## 2. Kitna GPU/VRAM chahiye — video ke liye

| Model | Min VRAM | Output | Free GPU par realistic? |
|---|---|---|---|
| SDXL / FLUX-schnell (image) | 6–8 GB | 1024px | ✅ T4/P100 par aaram se |
| **Wan 2.1 1.3B** (video) | **8 GB** (6 GB par jugaad) | 480p, 3–5 sec | ✅✅ Colab T4 / Kaggle P100 |
| LTX-Video 2B | 8–12 GB | 480-720p, fast | ✅ Kaggle P100 |
| Wan 2.1 14B | 16–24 GB | 480p | ⚠️ Kaggle P100 (slow) |
| Wan 2.2 14B / HunyuanVideo | 24–48 GB | 720p | ❌ free par nahi, RunPod A100 |

**Aapke liye:** free GPU (Colab/Kaggle) = **image unlimited-ish + 480p video 3-5 sec**.
720p / long video chahiye = RunPod/Vast par ₹20-30 per session.

---

## 3. Free GPU par video — step by step (15 minute)

### Rasta A — Kaggle (recommended, 30h/week free)

1. `kaggle.com` → **Create → New Notebook** → Settings → **Accelerator: GPU P100** (phone verify karna padta hai)
2. Cell 1 — ComfyUI install:
```bash
!git clone https://github.com/comfyanonymous/ComfyUI
%cd ComfyUI
!pip install -r requirements.txt
!pip install pycloudflared
```
3. Cell 2 — **Wan 2.1 1.3B model download** (~6 GB):
```bash
!mkdir -p models/diffusion_models models/text_encoders models/vae
!wget -P models/diffusion_models https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/diffusion_models/wan2.1_t2v_1.3B_fp16.safetensors
!wget -P models/text_encoders https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors
!wget -P models/vae https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/vae/wan_2.1_vae.safetensors
```
4. Cell 3 — ComfyUI + **public tunnel** (yahi RK GEM AI se jodega):
```bash
!python main.py --listen 0.0.0.0 --port 8188 &
!pip install cloudflared
!cloudflared tunnel --url http://127.0.0.1:8188
```
5. Terminal mein jo `https://xxx.trycloudflare.com` aaye → copy karo.
6. **RK GEM AI → `/studio/apna-gpu` → Endpoint mein paste → Render.**
   Image ke liye ready hai; video ke liye ComfyUI ka *Wan 2.1 T2V* template kholo → **Save (API format)** → us JSON ko `/studio/apna-gpu` ke renderer mein bhejo.

### Rasta B — Colab (12h session)
Wahi steps, bas `!pip install` ke baad `Runtime → Change runtime type → T4 GPU`.
Colab free mein tunnel zyada der nahi chalta — **Kaggle better hai**.

### Rasta C — HF Space (ZeroGPU)
Model demo chahiye to HF par `ZeroGPU` decorator se Space banao — daily quota free, par video queue lambi.

---

## 4. Dhyan rakhne wali baatein (security)

- Tunnel URL **public** hota hai. ComfyUI par `--basic-auth user:pass` laga do, ya kaam ke baad notebook band.
- Free GPU session **12h baad band** ho jaata hai → naya tunnel URL aayega.
- Kaggle par **phone verification** chahiye GPU ke liye (free hai).
- Free tier par **commercial use** ki shartein parh lena (Kaggle/Colab ToS).
- Model files ~6-8 GB download hote hain, har naye session par phir se (Kaggle *Datasets* mein save kar lo to bach jayega).

---

## 5. Aasan shabdon mein recommendation

| Aap kya chahte ho | Rasta | Kharcha |
|---|---|---|
| Sirf sikhna / test karna | **Kaggle free (P100)** | ₹0 |
| Roz thoda video banana | Kaggle 30h/week | ₹0 |
| Roz 10+ clips, 720p | **RunPod/Vast** per-hour | ₹20–30/session |
| Total control, privacy | apna GPU (RTX 3060 12 GB) | ₹25k one-time |

**Mera suggestion:** Kaggle se shuru karo (free), aur `/studio/apna-gpu` se jod do — setup 15 minute ka hai.
Jab clients aayen, tab RunPod par shift karo. Aapka code same rahega, sirf endpoint badlega.

> GPU bata do (ya "koi nahi") — main usi ke liye exact model + settings ka final checklist bana dunga.
