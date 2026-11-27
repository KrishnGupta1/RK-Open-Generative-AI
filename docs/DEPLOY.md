# 🚀 Deploy — Kaggle se pehle kya, Cloudflare kya, Vercel kya

> Owner: **Krishn Gupta** (Founder & CEO) · **Riya Gupta** (Co-Founder)

Teen alag cheezein hain. Log inhe mix kar dete hain — isliye pehle table:

| Cheez | Kya hai | Iske bina kya hota hai |
|---|---|---|
| **Vercel** | Aapki **website** ka ghar (`rkgem.vercel.app`) | Website kisi ko dikhegi nahi |
| **Kaggle** | Aapka **GPU** (video/image banata hai) | Image/video nahi banegi, baaki sab chalega |
| **Cloudflare** | **Tunnel** — Kaggle GPU tak pahunchne ka rasta | App GPU se baat nahi kar payegi |
| **Cloudflare DNS** (domain) | Apna naam `rkgem.ai` → Vercel par | Sirf `.vercel.app` URL rahega |

**Yaad rakho:** Kaggle **sirf tab** chahiye jab image/video banana ho. Website usse pehle
hi live ho sakti hai — chat, settings, gallery, sab chalega.

---

## 1️⃣ Pehle: Website live karo (Vercel) — 5 min

Kaggle ki **zarurat nahi**. Repo mein `vercel.json` already hai (submodules + build
command set kiya hua), isliye:

1. https://vercel.com → **Sign in with GitHub** (wahi account: `KrishnGupta1`)
2. **Add New… → Project** → `RK-Open-Generative-AI` → **Import**
3. Settings **change mat karo** — `vercel.json` sab handle karta hai:
   - Install: `git submodule update --init --recursive && npm install && npm run build:packages`
   - Build: `npm run build`
4. **Environment Variables** (optional, par recommended — visitor ko key daalni hi nahi padegi):

   | Key | Kahan se |
   |---|---|
   | `OPENROUTER_API_KEY` | openrouter.ai/keys (free models) |
   | `GROQ_API_KEY` | console.groq.com/keys |
   | `GEMINI_API_KEY` | aistudio.google.com/apikey |
   | `RK_PUBLIC_URL` | `https://<project>.vercel.app` |
   | `COMFY_ALLOWED_HOSTS` | `trycloudflare.com,lhr.life,pinggy.link` |

5. **Deploy** → 2–4 min → URL mil jayega: `https://rk-open-generative-ai.vercel.app`

**Free plan:** 100 GB bandwidth/mo. Chat + studio UI + model manager ke liye kaafi.
Video/image ka bhaari kaam aapke Kaggle GPU par hota hai, Vercel par nahi — isliye limit nahi tootegi.

---

## 2️⃣ Phir: GPU jodo (Kaggle) — 20 min, sirf jab banane ho

1. Kaggle → notebook → **Accelerator: GPU T4 x2** + **Internet: ON** → Save
2. Naya cell → `docs/kaggle-all-in-one.py` ka code → **Run**
3. Aakhir mein: `✅ COMFYUI URL: https://xxxx.trycloudflare.com`
4. App → `/studio-remote` → wahi URL paste → **Test** → 🟢
5. **🧩 Models** tab → jo model chahiye **⬇ Download** → **✓ Use karo**

> GPU band hone par tunnel URL mar jata hai (aur naya banta hai). Model files bhi
> session ke saath chali jaati hain — dobara notebook chalao, phir Models tab se
> download. Isi liye "download / delete / switch" aapke haath mein hai.

---

## 3️⃣ Cloudflare — sirf do kaam ke liye

### (a) Tunnel — **automatic**, aapko account nahi chahiye
`docs/kaggle-all-in-one.py` khud `cloudflared` binary chala kar
`https://xxxx.trycloudflare.com` bana leta hai. Iske liye Cloudflare login **nahi**.
Ye ek temporary rasta hai jo Kaggle tak jaata hai.

### (b) Apna domain (`rkgem.ai`) — baad me, optional
Cloudflare account sirf **DNS** ke liye:

1. Domain kharido (Cloudflare Registrar / GoDaddy / Hostinger)
2. Cloudflare → **Add site** → nameservers apne registrar mein daalo
3. DNS → **CNAME** → `@` → `cname.vercel-dns.com` (proxy off)
4. Vercel → **Settings → Domains → Add** → `rkgem.ai`

> Ye step baad me kar sakte ho — website pehle `.vercel.app` par bhi chalegi.

---

## 4️⃣ Kya upload karna padta hai? — **kuch nahi**

Sab kuch GitHub par already hai (`KrishnGupta1/RK-Open-Generative-AI`):

- Vercel **GitHub se hi code leta hai** → zip upload nahi, FTP nahi
- Kaggle notebook bhi GitHub se scripts khud download karta hai
- Aapke banaye image/video browser ki **gallery** (localStorage) mein rehte hain,
  download button se phone/laptop me

Har baar `main` branch par merge hone par Vercel **apne aap** naya version deploy
kar deta hai (Auto-deploy ON rehta hai).

---

## 5️⃣ Docker option (VPS / Hugging Face Spaces)

Repo mein `Dockerfile` bhi hai:

```bash
NEXT_OUTPUT=standalone npm run build
docker build -t rkgem .
docker run -p 3000:3000 rkgem
```

Ya Hugging Face Spaces → **Docker** SDK → repo import → free CPU par chat chalega
(GPU wahan bhi alag lagega, wahi Kaggle flow).

---

## 6️⃣ Checklist

- [ ] Vercel par project import → Deploy → URL khula
- [ ] `/chat` par message bhej kar dekha (free key ke saath)
- [ ] `/studio-remote` khulta hai
- [ ] Kaggle notebook chala → URL mila
- [ ] `/studio-remote` par URL paste → 🟢 online
- [ ] **🧩 Models** → SDXL download → Image banao → ⬇ Download
- [ ] 🎬 Video tab → Wan 2.1 → Video banao
- [ ] (optional) `rkgem.ai` domain Cloudflare se joda
