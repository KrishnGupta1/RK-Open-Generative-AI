# ========== RK GEM AI — ALL IN ONE (Kaggle GPU P100) ==========
# Kaggle notebook ka ek hi cell. Run All dabao. Aakhir me ComfyUI URL milega.
import os, time, subprocess, sys, pathlib, urllib.request

WORK = '/kaggle/working'

print('▶ GPU check…')
os.system('nvidia-smi --query-gpu=name,memory.total --format=csv,noheader || echo "NO GPU — Session options se GPU P100 on karo"')
os.chdir(WORK)

if not os.path.isdir('ComfyUI'):
    print('▶ ComfyUI clone…')
    os.system('git clone -q https://github.com/comfyanonymous/ComfyUI')
else:
    print('▶ ComfyUI already present')

os.chdir('/kaggle/working/ComfyUI')
print('▶ dependencies…')
os.system('pip install -q -r requirements.txt')

print('▶ Wan 2.1 1.3B model (~6 GB, 4-6 min)…')
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
print('▶ log tail:')
print(open('/kaggle/working/comfy.log').read()[-800:])

print('▶ tunnel…')
os.system('pip install -q pycloudflared')
import pycloudflared
url = pycloudflared.default_url()
print('\n' + '=' * 60)
print('  ✅ COMFYUI URL:', url)
print('  → browser me kholo → Templates → "Wan 2.1 Text to Video" → Queue')
print('  → ya RK GEM AI /studio-remote me Endpoint me paste karo')
print('=' * 60)
