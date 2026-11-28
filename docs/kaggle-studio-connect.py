# ========== RK GEM AI — STUDIO CONNECT (Kaggle GPU) ==========
#
# Kaggle notebook ka ek hi cell. Run dabao. Bas.
#
# Ismein KOI model download nahi hota (disk bachta hai). Sirf:
#   1. ComfyUI install + start
#   2. RK GEM AI ka model agent (app se download / delete / switch ke liye)
#   3. Tunnel URL
#
# Uske baad sab kuch website se:
#   Studio → "Apna GPU" tab → URL paste → Models → jo chahiye download
#
# Accelerator: GPU T4 x2 (ya P100)  ·  Internet: ON
# Model ~0 GB. Pehli run ~3-4 min.

import os, re, shutil, subprocess, sys, time, pathlib, urllib.request

WORK = '/kaggle/working'
AGENT_URL = 'https://raw.githubusercontent.com/KrishnGupta1/RK-Open-Generative-AI/main/docs/rkgem_agent.py'
PORT = 8188


# ---------------------------------------------------------------- helpers ----
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


def comfy_alive(port=PORT):
    try:
        with urllib.request.urlopen(f'http://127.0.0.1:{port}/system_stats', timeout=5) as r:
            return r.status == 200
    except Exception:  # noqa: BLE001
        return False


# ---------------------------------------------------------------- tunnel ----
def via_cloudflared(port=PORT):
    """Kaggle UDP block karta hai — isliye http2 (QUIC nahi)."""
    os.environ['TUNNEL_TRANSPORT_PROTOCOL'] = 'http2'
    log = os.path.join(WORK, 'tunnel.log')
    try:
        exe = shutil.which('cloudflared') or os.path.join(WORK, 'cloudflared')
        if not os.path.exists(exe):
            print('  ↓ cloudflared binary…')
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
        return url or _grab(log, r'http://[a-z0-9][a-z0-9-]*\.(?:a\.pinggy\.link|pinggy\.link|pinggy\.io)', 5)
    except Exception as exc:  # noqa: BLE001
        print('  ⚠️ pinggy fail:', exc)
        return None


# ------------------------------------------------------------------ setup ----
def install_agent():
    d = 'custom_nodes/rkgem_agent'
    pathlib.Path(d).mkdir(parents=True, exist_ok=True)
    try:
        urllib.request.urlretrieve(AGENT_URL, os.path.join(d, '__init__.py'))
        print('  ✓ model agent ready (app se download/delete/switch)')
        return True
    except Exception as exc:  # noqa: BLE001
        print('  ⚠️ agent fail:', exc)
        return False


def launch_comfy():
    subprocess.Popen(
        [sys.executable, 'main.py', '--listen', '0.0.0.0', '--port', str(PORT)],
        stdout=open('/kaggle/working/comfy.log', 'w'), stderr=subprocess.STDOUT,
    )
    for _ in range(40):
        time.sleep(2)
        if comfy_alive():
            return True
    print('  ⚠️ ComfyUI log:', _read('/kaggle/working/comfy.log')[-700:])
    return False


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
    print('▶ dependencies (~2 min)…')
    os.system('pip install -q -r requirements.txt')

    print('▶ agent…')
    install_agent()

    print('▶ ComfyUI start…')
    ok = launch_comfy()
    print('  ✓ chal raha hai (port', PORT, ')' if ok else '  ⚠️ shuru nahi hua')

    print('▶ tunnel…')
    print('  → 1/3 cloudflared (http2)…')
    url = via_cloudflared()
    if not url:
        print('  → 2/3 localhost.run…')
        url = via_localhost_run()
    if not url:
        print('  → 3/3 pinggy…')
        url = via_pinggy()

    print('\n' + '=' * 66)
    if url:
        print('  ✅ STUDIO URL:', url)
        print()
        print('  Ab website kholo:')
        print('    Studio → "Apna GPU" tab → Endpoint me ye URL paste → Test')
        print()
        print('  Phir Models tab se jo model chahiye wahi download karo:')
        print('    • SD 1.5      (4 GB)   — sabse halka, 4 GB VRAM')
        print('    • SDXL Base   (6.9 GB) — best balance')
        print('    • Wan 2.1 1.3B (3.6 GB) — video, 8 GB VRAM')
        print('  App khud aapke GPU ke hisaab se best model suggest karega.')
    else:
        print('  ❌ Tunnel nahi bana. Logs:')
        for f in ('tunnel.log', 'tunnel-lhr.log', 'tunnel-pinggy.log'):
            p = os.path.join(WORK, f)
            if os.path.exists(p):
                print(f'--- {f} ---')
                print(_read(p)[-400:])
        print('  → dobara chalao: main()')
    print('=' * 66)


main()
