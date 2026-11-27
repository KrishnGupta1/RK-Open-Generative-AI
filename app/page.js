import Link from 'next/link';
import { BRAND } from '@/lib/brand';

export const metadata = {
  title: `${BRAND.name} — Free AI Chat & Studio by ${BRAND.founder}`,
  description: BRAND.description,
};

const PROVIDERS = [
  { emoji: '✨', name: 'Google Gemini', desc: 'Apna Google account jodein — subscription-aware key', tint: '#22d3ee' },
  { emoji: '🛰️', name: 'OpenRouter', desc: 'Free ":free" models — DeepSeek, Qwen, Llama, Gemma', tint: '#8b5cf6' },
  { emoji: '⚡', name: 'Groq', desc: 'Sabse fast inference — Llama 3.3 70B, GPT-OSS', tint: '#f97316' },
  { emoji: '🦙', name: 'Ollama', desc: 'Bilkul local — offline, private, unlimited', tint: '#84cc16' },
  { emoji: '🧠', name: 'Cerebras', desc: '2000 tok/s free tier — Llama 70B', tint: '#f43f5e' },
  { emoji: '🌬️', name: 'Mistral', desc: 'Free experiment tier — Mistral Large', tint: '#facc15' },
  { emoji: '🤝', name: 'Together AI', desc: 'Llama 3.3 70B ke free endpoints', tint: '#38bdf8' },
  { emoji: '🔧', name: 'Custom', desc: 'Koi bhi OpenAI-compatible endpoint', tint: '#a3a3a3' },
];

const FEATURES = [
  { icon: '🔀', title: 'Model switcher', body: 'Ek click mein provider badlein — koi lock-in nahi. Model list live fetch hoti hai.' },
  { icon: '🔑', title: 'Bring your own key', body: 'Keys sirf aapke browser mein. Server kuch store nahi karta.' },
  { icon: '🔓', title: 'Google login (optional)', body: 'Sign in karein to Gemini key aapke account mein sync — phone aur laptop dono par.' },
  { icon: '🎬', title: 'Media studio included', body: '200+ image/video models ka studio RK GEM AI ke andar hi hai.' },
  { icon: '🌐', title: 'Hinglish-first', body: 'Hindi, Hinglish ya English — jis bhasha mein poochhen, usi mein jawab.' },
  { icon: '🪶', title: 'Light + dark', body: 'Designed for phones pehle, desktop pe shaandar.' },
  { icon: '💸', title: 'Zero cost', body: 'MIT licensed, self-host free, free tiers pe chalta hai.' },
];

const HOSTING = [
  { name: 'Vercel', best: 'Best overall', free: 'Hobby (free)', note: 'Next.js ka ghar. 1 command deploy, auto HTTPS + custom domain.', url: 'https://vercel.com/new' },
  { name: 'Cloudflare Workers', best: 'India ke liye fast', free: 'Free plan', note: 'Edge par chalta hai, India mein latency kam. Node APIs thodi limited.', url: 'https://developers.cloudflare.com/workers/' },
  { name: 'Netlify', best: 'Easy drag & drop', free: 'Free tier', note: 'Git connect karke deploy — Next.js runtime support ke saath.', url: 'https://app.netlify.com/start' },
  { name: 'Hugging Face Spaces', best: 'Docker wale ke liye', free: 'Free CPU space', note: 'Dockerfile already repo mein hai — seedha Space bana dein.', url: 'https://huggingface.co/new-space' },
  { name: 'Render', best: 'Always-on server', free: 'Free web service', note: 'Sleep ho jaata hai free plan par; paid $7/mo se 24×7.', url: 'https://render.com' },
  { name: 'Apna VPS', best: 'Full control + Ollama', free: 'Oracle free tier', note: 'Oracle Cloud Always Free ARM VM par Ollama bhi chala sakte hain.', url: 'https://www.oracle.com/cloud/free/' },
];

export default function Home() {
  return (
    <div className="rk-home">
      <div className="rk-glow rk-glow-a" />
      <div className="rk-glow rk-glow-b" />

      <nav className="rk-nav">
        <Link href="/" className="rk-brand">
          <span className="rk-logo">RK</span>
          <span>
            <b>{BRAND.name}</b>
            <i>free &amp; open source</i>
          </span>
        </Link>
        <div className="rk-nav-links">
          <a href="#providers">Providers</a>
          <a href="#hosting">Hosting</a>
          <Link href="/studio">Studio</Link>
          <Link href="/settings">Settings</Link>
          <Link href="/chat" className="rk-primary">Launch chat →</Link>
        </div>
      </nav>

      <header className="rk-hero">
        <div className="rk-hero-badge">🚀 {BRAND.badges[0]} · Made in India 🇮🇳</div>
        <h1>
          Ek naam, saare models.<br />
          <span className="rk-grad">{BRAND.name}</span>
        </h1>
        <p className="rk-hero-sub">{BRAND.tagline}</p>
        <p className="rk-hero-body">
          Free AI chat + media studio jisme aap apna model chun sakte hain — OpenRouter ke free models,
          Groq ki speed, Gemini ka free tier, ya apna local Ollama. Bas key daaliye aur baat shuru.
        </p>
        <div className="rk-cta">
          <Link href="/chat" className="rk-primary rk-primary-lg">Chat shuru karein — free</Link>
          <Link href="/settings" className="rk-secondary rk-primary-lg">Providers connect karein</Link>
        </div>
        <div className="rk-badges">
          {BRAND.badges.map((b) => (
            <span key={b}>{b}</span>
          ))}
        </div>
      </header>

      <section id="providers" className="rk-section">
        <h2>8 providers, ek interface</h2>
        <p className="rk-section-sub">
          Jis din jo free ho, wahi use karein. Switch karna ek click ka kaam hai — aur{' '}
          <a className="rk-inline-link" href="https://github.com/KrishnGupta1/RK-Open-Generative-AI/blob/main/docs/FREE-APIS.md">poori free-API list yahan</a> hai.
        </p>
        <div className="rk-provider-grid">
          {PROVIDERS.map((p) => (
            <div key={p.name} className="rk-provider-card" style={{ '--tint': p.tint }}>
              <span>{p.emoji}</span>
              <h3>{p.name}</h3>
              <p>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rk-section">
        <h2>Aur bhi bahut kuch</h2>
        <div className="rk-feature-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="rk-feature">
              <span>{f.icon}</span>
              <div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="hosting" className="rk-section">
        <h2>Free mein kaise host karein?</h2>
        <p className="rk-section-sub">
          Repo Next.js hai — koi bhi Node/Edge host chalega. Neeche sabse aasan raste, best se worst order mein.
        </p>
        <div className="rk-host-grid">
          {HOSTING.map((h, i) => (
            <a key={h.name} href={h.url} target="_blank" rel="noreferrer" className="rk-host">
              <div className="rk-host-top">
                <b>{h.name}</b>
                <span className="rk-host-rank">#{i + 1}</span>
              </div>
              <div className="rk-host-tags">
                <span>{h.best}</span>
                <span>{h.free}</span>
              </div>
              <p>{h.note}</p>
            </a>
          ))}
        </div>
        <pre className="rk-snippet rk-snippet-wide">{`# quickest path (Vercel)
git clone https://github.com/KrishnGupta1/RK-Open-Generative-AI
cd RK-Open-Generative-AI
npm install --legacy-peer-deps
npx vercel            # 2 min mein live URL

# ya Docker (HF Spaces / VPS)
docker compose up -d --build`}</pre>
        <p className="rk-hint">
          <b>India ke users hain?</b> Cloudflare edge + Supabase <code>ap-south-1</code> (Mumbai) rakhein — 20–40 ms
          latency. Aapka Supabase project abhi Mumbai mein hi hai, isliye login/keys super fast honge.
        </p>
        <p className="rk-hint">
          Ollama ke saath host karna hai? Host machine par <code>OLLAMA_HOST=0.0.0.0 ollama serve</code> chalayein
          aur Settings mein base URL public URL rakhein. Free serverless hosts par Ollama nahi chalega — uske liye VPS chahiye.
        </p>
      </section>

      <section className="rk-section rk-team">
        <h2>Banane wale</h2>
        <div className="rk-team-grid">
          <div className="rk-person">
            <span className="rk-person-avatar">KG</span>
            <b>{BRAND.founder}</b>
            <i>{BRAND.founderRole}</i>
          </div>
          <div className="rk-person">
            <span className="rk-person-avatar">RG</span>
            <b>{BRAND.coFounder}</b>
            <i>{BRAND.coFounderRole}</i>
          </div>
        </div>
      </section>

      <footer className="rk-footer">
        <div>
          <b>{BRAND.name}</b>
          <span>© {BRAND.year} · {BRAND.founder} &amp; {BRAND.coFounder}</span>
        </div>
        <div className="rk-footer-links">
          <Link href="/chat">Chat</Link>
          <Link href="/studio">Studio</Link>
          <Link href="/settings">Settings</Link>
          <a href="https://github.com/KrishnGupta1/RK-Open-Generative-AI" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </footer>
    </div>
  );
}
