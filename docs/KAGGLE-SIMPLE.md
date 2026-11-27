# Kaggle — sabse aasan tarika (1 cell, copy-paste)

> RK GEM AI · Krishn Gupta · Riya Gupta
>
> Jo screenshot mein aapne khola (blank notebook) — wo bilkul sahi jagah hai.
> Bas 3 kaam: **GPU on karo → cell paste karo → Run dabao.**

---

## STEP 1 — GPU on karo (right panel)

Aapke screenshot ke **right side panel** mein neeche **"Session options"** likha hai:

1. **Session options** par tap karo (expand hoga)
2. **Accelerator** → jo GPU dikhe wo chuno:
   - **GPU T4 x2** — ye standard option hai aur **bilkul chalta hai** (2× 16 GB). Wan 2.1 1.3B ispar ban jaata hai
   - **GPU P100** — kuch accounts ko milta hai, kai ko nahi. **Nahi dikhe to koi baat nahi, T4 x2 lo**
   - Sirf **"None"** dikhe → phone verify karo (`kaggle.com/settings` → Phone verification → Verified hona chahiye)
   - ⚠️ Accelerator badalne ke baad **Internet apne aap OFF ho jaata hai** → usko dobara ON karo
3. **Internet** → **ON** (aapke screenshot mein already on hai ✅)
4. Neeche **Save** dabao

✅ Ab panel mein "GPU P100 · Internet on" dikhega.

> Agar "GPU" option nahi dikh raha → pehle phone verify karo: https://www.kaggle.com/settings

---

## STEP 2 — Notebook saaf karo

Notebook mein jo pehle se 2-3 cells hain (numpy/pandas wale) — unhe **delete** kar do:

- Cell par tap → upar-right **🗑 trash** icon
- Ya cell select karke **Shift+Enter** se chala do, koi harm nahi (wo bas demo hai)

Ab **+ Code** dabao → ek khaali cell mil jayega.

---

## STEP 3 — Ye poora code ek cell mein paste karo

**Poora copy karo (ek hi cell):**

```python
# ========== RK GEM AI — ALL IN ONE (Kaggle GPU P100) ==========
# Ye cell: ComfyUI install + Wan 2.1 video model + public URL — sab kar deta hai.
import os, time, subprocess, sys

WORK = '/kaggle/working'
os.chdir(WORK)

print('▶ GPU check…')
!nvidia-smi --query-gpu=name,memory.total --format=csv,noheader

if not os.path.isdir('ComfyUI'):
    print('▶ ComfyUI install…')
    !git clone -q https://github.com/comfyanonymous/ComfyUI
else:
    print('▶ ComfyUI already present')

%cd /kaggle/working/ComfyUI
!pip install -q -r requirements.txt

print('▶ Wan 2.1 1.3B model download (~6 GB, 4-6 min)…')
import urllib.request, pathlib
BASE = 'https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files'
FILES = [
    ('diffusion_models/wan2.1_t2v_1.3B_fp16.safetensors', 'models/diffusion_models'),
    ('text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors', 'models/text_encoders'),
    ('vae/wan_2.1_vae.safetensors', 'models/vae'),
]
for rel, dest in FILES:
    pathlib.Path(dest).mkdir(parents=True, exist_ok=True)
    out = os.path.join(dest, os.path.basename(rel))
    if not os.path.exists(out):
        print('  ↓', os.path.basename(rel))
        urllib.request.urlretrieve(f'{BASE}/{rel}', out)
    print('  ✓', os.path.basename(rel))

print('▶ ComfyUI start…')
subprocess.Popen(
    [sys.executable, 'main.py', '--listen', '0.0.0.0', '--port', '8188'],
    stdout=open('/kaggle/working/comfy.log', 'w'), stderr=subprocess.STDOUT,
)
time.sleep(15)
print('▶ log tail:'); print(open('/kaggle/working/comfy.log').read()[-800:])

print('▶ tunnel bana rahe hain (20 second)…')
!pip install -q pycloudflared
import pycloudflared
url = pycloudflared.default_url()
print('\n' + '=' * 60)
print('  ✅ COMFYUI URL:', url)
print('  → mobile browser mein ye URL kholo, wahin video banao')
print('  → ya RK GEM AI ke /studio-remote mein Endpoint me paste karo')
print('=' * 60)
```

---

## STEP 4 — Run dabao

- Cell ke left mein **▶ (Run)** icon dabao
- **8–15 minute** lagega (model download slow hai) — phone ko lock mat karo, tab band mat karo
- Aakhir mein aisa output aayega:

```
============================================================
  ✅ COMFYUI URL: https://xxxx-yyyy-zzzz.trycloudflare.com
  → mobile browser mein ye URL kholo, wahin video banao
============================================================
```

---

## STEP 5 — Video banao (2 tarike)

### Tarika A — sirf ComfyUI (aapke liye sabse aasan) ⭐
1. Us URL ko **naye tab** mein kholo (phone par bhi chalega)
2. Left menu → **Templates** → search `Wan`
3. **"Wan 2.1 Text to Video"** chuno → workflow khul jayega
4. Prompt likho, e.g. `a girl walking in Delhi street, cinematic, golden hour`
5. **Queue** (▶ Run) dabao → 3–5 min mein video ready
6. Video `ComfyUI/output/` mein save hoti hai → right panel **Output** folder se download

### Tarika B — RK GEM AI app se
1. App kholo → `/studio-remote`
2. **Endpoint** mein woh `https://…trycloudflare.com` paste karo → **Test connection** → 🟢
3. Image render ke liye seedha "Render karo"
4. Video ke liye: ComfyUI mein ⚙️ Settings → **Enable Dev mode** → phir "Save (API format)" → JSON app mein paste

> App abhi deploy nahi hai? Tabhi **Tarika A** use karo — ComfyUI ka apna UI mobile par kaam karta hai.
> App deploy karna ho: Vercel par 5 minute (docs/HOSTING.md).

---

## Ruk jaaye / error aaye to

| Jo dikhe | Kya karein |
|---|---|
| `nvidia-smi: not found` | Step 1 dobara — Accelerator = GPU P100 **ya GPU T4 x2** |
| `pip install` fail / internet error | Step 1 → **Internet ON** |
| `CUDA out of memory` | model chhota hai laptop ke liye nahi… Kaggle par `--lowvram` lagao: cell mein `'main.py'` ke baad `'--lowvram'` add karo |
| URL nahi aaya | cell dobara Run karo; ya log dekho `/kaggle/working/comfy.log` |
| 12 ghante baad | session band → dobara Run All → **naya URL** |
| Phone par ComfyUI slow | normal hai, phone sirf display hai — kaam Kaggle ke GPU par ho raha hai |

---

## Bas itna yaad rakho

1. **GPU P100 + Internet ON**
2. **Ek cell paste + Run**
3. **URL** → browser mein kholo → **Wan 2.1 template** → **Queue**
4. ₹0 kharcha, 30 ghante/hafta

Koi bhi step atke to screenshot bhej do — main usi step ka exact fix bata dunga.

---

## 📊 Kaggle T4 x2 par kya-kya milta hai (free)

| Cheez | Kitna |
|---|---|
| GPU | **2× Tesla T4 = 15 GB + 15 GB** (30 GB total VRAM) |
| GPU quota | **30 ghante / hafta** (settings mein `00:00 / 30 hrs` dikhta hai) |
| CPU RAM | **~29 GB** |
| Disk (`/kaggle/working`) | **19.5 GB** (Wan 2.1 model ~6 GB ke baad ~13 GB bachta hai) |
| Internet | ON karna zaroori (model download ke liye) |
| Time limit | ek session **~9-12 ghante**, idle par band ho jata hai |

**Note:** P100 sirf kuch accounts ko milta hai. T4 x2 se bhi image + Wan 2.1 video
(480p, 3-5 sec) ban jaati hai — speed thodi kam, quality same.
