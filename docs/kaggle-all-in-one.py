# ========== RK GEM AI — ALL IN ONE (Kaggle / Colab GPU) ==========
# Kaggle notebook ka ek hi cell. Run dabao. Aakhir me ComfyUI URL milega.
#
# Is script ke baad aapko notebook me KUCH NAHI karna:
#   • model download / delete / switch  → app ke "🧩 Models" tab se
#   • image + video banana              → app ke Image / Video tab se
#
# Accelerator: GPU T4 x2 (ya P100) · Internet: ON

import os, re, shutil, subprocess, sys, time, pathlib, urllib.request

WORK = '/kaggle/working'
AGENT_URL = 'https://raw.githubusercontent.com/KrishnGupta1/RK-Open-Generative-AI/main/docs/rkgem_agent.py'
PORT = 8188


# ---------------------------------------------------------------- tunnel ----
def _read(path):
    try:
        return open(path, errors='ignore').read()
    except OSError:
        return ''


def _grab(path, pattern, timeout_s=90):
    for _ in range(max(1, timeout_s // 2)):
        time.sleep(2)
        m = re.search(pattern, _read(path))
        if m:
            return m.group(0)
    return None


def via_cloudflared(port=PORT):
    """Kaggle UDP block karta hai, isliye --protocol http2 (QUIC nahi)."""
    os.environ['TUNNEL_TRANSPORT_PROTOCOL'] = 'http2'
    log = os.path.join(WORK, 'tunnel.log')
    try:
        exe = shutil.which('cloudflared')
        if not exe:
            exe = os.path.join(WORK, 'cloudflared')
            if not os.path.exists(exe):
                print('  ↓ cloudflared binary download…')
                urllib.request.urlretrieve(
                    'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64',
                    exe,
                )
            os.chmod(exe, 0o755)
        os.system("pkill -f 'cloudflared tunnel' || true")
        time.sleep(1)
        with open(log, 'w') as fh:
            subprocess.Popen(
                [exe, 'tunnel', '--url', f'http://127.0.0.1:{port}', '--no-autoupdate',
                 '--protocol', 'http2', '--edge-ip-version', '4', '--loglevel', 'info'],
                stdout=fh, stderr=subprocess.STDOUT,
            )
        url = _grab(log, r'https://[a-z0-9][a-z0-9-]*\.trycloudflare\.com', 100)
        if url:
            return url
        print('  ⚠️ cloudflared log:', _read(log)[-400:])
    except Exception as exc:  # noqa: BLE001
        print('  ⚠️ cloudflared fail:', exc)
    return None


def via_localhost_run(port=PORT):
    log = os.path.join(WORK, 'tunnel-lhr.log')
    try:
        with open(log, 'w') as fh:
            subprocess.Popen(
                ['ssh', '-o', 'StrictHostKeyChecking=no', '-o', 'UserKnownHostsFile=/dev/null',
                 '-o', 'ServerAliveInterval=30', '-R', f'80:127.0.0.1:{port}', 'nokey@localhost.run'],
                stdout=fh, stderr=subprocess.STDOUT)
        return _grab(log, r'https://[a-z0-9][a-z0-9-]*\.(?:lhr\.life|localhost\.run)', 70)
    except Exception as exc:  # noqa: BLE001
        print('  ⚠️ localhost.run fail:', exc)
        return None


def via_pinggy(port=PORT):
    log = os.path.join(WORK, 'tunnel-pinggy.log')
    try:
        with open(log, 'w') as fh:
            subprocess.Popen(
                ['ssh', '-o', 'StrictHostKeyChecking=no', '-o', 'UserKnownHostsFile=/dev/null',
                 '-o', 'ServerAliveInterval=30', '-p', '443', '-R', f'0:127.0.0.1:{port}', 'a.pinggy.io'],
                stdout=fh, stderr=subprocess.STDOUT)
        url = _grab(log, r'https://[a-z0-9][a-z0-9-]*\.(?:a\.pinggy\.link|pinggy\.link|pinggy\.io)', 70)
        if not url:
            url = _grab(log, r'http://[a-z0-9][a-z0-9-]*\.(?:a\.pinggy\.link|pinggy\.link|pinggy\.io)', 5)
        return url
    except Exception as exc:  # noqa: BLE001
        print('  ⚠️ pinggy fail:', exc)
        return None


def start_tunnel(port=PORT):
    """3 providers, ek ke baad ek. Jo pehle chale wahi return."""
    print('  → 1/3 cloudflared (http2)…')
    url = via_cloudflared(port)
    if not url:
        print('  → 2/3 localhost.run…')
        url = via_localhost_run(port)
    if not url:
        print('  → 3/3 pinggy…')
        url = via_pinggy(port)
    if not url:
        # last resort: package jo pehle use hota tha
        try:
            os.system('pip install -q pycloudflared')
            import pycloudflared
            for name in ('default_url', 'quick_tunnel', 'get_url', 'tunnel_url'):
                fn = getattr(pycloudflared, name, None)
                if callable(fn):
                    out = fn()
                    if isinstance(out, str) and out.startswith('http'):
                        return out
        except Exception:  # noqa: BLE001
            pass
    return url


# ----------------------------------------------------------------- comfy ----
def comfy_alive(port=PORT):
    try:
        with urllib.request.urlopen(f'http://127.0.0.1:{port}/system_stats', timeout=5) as r:
            return r.status == 200
    except Exception:  # noqa: BLE001
        return False


def install_agent():
    agent_dir = 'custom_nodes/rkgem_agent'
    pathlib.Path(agent_dir).mkdir(parents=True, exist_ok=True)
    try:
        urllib.request.urlretrieve(AGENT_URL, os.path.join(agent_dir, '__init__.py'))
        print('  ✓ RK GEM AI model agent installed (app se download/delete/switch)')
        return True
    except Exception as exc:  # noqa: BLE001
        print('  ⚠️ agent install fail:', exc, '— app se render chalega, model control nahi')
        return False


def launch_comfy():
    subprocess.Popen(
        [sys.executable, 'main.py', '--listen', '0.0.0.0', '--port', str(PORT)],
        stdout=open('/kaggle/working/comfy.log', 'w'), stderr=subprocess.STDOUT,
    )
    for _ in range(30):
        time.sleep(2)
        if comfy_alive():
            return True
    print('  ⚠️ ComfyUI log tail:', open('/kaggle/working/comfy.log', errors='ignore').read()[-600:])
    return False


# ------------------------------------------------------------------ main ----
def main():
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

    print('▶ RK GEM AI model agent install…')
    install_agent()

    # ── Ek starter video model, taaki pehli video turant ban jaye ──
    # Baaki models app ke Models tab se aap khud download/delete karenge.
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
    if launch_comfy():
        print('  ✓ ComfyUI chal raha hai (port', PORT, ')')
    else:
        print('  ⚠️ ComfyUI shuru nahi hua — log dekho: /kaggle/working/comfy.log')

    print('▶ tunnel…')
    url = start_tunnel(PORT)

    print('\n' + '=' * 64)
    if url:
        print('  ✅ COMFYUI URL:', url)
        print('  → RK GEM AI → /studio-remote → Endpoint me paste karo')
        print('  → phir Image / Video / 🧩 Models sab app se chalega')
        print('  → notebook me aur kuch nahi karna')
    else:
        print('  ❌ Tunnel URL nahi mila.')
        print('  → Neeche dobara chalao:  start_tunnel()')
        print('  → ya log dekho:  print(open("/kaggle/working/tunnel.log").read()[-800:])')
    print('=' * 64)


main()
