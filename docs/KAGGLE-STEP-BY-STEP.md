# Kaggle — 15 minute mein FREE GPU par video (step by step)

> RK GEM AI · Krishn Gupta (Founder & CEO) · Riya Gupta (Co-Founder)
>
> Ye guide **ekdum shuru se** hai — Kaggle account tak. Har step pe kya dabana hai, likha hai.

---

> **Confuse ho rahe ho?** 1-cell wala short version padho: **[KAGGLE-SIMPLE.md](KAGGLE-SIMPLE.md)**
> Usme sirf 3 step hain — GPU on, ek cell paste, Run. App ki bhi zarurat nahi.

## 🔗 Zaroori links (bookmark kar lein)

| Kya | Link |
|---|---|
| Kaggle (signup) | https://www.kaggle.com/account/login |
| Phone verify (GPU ke liye zaroori) | https://www.kaggle.com/settings |
| Naya notebook | https://www.kaggle.com/code |
| **Hamara ready notebook (GitHub)** | https://github.com/KrishnGupta1/RK-Open-Generative-AI/blob/main/docs/kaggle-rk-gem-video.ipynb |
| Raw download link (Kaggle "Import" ke liye) | https://raw.githubusercontent.com/KrishnGupta1/RK-Open-Generative-AI/main/docs/kaggle-rk-gem-video.ipynb |
| Hamara app (GPU jodne ke liye) | `https://<aapka-app>/studio-remote` |
| ComfyUI docs | https://docs.comfy.org |
| Wan 2.1 model page | https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged |

---

## STEP 1 — Kaggle account banao (2 min)

1. https://www.kaggle.com/account/login kholo
2. **"Sign up with Google"** dabao (sabse aasan — Gmail chahiye)
3. Naam + username daalo → **Create Account**

✅ Ho gaya: aapka account ready.

---

## STEP 2 — Phone verify karo (GPU unlock — 3 min) ⚠️ sabse zaroori

Kaggle **free GPU sirf verified phone** par deta hai. Bina iske "GPU" option hi nahi dikhega.

1. https://www.kaggle.com/settings kholo
2. Page ke **Phone Verification** section tak scroll karo
3. Country = **India (+91)**, apna mobile number daalo → **Send code**
4. SMS mein aaya 6-digit code daalo → **Verify**

✅ Ho gaya: ab GPU use kar sakte ho (30 ghante/hafta free).

---

## STEP 3 — Notebook import karo (2 min)

**Tarika A (recommended):**
1. https://www.kaggle.com/code kholo → **"New Notebook"**
2. Upar-left **File → Import Notebook**
3. **Upload** tab → GitHub se download kiya hua `kaggle-rk-gem-video.ipynb` file chuno
   (ya **URL** tab → paste karo:
   `https://raw.githubusercontent.com/KrishnGupta1/RK-Open-Generative-AI/main/docs/kaggle-rk-gem-video.ipynb`)

**Tarika B (manual):** Naya kholo aur cell-by-cell neeche diya hua code paste karo.

---

## STEP 4 — GPU ON karo (30 sec) ⚠️

1. Notebook ke **right side panel** mein **"Session options"** (ya top-right **⋮ → Session options**)
2. **Accelerator** → **GPU P100** chuno
3. **Save**

✅ Panel mein "GPU P100" dikhna chahiye. (Free tier par T4 kabhi-kabhi milta hai, P100 best hai.)

---

## STEP 5 — Model + Internet ON (1 min)

1. Right panel → **Session options**
2. **Internet** → **ON** (warna model download nahi hoga)
3. Save

---

## STEP 6 — Run All (15–20 min, haath lagane ki zarurat nahi)

1. Top menu **Run → Run All** (ya ▶️ "Run all" button)
2. Pehla cell batayega: `GPU: Tesla P100-PCIE-16GB` — matlab sab theek
3. Cell 3 mein ~6 GB models download honge (4–6 min, progress bar dikhega)
4. Aakhri cell mein **`https://xxx-xxx.trycloudflare.com`** URL aayega 👇

```
▸ internet: ok
https://wooden-cathedral-alpha.trycloudflare.com     ← YAHI COPY KARO
```

> ⚠️ URL **sirf is session ke liye** hai. Session band (12 ghante) = naya URL.

---

## STEP 7 — RK GEM AI se jodo (1 min)

1. Apni app kholo → **`/studio-remote`** (ya sidebar → 💻 Local → "Apna GPU website se use karo")
2. **Endpoint** box mein woh `https://xxx.trycloudflare.com` paste karo
3. **Test connection** dabao →
   - 🟢 `ComfyUI online (0.3.x)` = perfect
   - Checkpoints list bhi dikhegi
4. **Render karo** → image aa jayegi (SDXL base model chahiye hoga)

### Image ke liye ek chhota model (pehli baar)
Notebook mein ek extra cell chalao (checkpoint ke liye):
```python
!wget -q -O /kaggle/working/ComfyUI/models/checkpoints/sd_xl_base_1.0.safetensors \
  https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors
```
(6.9 GB — ek baar. Uske baad `/studio-remote` → Checkpoint mein `sd_xl_base_1.0.safetensors`.)

---

## STEP 8 — VIDEO banao (Wan 2.1) 🎬

Image ho gayi? Ab video:

1. ComfyUI ka UI kholo: wahi tunnel URL browser mein
2. Left menu **Templates → Video → "Wan 2.1 Text to Video"** (ya `Wan 2.1 I2V` agar image se video)
3. Prompt likho, **Queue** dabao → video ban jaayega (P100 par 3–5 min per 3 sec clip)
4. **API format** chahiye to: ⚙️ **Settings → "Enable Dev mode Options"** ON → phir **"Save (API Format)"** button
5. Us JSON ko `/studio-remote` ke workflow box mein paste karo → ab website se hi video render hoga

---

## STEP 9 — Session band hone se pehle (important!)

| Cheez | Kya karo |
|---|---|
| Banayi hui video/image | ComfyUI `output/` folder → right panel **Output** se download |
| Model dobara download na ho | Kaggle **Datasets** mein `models/` folder upload karo (next session mein `/kaggle/input/...` se copy) |
| Tunnel URL | naya session = **naya URL**, app mein update karo |
| 30 ghante/week | Kaggle **Settings → Usage** mein dekh sakte ho |

---

## Common dikkatein — turant fix

| Error | Matlab | Fix |
|---|---|---|
| `GPU: NO GPU` | Accelerator on nahi | Step 4 dobara |
| `Internet is disabled` | Internet off | Step 5 |
| `CUDA out of memory` | model bada | chhota model (Wan 1.3B), ya `--lowvram` flag: `python main.py --lowvram` |
| `cloudflared: command not found` | install nahi hua | cell dobara chalao: `!pip install -q pycloudflared` |
| Tunnel URL nahi aaya | 15-20 sec wait | cell dobara chalao, ya cell output scroll karo |
| `/studio-remote` par `502` | tunnel band / URL purana | naya URL paste karo |
| `ping ok` par render fail | checkpoint missing | Step 7 ka checkpoint cell chalao |
| Kaggle "GPU quota exceeded" | 30h/week khatam | next Monday, ya Colab/RunPod |

---

## (Optional) Colab par bhi wahi cheez

1. https://colab.research.google.com → **New notebook**
2. **Runtime → Change runtime type → T4 GPU**
3. Wahi 4 cells paste karo (Kaggle wale), bas paths `/content/` kar do:
   `!git clone https://github.com/comfyanonymous/ComfyUI /content/ComfyUI`
4. Tunnel: `!pip install pycloudflared && python -c "import pycloudflared;print(pycloudflared.default_url())"`

Colab free = **12 ghante session**, Kaggle se kam stable, par kaam karta hai.

---

## Mujhe kya dena hoga (jab aap aage badho)

| Cheez | Kyun | Kahan se |
|---|---|---|
| **Tunnel URL** | app ko GPU se jodne ke liye | Kaggle cell output |
| **Kaggle username** | main notebook aapke naam se link/test kar sakta hoon | kaggle.com/settings |
| **Supabase URL + anon key** | login/keys vault ke liye (optional) | dashboard → Settings → API |
| **Google OAuth client id/secret** | Google sign-in (optional) | Google Cloud Console |

⚠️ **Kabhi mat dena:** `service_role` key, Google password, ya kisi ka private token.

---

## Checklist (print kar lo)

- [ ] Kaggle account (Google se)
- [ ] Phone verify ✅ (bina iske GPU nahi)
- [ ] Notebook import
- [ ] Accelerator = **GPU P100**
- [ ] Internet = **ON**
- [ ] Run All → tunnel URL copy
- [ ] `/studio-remote` mein paste → Test connection 🟢
- [ ] Checkpoint download (SDXL)
- [ ] Render test ✅
- [ ] Wan 2.1 template → Save (API format) → video

Bas! 15 minute, ₹0 kharcha. 🎉
