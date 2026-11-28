// Built-in ComfyUI workflows for RK GEM AI, so a user never has to leave the
// platform to make a picture or a clip. These are API-format graphs (the same
// JSON ComfyUI's "Save (API format)" produces) with sensible defaults that
// run on a free Kaggle P100 / 8 GB GPU.
//
// Placeholders are patched at request time by the /api/rk/comfy/render route.

export const WORKFLOWS = {
  'sdxl-t2i': {
    id: 'sdxl-t2i',
    label: 'Image — SDXL (fast, reliable)',
    emoji: '🖼️',
    kind: 'image',
    needs: ['sd_xl_base_1.0.safetensors'],
    fields: ['prompt', 'negative', 'width', 'height', 'steps', 'ckpt'],
    defaults: { steps: 22, width: 1024, height: 1024 },
    build: ({ prompt, negative, width, height, steps, seed, ckpt }) => ({
      4: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: ckpt || 'sd_xl_base_1.0.safetensors' } },
      5: { class_type: 'EmptyLatentImage', inputs: { width, height, batch_size: 1 } },
      6: { class_type: 'CLIPTextEncode', inputs: { text: prompt, clip: ['4', 1] } },
      7: { class_type: 'CLIPTextEncode', inputs: { text: negative || '', clip: ['4', 1] } },
      3: {
        class_type: 'KSampler',
        inputs: {
          seed,
          steps,
          cfg: 7,
          sampler_name: 'dpmpp_2m',
          scheduler: 'karras',
          denoise: 1,
          model: ['4', 0],
          positive: ['6', 0],
          negative: ['7', 0],
          latent_image: ['5', 0],
        },
      },
      8: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['4', 2] } },
      9: { class_type: 'SaveImage', inputs: { filename_prefix: 'rkgem', images: ['8', 0] } },
    }),
  },

  'wan-t2v': {
    id: 'wan-t2v',
    label: 'Video — Wan 2.1 (text → video, 480p)',
    emoji: '🎬',
    kind: 'video',
    needs: [
      'wan2.1_t2v_1.3B_fp16.safetensors',
      'umt5_xxl_fp8_e4m3fn_scaled.safetensors',
      'wan_2.1_vae.safetensors',
    ],
    fields: ['prompt', 'negative', 'width', 'height', 'frames', 'steps'],
    defaults: { width: 480, height: 832, frames: 33, steps: 20 },
    build: ({ prompt, negative, width, height, frames, steps, seed }) => ({
      37: {
        class_type: 'UNETLoader',
        inputs: { unet_name: 'wan2.1_t2v_1.3B_fp16.safetensors', weight_dtype: 'default' },
      },
      38: {
        class_type: 'CLIPLoader',
        inputs: { clip_name: 'umt5_xxl_fp8_e4m3fn_scaled.safetensors', type: 'wan' },
      },
      39: { class_type: 'VAELoader', inputs: { vae_name: 'wan_2.1_vae.safetensors' } },
      48: {
        class_type: 'ModelSamplingSD3',
        inputs: { shift: 8, model: ['37', 0] },
      },
      6: { class_type: 'CLIPTextEncode', inputs: { text: prompt, clip: ['38', 0] } },
      7: {
        class_type: 'CLIPTextEncode',
        inputs: {
          text: negative || 'static, blurry, low quality, watermark, text, distorted',
          clip: ['38', 0],
        },
      },
      40: {
        class_type: 'EmptyHunyuanLatentVideo',
        inputs: { width, height, length: frames, batch_size: 1 },
      },
      3: {
        class_type: 'KSampler',
        inputs: {
          seed,
          steps,
          cfg: 6,
          sampler_name: 'uni_pc',
          scheduler: 'simple',
          denoise: 1,
          model: ['48', 0],
          positive: ['6', 0],
          negative: ['7', 0],
          latent_image: ['40', 0],
        },
      },
      8: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['39', 0] } },
      28: { class_type: 'SaveAnimatedWEBP', inputs: { filename_prefix: 'rkgem_video', fps: 16, lossless: false, quality: 85, method: 'default', images: ['8', 0] } },
    }),
  },

  'wan-i2v': {
    id: 'wan-i2v',
    label: 'Video — Wan 2.1 (image → video)',
    emoji: '📷',
    kind: 'video',
    needs: [
      'wan2.1_i2v_480p_14B_fp8_e4m3fn.safetensors',
      'umt5_xxl_fp8_e4m3fn_scaled.safetensors',
      'wan_2.1_vae.safetensors',
      'clip_vision_h.safetensors',
    ],
    fields: ['prompt', 'negative', 'image', 'frames', 'steps'],
    defaults: { frames: 33, steps: 20 },
    build: ({ prompt, negative, image, frames, steps, seed }) => ({
      37: {
        class_type: 'UNETLoader',
        inputs: { unet_name: 'wan2.1_i2v_480p_14B_fp8_e4m3fn.safetensors', weight_dtype: 'default' },
      },
      38: {
        class_type: 'CLIPLoader',
        inputs: { clip_name: 'umt5_xxl_fp8_e4m3fn_scaled.safetensors', type: 'wan' },
      },
      39: { class_type: 'VAELoader', inputs: { vae_name: 'wan_2.1_vae.safetensors' } },
      49: { class_type: 'CLIPVisionLoader', inputs: { clip_name: 'clip_vision_h.safetensors' } },
      52: { class_type: 'LoadImage', inputs: { image } },
      48: { class_type: 'ModelSamplingSD3', inputs: { shift: 8, model: ['37', 0] } },
      6: { class_type: 'CLIPTextEncode', inputs: { text: prompt, clip: ['38', 0] } },
      7: {
        class_type: 'CLIPTextEncode',
        inputs: { text: negative || 'static, blurry, low quality', clip: ['38', 0] },
      },
      50: { class_type: 'CLIPVisionEncode', inputs: { clip_vision: ['49', 0], image: ['52', 0], crop: 'none' } },
      51: { class_type: 'WanImageToVideo', inputs: { vae: ['39', 0], clip_vision_output: ['50', 0], positive: ['6', 0], negative: ['7', 0], length: frames, batch_size: 1 } },
      3: {
        class_type: 'KSampler',
        inputs: {
          seed,
          steps,
          cfg: 6,
          sampler_name: 'uni_pc',
          scheduler: 'simple',
          denoise: 1,
          model: ['48', 0],
          positive: ['51', 0],
          negative: ['51', 1],
          latent_image: ['51', 2],
        },
      },
      8: { class_type: 'VAEDecode', inputs: { samples: ['3', 0], vae: ['39', 0] } },
      28: { class_type: 'SaveAnimatedWEBP', inputs: { filename_prefix: 'rkgem_i2v', fps: 16, lossless: false, quality: 85, method: 'default', images: ['8', 0] } },
    }),
  },
};

export const WORKFLOW_LIST = Object.values(WORKFLOWS).map(({ id, label, emoji, kind, needs, fields, defaults }) => ({
  id,
  label,
  emoji,
  kind,
  needs,
  fields,
  defaults,
}));
