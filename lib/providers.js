// RK GEM AI — provider registry (server side).
//
// Every chat provider talks the OpenAI-compatible /chat/completions
// protocol, except Google Gemini's native generateContent API which we
// translate into the same stream shape. Adding a new OpenAI-compatible
// provider = one entry in PROVIDERS below, nothing else.

export const PROVIDERS = {
  ollama: {
    id: 'ollama',
    label: 'Ollama (local / free)',
    emoji: '🦙',
    kind: 'openai',
    // Local Ollama Desktop / CLI. No API key needed. Override with
    // OLLAMA_BASE_URL if it runs on another machine (e.g. via ngrok).
    defaultBaseUrl: 'http://127.0.0.1:11434/v1',
    requiresKey: false,
    keyHint: 'Not needed — just have Ollama running',
    docs: 'https://ollama.com/download',
    staticModels: ['llama3.2', 'llama3.1', 'qwen2.5', 'gemma3', 'phi4', 'mistral', 'deepseek-r1'],
    dynamicModels: true,
    supportsListModels: true,
  },
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter (free models)',
    emoji: '🛰️',
    kind: 'openai',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    requiresKey: true,
    keyHint: 'sk-or-v1-…',
    docs: 'https://openrouter.ai/keys',
    // Curated favourite list — the live catalogue is fetched from
    // /api/rk/models/openrouter and filtered for ":free" ids first.
    staticModels: [
      'deepseek/deepseek-chat-v3-0324:free',
      'google/gemma-3-27b-it:free',
      'meta-llama/llama-3.3-70b-instruct:free',
      'qwen/qwen3-235b-a22b:free',
      'mistralai/mistral-small-3.2-24b-instruct:free',
      'moonshotai/kimi-k2:free',
      'microsoft/phi-4-reasoning:free',
      'nvidia/nemotron-nano-9b-v2:free',
      'z-ai/glm-4.5-air:free',
    ],
    dynamicModels: true,
    supportsListModels: true,
  },
  groq: {
    id: 'groq',
    label: 'Groq (super fast)',
    emoji: '⚡',
    kind: 'openai',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    requiresKey: true,
    keyHint: 'gsk_…',
    docs: 'https://console.groq.com/keys',
    staticModels: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'qwen/qwen3-32b',
      'moonshotai/kimi-k2-instruct',
      'gemma2-9b-it',
    ],
    dynamicModels: true,
    supportsListModels: true,
  },
  gemini: {
    id: 'gemini',
    label: 'Google Gemini',
    emoji: '✨',
    kind: 'gemini',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    requiresKey: true,
    keyHint: 'AIza…',
    docs: 'https://aistudio.google.com/app/apikey',
    staticModels: [
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.5-pro',
      'gemini-2.0-flash',
    ],
    dynamicModels: false,
    supportsListModels: false,
  },
  custom: {
    id: 'custom',
    label: 'Custom / Self-hosted',
    emoji: '🔧',
    kind: 'openai',
    defaultBaseUrl: '',
    requiresKey: false,
    keyHint: 'Any / none — depends on server',
    docs: '',
    staticModels: [],
    dynamicModels: true,
    supportsListModels: true,
  },
};

// Safe, serialisable provider metadata for the browser (no secrets, no
// server-side env resolution).
export function publicProviders() {
  return Object.values(PROVIDERS).map((p) => ({
    id: p.id,
    label: p.label,
    emoji: p.emoji,
    kind: p.kind,
    defaultBaseUrl: resolveBaseUrl(p.id),
    requiresKey: p.requiresKey,
    keyHint: p.keyHint,
    docs: p.docs,
    staticModels: p.staticModels,
    supportsListModels: p.supportsListModels,
  }));
}

export function resolveBaseUrl(providerId, override) {
  const provider = PROVIDERS[providerId];
  if (!provider) return override || '';
  if (override && String(override).trim()) return String(override).trim().replace(/\/+$/, '');
  const envKey = {
    ollama: 'OLLAMA_BASE_URL',
    openrouter: 'OPENROUTER_BASE_URL',
    groq: 'GROQ_BASE_URL',
    gemini: 'GEMINI_BASE_URL',
    custom: 'CUSTOM_BASE_URL',
  }[providerId];
  const fromEnv = envKey ? process.env[envKey] : '';
  return (fromEnv || provider.defaultBaseUrl).replace(/\/+$/, '');
}

// The app can boot without any key at all and fall back to the free
// shared demo pool configured by the operator (see .env.example).
export function envKeyFor(providerId) {
  return {
    openrouter: process.env.OPENROUTER_API_KEY,
    groq: process.env.GROQ_API_KEY,
    gemini: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    ollama: 'ollama-local',
    custom: process.env.CUSTOM_API_KEY,
  }[providerId] || '';
}
