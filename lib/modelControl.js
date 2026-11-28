// RK GEM AI — remote GPU model control.
//
// The user should never have to touch a notebook terminal to decide which
// model is on the GPU. This module is the server-side brain behind
// /studio-remote → "Models" tab:
//
//   • MODELS      — curated catalog (what can be downloaded, from where, how big)
//   • listModels  — asks ComfyUI's /object_info what is actually on disk
//   • downloadModel — queues ComfyUI's built-in downloader node
//   • deleteModel — asks ComfyUI to move a weight file to the trash
//
// Nothing here runs on Kaggle itself: the notebook only needs to expose
// ComfyUI + the tunnel. Everything else is our UI.

const HF = 'https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files';

// folder = ComfyUI models/<folder>. `apiFields` are the exact object_info keys
// that prove a file is present, so we can show ✅/❌ without guessing.
export const MODELS = [
  // ── Image ────────────────────────────────────────────────────────────────
  {
    id: 'sdxl-base',
    label: 'SDXL Base 1.0',
    emoji: '🖼️',
    kind: 'image',
    folder: 'checkpoints',
    sizeGB: 6.9,
    vramGB: 6,
    filename: 'sd_xl_base_1.0.safetensors',
    url: 'https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors',
    apiFields: ['ckpt_name'],
    note: 'Sabse reliable image model. 1024², ~20 sec.',
    recommend: true,
  },
  {
    id: 'sdxl-turbo',
    label: 'SDXL Turbo',
    emoji: '⚡',
    kind: 'image',
    folder: 'checkpoints',
    sizeGB: 6.9,
    vramGB: 6,
    filename: 'sd_xl_turbo_1.0_fp16.safetensors',
    url: 'https://huggingface.co/stabilityai/sdxl-turbo/resolve/main/sd_xl_turbo_1.0_fp16.safetensors',
    apiFields: ['ckpt_name'],
    note: '1-4 step me image. Sabse fast.',
  },
  {
    id: 'z-image-turbo',
    label: 'Z-Image Turbo',
    emoji: '🚀',
    kind: 'image',
    folder: 'checkpoints',
    sizeGB: 2.5,
    vramGB: 6,
    filename: 'z_image_turbo-Q4_K.gguf',
    url: 'https://huggingface.co/leejet/Z-Image-Turbo-GGUF/resolve/main/z_image_turbo-Q4_K.gguf',
    apiFields: ['ckpt_name'],
    note: '8-step, sirf 2.5 GB. Kam disk me kaam.',
  },

  // ── Video ────────────────────────────────────────────────────────────────
  {
    id: 'wan21-t2v-1.3b',
    label: 'Wan 2.1 T2V 1.3B',
    emoji: '🎬',
    kind: 'video',
    folder: 'diffusion_models',
    sizeGB: 3.6,
    vramGB: 8,
    filename: 'wan2.1_t2v_1.3B_fp16.safetensors',
    url: `${HF}/diffusion_models/wan2.1_t2v_1.3B_fp16.safetensors`,
    apiFields: ['unet_name'],
    note: 'Text → video, 480p, 3-5 sec. T4/P100 par chalta hai.',
    recommend: true,
  },
  {
    id: 'wan21-i2v-14b',
    label: 'Wan 2.1 I2V 14B (fp8)',
    emoji: '🎞️',
    kind: 'video',
    folder: 'diffusion_models',
    sizeGB: 14.3,
    vramGB: 16,
    filename: 'wan2.1_i2v_480p_14B_fp8_e4m3fn.safetensors',
    url: `${HF}/diffusion_models/wan2.1_i2v_480p_14B_fp8_e4m3fn.safetensors`,
    apiFields: ['unet_name'],
    note: 'Photo → video. Bhaari — 16 GB VRAM chahiye.',
  },


  // ── Extra image models (2026, sab public) ─────────────────────────────────
  {
    id: 'flux1-schnell',
    label: 'FLUX.1 Schnell',
    emoji: '🌪️',
    kind: 'image',
    folder: 'diffusion_models',
    sizeGB: 11.9,
    vramGB: 12,
    filename: 'flux1-schnell-fp8.safetensors',
    url: 'https://huggingface.co/Comfy-Org/flux1-schnell/resolve/main/flux1-schnell-fp8.safetensors',
    apiFields: ['unet_name'],
    note: '4-step, top quality. 12 GB VRAM chahiye.',
  },
  {
    id: 'sd15',
    label: 'Stable Diffusion 1.5',
    emoji: '🖌️',
    kind: 'image',
    folder: 'checkpoints',
    sizeGB: 4.0,
    vramGB: 4,
    filename: 'v1-5-pruned-emaonly.safetensors',
    url: 'https://huggingface.co/Comfy-Org/stable-diffusion-v1-5-archive/resolve/main/v1-5-pruned-emaonly-fp16.safetensors',
    apiFields: ['ckpt_name'],
    note: 'Sabse halka (4 GB VRAM). 512px LoRA/t2i ke liye.',
  },
  {
    id: 'sd35-medium',
    label: 'SD 3.5 Medium',
    emoji: '🎨',
    kind: 'image',
    folder: 'checkpoints',
    sizeGB: 5.0,
    vramGB: 8,
    filename: 'sd3.5_medium_incl_clips_tensorfx.safetensors',
    url: 'https://huggingface.co/Comfy-Org/stable-diffusion-3.5-files/resolve/main/sd3.5_medium_incl_clips_tensorfx.safetensors',
    apiFields: ['ckpt_name'],
    note: 'Naya base, achha text-following. 8 GB VRAM.',
  },
  {
    id: 'wan22-t2v-14b',
    label: 'Wan 2.2 T2V 14B (fp8)',
    emoji: '🎥',
    kind: 'video',
    folder: 'diffusion_models',
    sizeGB: 14.0,
    vramGB: 16,
    filename: 'wan2.2_t2v_high_noise_14B_fp8_scaled.safetensors',
    url: 'https://huggingface.co/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/diffusion_models/wan2.2_t2v_high_noise_14B_fp8_scaled.safetensors',
    apiFields: ['unet_name'],
    note: 'Naya Wan 2.2 — behtar motion. 16 GB VRAM.',
  },

  // ── Shared helpers (auto-needed) ─────────────────────────────────────────
  {
    id: 'umt5-xxl',
    label: 'UMT5-XXL Text Encoder',
    emoji: '🔤',
    kind: 'helper',
    folder: 'text_encoders',
    sizeGB: 5.0,
    vramGB: 2,
    filename: 'umt5_xxl_fp8_e4m3fn_scaled.safetensors',
    url: `${HF}/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors`,
    apiFields: ['clip_name'],
    note: 'Wan video ke liye zaroori (text samajhne ke liye).',
  },
  {
    id: 'wan-vae',
    label: 'Wan 2.1 VAE',
    emoji: '🧩',
    kind: 'helper',
    folder: 'vae',
    sizeGB: 0.25,
    vramGB: 1,
    filename: 'wan_2.1_vae.safetensors',
    url: `${HF}/vae/wan_2.1_vae.safetensors`,
    apiFields: ['vae_name'],
    note: 'Wan video ke liye zaroori (frames decode).',
  },
  {
    id: 'clip-vision-h',
    label: 'CLIP Vision H',
    emoji: '👁️',
    kind: 'helper',
    folder: 'clip_vision',
    sizeGB: 1.2,
    vramGB: 1,
    filename: 'clip_vision_h.safetensors',
    url: `${HF}/clip_vision/clip_vision_h.safetensors`,
    apiFields: ['clip_name'],
    note: 'Sirf image → video ke liye.',
  },
];

export const MODELS_BY_ID = Object.fromEntries(MODELS.map((m) => [m.id, m]));

// Which helper files a given model needs in addition to itself.
const REQUIRES = {
  'wan21-t2v-1.3b': ['umt5-xxl', 'wan-vae'],
  'wan21-i2v-14b': ['umt5-xxl', 'wan-vae', 'clip-vision-h'],
};

function withRequires(m) {
  const req = REQUIRES[m.id] || [];
  return { ...m, requires: req, totalGB: +(m.sizeGB + req.reduce((a, id) => a + (MODELS_BY_ID[id]?.sizeGB || 0), 0)).toFixed(1) };
}

export const MODEL_LIST = MODELS.map(withRequires);

// ── Where each loader exposes its file list ────────────────────────────────
// comfy loader class → the object_info input key holding installed files.
const LOADER_FIELDS = {
  CheckpointLoaderSimple: 'ckpt_name',
  UNETLoader: 'unet_name',
  CLIPLoader: 'clip_name',
  CLIPVisionLoader: 'clip_name',
  VAELoader: 'vae_name',
  LoraLoader: 'lora_name',
};

const LOADER_URL = 'http://127.0.0.1:8188';

/**
 * Ask ComfyUI what weights exist. One /object_info round-trip (it returns
 * every node), so this is cheap enough to call on every Models-tab open.
 * Returns { ok, files: {folder: [names]}, online }
 */
export async function listInstalled(endpoint, timeoutFn) {
  const res = await fetch(`${endpoint}/object_info`, {
    signal: timeoutFn ? timeoutFn(12000) : undefined,
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`object_info HTTP ${res.status}`);
  const info = await res.json();

  const files = {};
  for (const [cls, field] of Object.entries(LOADER_FIELDS)) {
    const list = info?.[cls]?.input?.required?.[field]?.[0];
    if (Array.isArray(list)) {
      (files[field] ||= []).push(...list);
    }
  }
  // de-dupe (clip_name appears for both CLIPLoader and CLIPVisionLoader)
  for (const k of Object.keys(files)) files[k] = [...new Set(files[k])].sort();
  return { ok: true, files };
}

/** Merge catalog + installed files into the rows the UI renders. */
export function decorateModels(installed) {
  const have = new Set(Object.values(installed?.files || {}).flat());
  return MODEL_LIST.map((m) => {
    const installedOk = have.has(m.filename);
    const missingHelpers = m.requires.filter((id) => !have.has(MODELS_BY_ID[id]?.filename));
    return {
      ...m,
      installed: installedOk,
      ready: installedOk && missingHelpers.length === 0,
      missingHelpers,
    };
  });
}

// ── Agent calls ────────────────────────────────────────────────────────────
// The Kaggle/Pod notebook installs a tiny custom node (docs/rkgem_agent.py)
// that lives *inside* ComfyUI, so it is reachable over the same tunnel — no
// second port, no second URL. These helpers talk to it.

export function validateModelId(id) {
  return Object.prototype.hasOwnProperty.call(MODELS_BY_ID, id) ? MODELS_BY_ID[id] : null;
}

async function agent(endpoint, path, opts = {}, timeoutFn) {
  const res = await fetch(`${endpoint}/rkgem${path}`, {
    method: opts.method || 'GET',
    headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: timeoutFn ? timeoutFn(opts.timeout || 15000) : undefined,
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json.error || json.detail || `GPU agent HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return json;
}

/** Disk + VRAM + download queue state. */
export function agentStatus(endpoint, timeoutFn) {
  return agent(endpoint, '/status', {}, timeoutFn);
}

/** Files actually on disk (falls back to /object_info when the agent is absent). */
export async function installedFiles(endpoint, timeoutFn) {
  try {
    const r = await agent(endpoint, '/models', {}, timeoutFn);
    if (r && r.files) return { source: 'agent', files: r.files, disk: r.disk || null };
  } catch {
    /* agent not installed — older notebooks still work for rendering */
  }
  const r = await listInstalled(endpoint, timeoutFn);
  return { source: 'comfy', files: r.files, disk: null };
}

/** Start a download. Returns { jobId }. */
export function startDownload(endpoint, id, timeoutFn, custom) {
  // custom = { url, filename, folder } → user apna HuggingFace link (ya koi bhi
  // https .safetensors) daal sakta hai. Filename/folder tab bhi safe rehte hain.
  let payload;
  if (custom && custom.url) {
    const url = String(custom.url).trim();
    if (!/^https:\/\/[^\s]+$/.test(url)) throw new Error('Sirf https link chalega');
    const filename = String(custom.filename || url.split('/').pop() || '').split('?')[0].split('/').pop();
    if (!/\.(safetensors|gguf|ckpt|pt|pth|bin)$/i.test(filename)) {
      throw new Error('File .safetensors / .gguf / .ckpt honi chahiye');
    }
    const folder = String(custom.folder || 'checkpoints').toLowerCase();
    if (!/^[a-z_]+$/.test(folder)) throw new Error('Folder invalid');
    payload = { id: `custom:${filename}`, url, filename, folder };
  } else {
    const model = validateModelId(id);
    if (!model) throw new Error(`Unknown model "${id}"`);
    payload = { id: model.id, url: model.url, filename: model.filename, folder: model.folder };
  }
  return agent(endpoint, '/download', { method: 'POST', body: payload, timeout: 20000 }, timeoutFn);
}

/** Download progress for one job. */
export function downloadStatus(endpoint, jobId, timeoutFn) {
  return agent(endpoint, `/download/${encodeURIComponent(jobId)}`, {}, timeoutFn);
}

/** Delete a weight file from the GPU disk. */
export function deleteModel(endpoint, id, timeoutFn) {
  const model = validateModelId(id);
  if (!model) throw new Error(`Unknown model "${id}"`);
  return agent(
    endpoint,
    '/delete',
    { method: 'POST', body: { filename: model.filename, folder: model.folder }, timeout: 20000 },
    timeoutFn,
  );
}

export { LOADER_FIELDS };
