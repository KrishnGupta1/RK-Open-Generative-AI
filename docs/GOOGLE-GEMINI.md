# Apna Google / Gemini account — kaise kaam karta hai

> RK GEM AI · Krishn Gupta (Founder & CEO) · Riya Gupta (Co-Founder)

## TL;DR (sach-sach)

| Kya chah rahe the | Hota hai ya nahi | Kya karna hoga |
|---|---|---|
| Google se login karke **consumer Gemini app** (gemini.google.com) ki subscription API mein use karna | ❌ Nahi hota | Google kisi third-party app ko ye access nahi deta |
| Google se login karke **apna Google Cloud project → Gemini API key** use karna, jisme billing/credits ho | ✅ Hota hai (yahi Antigravity/Cloud Code model hai) | 3 click: project + API enable + key |
| Google AI Studio ka **free tier** (2.5 Flash) | ✅ Hota hai | key `aistudio.google.com/apikey` |
| Key har device par available ho (phone + laptop) | ✅ Hota hai | Google se sign in → key account vault mein |

**Ek line mein:** Gemini ka "premium" API side par Google Cloud project + billing hai. App aapke Google account ke
projects detect kar leta hai, usi project ki key banwata hai, phir wo key aapke account mein save kar deta hai.
Usage aapke plan/credits se jaata hai — bilkul jaise Antigravity aapke Google account se chalta hai.

---

## App mein flow (jo bana diya hai)

1. **`/settings` kholen** → "Apna Google / Gemini account jodein" card.
2. **Google se sign in** → Supabase (aapka hi project, region `ap-south-1` Mumbai) OAuth sambhalta hai.
   Google consent screen par "Cloud projects dekhne" ki permission maangi jaati hai (read-only).
3. Sign in hote hi app aapke projects check karta hai:
   - `cloudresourcemanager.projects.list`
   - `serviceusage … generativelanguage.googleapis.com` → enabled ya nahi
   - `cloudbilling … billingInfo` → billing on hai ya nahi
4. Ready project mil gaya → **"1. AI Studio par API key banayein"** button usi project ke saath khulta hai.
   Kuch na mile → **"2. Generative Language API enable karein"** ka direct link.
5. Key paste → **Save & use** → key (a) browser mein, aur (b) signed-in ho to account vault mein
   (`rkgem_user_keys`, Supabase RLS se protected — sirf aap padh sakte hain).
6. Ab `/chat` par provider = ✨ Gemini, model = gemini-2.5-flash / pro. Bas.

Agar consent screen par Cloud scope reject kar dein, app automatically manual raste par chala jaata hai — koi error
wall nahi.

---

## Ek baar ka setup (Google side)

1. **Google Cloud project** banayein (ya purana chunein): https://console.cloud.google.com/projectcreate
2. **Generative Language API enable** karein:
   https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
3. **API key banayein**: https://aistudio.google.com/apikey → *Create API key* → project chunein.
   (Ya `console.cloud.google.com/apis/credentials` se bhi ban sakti hai.)
4. Key ko restrict karein (recommended): *Credentials → API key → Restrict key* → sirf Generative Language API.
5. Billing on karna **optional** hai:
   - free tier chahiye → billing off, limits kam (2.5 Flash free tier).
   - zyada limits / paid tier → billing on; usage usi Google account ke plan/credits se.

> **Security:** key sirf aapke browser aur (agar signed in ho) aapke Supabase row mein rehti hai. App kisi bhi
> user ki key kisi doosre user ko nahi dikha sakta (RLS `auth.uid() = user_id`).

---

## Google OAuth ko production par enable karna (5 min)

Supabase Dashboard → **Authentication → Providers → Google** → enable, aur Google Cloud Console →
*APIs & Services → Credentials → OAuth client ID (Web)* mein ye Authorized redirect URI daalein:

```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

App ki taraf allowed URLs (Supabase → **Authentication → URL Configuration**):

```
http://localhost:3000/**
https://rkgem.ai/**
https://rk-gem-ai.vercel.app/**
https://*.e2b.app/**
```

(Is repo ke Supabase project par ye already set kar diya gaya hai — Google client ID/secret aapko Dashboard
mein paste karna hai, wahi ek step user ke haath mein hai.)

---

## Sirf chat chahiye, account nahi? (BYO key)

Bilkul theek. `/settings` mein key paste karke "Sirf is browser mein" chunein — bas. Account optional hai.

## Gemini ke bajaye Vertex AI?

Vertex AI (enterprise) same idea hai par service-account JSON chahiye. Us case mein provider = **Custom** rakhein,
base URL apne proxy ka daal dein. Chahiye to hum `vertex` provider bhi add kar sakte hain — bolo.
