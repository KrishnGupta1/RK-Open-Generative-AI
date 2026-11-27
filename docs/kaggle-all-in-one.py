# ========== RK GEM AI — ALL IN ONE (Kaggle / Colab GPU) ==========
# Kaggle notebook ka ek hi cell. Run dabao. Aakhir me ComfyUI URL milega.
#
# Is script ke baad aapko notebook me KUCH NAHI karna:
#   • model download / delete / switch  → app ke "🧩 Models" tab se
#   • image + video banana             → app ke Image / Video tab se
#
# Accelerator: GPU T4 x2 (ya P100) · Internet: ON

import os, time, subprocess, sys, pathlib, urllib.request

WORK = '/kaggle/working'
AGENT_URL = 'https://raw.githubusercontent.com/KrishnGupta1/RK-Open-Generative-AI/main/docs/rkgem_agent.py'

print('▶ GPU check…')
os.system('nvidia-smi --query-gpu=name,memory.total --format=csv,noheader || echo "NO GPU — Session options se GPU on karo"')
os.chdir(WORK)

if not os.path.isdir('ComfyUI'):
    print('▶ ComfyUI clone…')
    os.system('git clone -q https://github.com/comfyanonymous/ComfyUI')
else:
    print('▶ ComfyUI already present')

os.chdir(os.path.join(WORK, 'ComfyUI'))
print('▶ dependencies…')
os.system('pip install -q -r requirements.txt')

# ── Our model agent: isse app se model download/delete/switch hota hai ──
print('▶ RK GEM AI model agent install…')
agent_dir = 'custom_nodes/rkgem_agent'
pathlib.Path(agent_dir).mkdir(parents=True, exist_ok=True)
try:
    urllib.request.urlretrieve(AGENT_URL, os.path.join(agent_dir, '__init__.py'))
    print('  ✓ agent installed (app se poora model control)')
except Exception as exc:  # noqa: BLE001
    print('  ⚠️ agent install fail:', exc, '— app se sirf render chalega')

# ── Ek starter video model, taaki pehli video turant ban jaye ──
# Baaki models app ke Models tab se aap khud download karenge.
print('▶ starter model: Wan 2.1 1.3B (~9 GB, 6-12 min)…')
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
time.sleep(18)
print('▶ log tail:')
print(open('/kaggle/working/comfy.log').read()[-900:])

print('▶ tunnel…')
os.system('pip install -q pycloudflared')
import pycloudflared
url = pycloudflared.default_url()
print('\n' + '=' * 60)
print('  ✅ COMFYUI URL:', url)
print('  → RK GEM AI → /studio-remote → Endpoint me paste karo')
print('  → phir Image / Video / 🧩 Models sab app se chalega')
print('  → notebook me aur kuch nahi karna')
print('=' * 60)
