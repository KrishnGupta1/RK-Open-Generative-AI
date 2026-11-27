# RK GEM AI — Hosting Guide (free se shuru)

> Owner: **Krishn Gupta** (Founder & CEO) · **Riya Gupta** (Co-Founder)
> Repo: `KrishnGupta1/RK-Open-Generative-AI` · Stack: Next.js 15 (App Router) + Node

App do hisson mein hai:

| His sa | Kya chahiye | Host |
|---|---|---|
| Chat (`/chat`, `/settings`) | Node runtime, outbound HTTPS | koi bhi Next.js host |
| Media Studio (`/studio`) | Muapi key (ya local sd.cpp/Wan2GP desktop par) | same host |
| Ollama (local models) | apna machine / VPS | serverless par nahi chalega |

---

## 1. Vercel — sabse aasan (recommended)

1. `vercel.com` par GitHub se sign-in → **Add New → Project** → repo import.
2. Framework: **Next.js** (auto-detect). Build command `npm run build`, install `npm install --legacy-peer-deps`.
3. **Environment Variables** (optional, but recommended so visitors ko key daalni hi na pade):

   ```
   OPENROUTER_API_KEY=sk-or-v1-...
   GROQ_API_KEY=gsk_...
   GEMINI_API_KEY=AIza...
   RK_PUBLIC_URL=https://<your-app>.vercel.app
   ```

4. Deploy → 1–2 minute mein live. Domain: **Settings → Domains → Add** (e.g. `rkgem.ai`).
5. Hobby plan free hai (personal/non-commercial). Commercial ke liye Pro $20/mo.

**Free plan ki limit:** 100 GB bandwidth/mo, serverless function 10s tak (streaming theek chalti hai).
Chat ke liye kaafi hai; bhaari media generation Muapi par hoti hai, isliye server load nahi badhta.

**Submodules:** Vercel build mein git submodules by default clone nahi hote. Do options:
- Studio chahiye → repo settings mein deploy key ke saath `git submodule update --init --recursive` add karein (build command: `git submodule update --init --recursive && npm install && npm run build`).
- Sirf chat chahiye → kuch karne ki zarurat nahi, chat independent hai.

---

## 2. Cloudflare Workers — India mein sabse fast

```bash
npm i -g wrangler
npx @opennextjs/cloudflare   # ya: npm create cloudflare@latest -- --framework=next
npx wrangler deploy
```

Free plan: 100k requests/day. Edge network India (BOM/DEL) mein bhi hai → latency kam.
Note: Node-specific APIs (fs, child_process) kaam nahi karte — Ollama proxy ke liye Node host chahiye.

---

## 3. Netlify

Git import → build `npm run build` → Next.js runtime auto. Free: 100 GB bandwidth, 300 build min/mo.

---

## 4. Hugging Face Spaces (Docker) — repo ka Dockerfile ready hai

1. `huggingface.co/new-space` → SDK: **Docker** → Blank.
2. Repo push karein (ya Space mein `git remote add space ...`).
3. Space ke **Settings → Variables and secrets** mein keys daalein.
4. Port 3000 default hai (`app_port: 7860` chahiye to README frontmatter mein `app_port: 3000` set karein).

Free CPU Space: 2 vCPU / 16 GB RAM, public. Sleep ho jaata hai 48h inactivity par.

---

## 5. Render / Railway / Fly.io (Node, 24×7 ke kareeb)

```bash
# Render: New → Web Service → repo → Runtime Node
Build:  npm install --legacy-peer-deps && npm run build
Start:  npm start
```
Render free: 750 h/mo, 15 min idle par sleep (cold start ~30s). Paid $7/mo se always-on.
Fly.io: `fly launch` → free allowance chhota hai, par global anycast milta hai.

---

## 6. Apna VPS + Ollama (best "totally free" combo)

Oracle Cloud **Always Free** ARM VM (4 vCPU / 24 GB RAM) par ye sab free chal jaata hai:

```bash
# 1) App
git clone https://github.com/KrishnGupta1/RK-Open-Generative-AI && cd RK-Open-Generative-AI
npm install --legacy-peer-deps && npm run build
PORT=3000 npm start &        # ya: docker compose up -d --build

# 2) Ollama (same VM)
curl -fsSL https://ollama.com/install.sh | sh
OLLAMA_HOST=0.0.0.0 ollama serve &
ollama pull llama3.2

# 3) Reverse proxy + HTTPS
sudo apt install caddy -y
echo 'rkgem.example.com { reverse_proxy localhost:3000 }' | sudo tee /etc/caddy/Caddyfile
sudo systemctl restart caddy
```

App ke **Settings → Ollama → Base URL** mein `https://ollama.example.com` (ya `http://<vps-ip>:11434/v1`) daal dein.
⚠️ Public Ollama endpoint ko Cloudflare Tunnel + Access se protect karein, warna koi bhi aapka GPU use kar lega.

---

## "Free models" kaise chalte hain (bina paisa)

| Provider | Free kya milta hai | Key kahan se |
|---|---|---|
| **OpenRouter** | `:free` models (DeepSeek, Qwen, Llama, Gemma) — daily request cap | openrouter.ai/keys |
| **Groq** | Free tier, Llama 3.3 70B tak, bahut fast | console.groq.com/keys |
| **Google Gemini** | AI Studio free tier (2.5 Flash) | aistudio.google.com/app/apikey |
| **Ollama** | Unlimited, offline — aapke CPU/GPU par | koi key nahi |
| **Custom** | vLLM / LM Studio / koi bhi OpenAI-compatible | aapka endpoint |

Visitor apni key **Settings → Providers** mein daalta hai — wo browser ke `localStorage` mein rehti hai aur sirf us request ke liye server se guzarti hai. Aap chahein to `.env` mein ek shared key rakh dein, phir visitor ko kuch nahi karna padta.

---

## Deploy checklist

- [ ] `npm run build` locally pass
- [ ] `.env` mein keys (ya intentionally khaali — BYO-key mode)
- [ ] Custom domain + HTTPS
- [ ] `RK_RATE_LIMIT` set (default 30 req/min per IP)
- [ ] Ollama public hai to uske aage auth/tunnel
- [ ] Vercel/Netlify par submodules ka build step (studio chahiye to)
- [ ] Analytics (Vercel Analytics / Umami) — optional
- [ ] `README.md` mein apna domain + screenshot update

---

## Naam / brand badalna ho to

Ek hi file edit karein: **`lib/brand.js`** — naam, tagline, founder, email, badges. Landing page, chat header, footer, settings, metadata sab wahin se aate hain.

---

## ⚡ Sabse chhota rasta

Poore deploy ka step-by-step (Vercel + Kaggle + Cloudflare, aur "kya upload karna
hai" ka jawab) → **[docs/DEPLOY.md](DEPLOY.md)**

Bottom line: **kuch upload nahi karna**. Vercel GitHub se khud code uthata hai
(`vercel.json` repo me hai), aur Kaggle sirf GPU/tunnel ke liye hai.
