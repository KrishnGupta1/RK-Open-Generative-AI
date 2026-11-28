import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/rk/local/status
// Probes the local AI engines that RK GEM AI can drive. All of them are
// optional: on a hosted deployment they simply report "offline", which is
// the honest answer. On localhost / a VPS with a GPU they light up.
//
//   11434  Ollama      → chat models (free, offline)
//   8188   ComfyUI     → image + video workflows
//   7860   Wan2GP      → video models (Wan 2.1/2.2, Hunyuan, LTX)
//   1234   LM Studio   → OpenAI-compatible chat

const ENGINES = [
  {
    id: 'ollama',
    name: 'Ollama',
    emoji: '🦙',
    port: 11434,
    probe: '/api/tags',
    kind: 'chat',
    install: 'curl -fsSL https://ollama.com/install.sh | sh',
    model: 'ollama pull llama3.2',
    url: 'https://ollama.com/download',
    note: 'Chat — 2 GB model kisi bhi laptop par',
  },
  {
    id: 'wan2gp',
    name: 'Wan2GP',
    emoji: '🎬',
    port: 7860,
    probe: '/',
    kind: 'video',
    install: 'bash scripts/setup-local-video.sh --wan2gp',
    model: 'Wan 2.1 1.3B (6-8 GB VRAM)',
    url: 'https://github.com/deepbeepmeep/Wan2GP',
    note: 'Video — text-to-video & image-to-video',
  },
  {
    id: 'comfyui',
    name: 'ComfyUI',
    emoji: '🧩',
    port: 8188,
    probe: '/system_stats',
    kind: 'image+video',
    install: 'bash scripts/setup-local-video.sh --comfyui',
    model: 'FLUX / SDXL / Wan 2.2 workflow',
    url: 'https://github.com/comfyanonymous/ComfyUI',
    note: 'Image + video, node-based',
  },
  {
    id: 'lmstudio',
    name: 'LM Studio',
    emoji: '🖥️',
    port: 1234,
    probe: '/v1/models',
    kind: 'chat',
    install: 'https://lmstudio.ai',
    model: 'GGUF model, server mode on',
    url: 'https://lmstudio.ai',
    note: 'Chat — GUI se model manage karein',
  },
];

async function probe(port, path) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      signal: AbortSignal.timeout(1200),
      cache: 'no-store',
    });
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

export async function GET() {
  const results = await Promise.all(
    ENGINES.map(async (engine) => ({ ...engine, online: await probe(engine.port, engine.probe) })),
  );
  return NextResponse.json({
    engines: results,
    anyOnline: results.some((r) => r.online),
    docs: '/docs/LOCAL-GENERATION.md',
  });
}
