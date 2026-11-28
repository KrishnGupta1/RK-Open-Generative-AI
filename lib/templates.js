// Templates that run on YOUR OWN GPU (ComfyUI endpoint) — no hosted API key,
// no subscription. Ye "Explore / Templates" ke liye hain.
//
// Har template ek prompt + settings ka set hai jo /api/rk/comfy/render par
// jaata hai (workflowId + params). User ko sirf card dabana hai.

export const GPU_TEMPLATES = [
  // ---------------------------------------------------------------- image --
  {
    id: 'tpl-portrait',
    kind: 'image',
    workflowId: 'sdxl-t2i',
    title: 'Pro Portrait',
    hint: 'Studio-quality headshot, soft light',
    emoji: '🧑‍🎨',
    badge: 'Popular',
    params: {
      prompt:
        'professional studio portrait of an Indian person, soft cinematic lighting, 85mm lens, shallow depth of field, ultra detailed skin texture, red and gold rim light, dark background',
      negative: 'blurry, lowres, deformed hands, extra fingers, watermark, text',
      width: 832,
      height: 1216,
      steps: 28,
      cfg: 6.5,
    },
  },
  {
    id: 'tpl-product',
    kind: 'image',
    workflowId: 'sdxl-t2i',
    title: 'Product Shot',
    hint: 'E-commerce ready, clean background',
    emoji: '📦',
    badge: 'Business',
    params: {
      prompt:
        'premium product photography of a cosmetic bottle on black marble, dramatic golden rim light, red accent, reflective surface, commercial advertising, 8k, sharp focus',
      negative: 'clutter, blurry, text, watermark, low quality',
      width: 1024,
      height: 1024,
      steps: 30,
      cfg: 7,
    },
  },
  {
    id: 'tpl-poster',
    kind: 'image',
    workflowId: 'sdxl-t2i',
    title: 'Poster / Thumbnail',
    hint: 'YouTube thumbnail, bold colours',
    emoji: '🎬',
    badge: 'Fast',
    params: {
      prompt:
        'bold cinematic poster artwork, dramatic red and gold lighting, high contrast, epic composition, glowing particles, ultra detailed, movie key art style',
      negative: 'text, letters, watermark, blurry, low quality',
      width: 1216,
      height: 832,
      steps: 24,
      cfg: 6,
    },
  },
  {
    id: 'tpl-logo',
    kind: 'image',
    workflowId: 'sdxl-t2i',
    title: 'Logo Concept',
    hint: 'Flat vector-style mark',
    emoji: '◆',
    badge: 'New',
    params: {
      prompt:
        'minimal geometric logo mark, flat vector style, gold and crimson gradient on black, symmetrical, centered, clean lines, brand identity concept',
      negative: 'text, letters, photo, realistic, clutter, gradient mesh noise',
      width: 1024,
      height: 1024,
      steps: 26,
      cfg: 7.5,
    },
  },
  {
    id: 'tpl-anime',
    kind: 'image',
    workflowId: 'sdxl-t2i',
    title: 'Anime Scene',
    hint: 'Illustration style',
    emoji: '🌸',
    badge: '',
    params: {
      prompt:
        'anime illustration of a rainy neon street at night, red lanterns, cinematic anime key visual, highly detailed, studio quality colour grading',
      negative: 'photo, realistic, blurry, extra limbs, watermark',
      width: 832,
      height: 1216,
      steps: 26,
      cfg: 6.5,
    },
  },
  {
    id: 'tpl-fast',
    kind: 'image',
    workflowId: 'sdxl-t2i',
    title: 'Turbo Draft',
    hint: '8 steps — 3x faster, test idea',
    emoji: '⚡',
    badge: 'Sabse fast',
    params: {
      prompt: 'cinematic concept art, dramatic lighting, highly detailed',
      negative: 'blurry, lowres, watermark',
      width: 768,
      height: 768,
      steps: 8,
      cfg: 3.5,
    },
  },

  // ---------------------------------------------------------------- video --
  {
    id: 'tpl-video-cinematic',
    kind: 'video',
    workflowId: 'wan-t2v',
    title: 'Cinematic Clip',
    hint: '5 sec, slow camera push',
    emoji: '🎥',
    badge: 'Video',
    params: {
      prompt:
        'cinematic slow dolly-in shot of a rainy Indian city street at dusk, neon reflections, warm golden streetlights, shallow depth of field, film grain',
      negative: 'static, blurry, low quality, watermark, distorted faces',
      width: 832,
      height: 480,
      frames: 81,
      fps: 16,
      steps: 25,
      cfg: 5,
    },
  },
  {
    id: 'tpl-video-product',
    kind: 'video',
    workflowId: 'wan-t2v',
    title: 'Product Rotate',
    hint: '360° showcase loop',
    emoji: '🔄',
    badge: '',
    params: {
      prompt:
        'product showcase video, luxury watch slowly rotating on black pedestal, gold rim lighting, red accent glow, studio background, smooth camera orbit',
      negative: 'jitter, blurry, low quality, text',
      width: 640,
      height: 640,
      frames: 65,
      fps: 16,
      steps: 22,
      cfg: 5,
    },
  },
  {
    id: 'tpl-video-nature',
    kind: 'video',
    workflowId: 'wan-t2v',
    title: 'Nature Timelapse',
    hint: 'Clouds & light',
    emoji: '🏔️',
    badge: '',
    params: {
      prompt:
        'timelapse of dramatic clouds over himalayan peaks at golden hour, sun rays, cinematic wide shot, ultra detailed, smooth motion',
      negative: 'flicker, static, low quality, watermark',
      width: 832,
      height: 480,
      frames: 81,
      fps: 16,
      steps: 25,
      cfg: 5,
    },
  },
];

export function templateById(id) {
  return GPU_TEMPLATES.find((t) => t.id === id) || null;
}

export function templatesByKind(kind) {
  return kind ? GPU_TEMPLATES.filter((t) => t.kind === kind) : GPU_TEMPLATES;
}
