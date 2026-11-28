# ===== RK GEM AI — sirf tunnel (2-3 min, kuch download nahi) =====
# Kab use karein: ComfyUI pehle se chal raha hai, sirf URL nahi mil raha.
#   • "ERR no more connections active and exiting"  → http2 fix yahin hai
#   • "AttributeError: pycloudflared default_url"   → is file me pycloudflared hi nahi
#
# Naya cell banao → ye paste karo → Run. Bas URL mil jayega.
#
# Kaam kaise karta hai: 3 alag tunnel providers ek ke baad ek try hote hain.
#   1) cloudflared --protocol http2   (UDP/QUIC block ho to bhi chalta hai)
#   2) localhost.run  (ssh)
#   3) pinggy.io      (ssh)

import os, re, shutil, subprocess, time, urllib.request

PORT = 8188
WORK = '/kaggle/working'


def _read(path):
    try:
        return open(path, errors='ignore').read()
    except OSError:
        return ''


def _grab(path, pattern, timeout_s=90):
    """Log file me URL aane ka intezaar."""
    for _ in range(max(1, timeout_s // 2)):
        time.sleep(2)
        m = re.search(pattern, _read(path))
        if m:
            return m.group(0)
    return None


# ---------------------------------------------------------------- 1) cloudflared
def via_cloudflared():
    exe = os.path.join(WORK, 'cloudflared')
    if not os.path.exists(exe):
        print('  ↓ cloudflared download…')
        urllib.request.urlretrieve(
            'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64', exe)
    os.chmod(exe, 0o755)
    os.system("pkill -f 'cloudflared tunnel' || true")
    time.sleep(1)

    os.environ['TUNNEL_TRANSPORT_PROTOCOL'] = 'http2'
    log = os.path.join(WORK, 'tunnel.log')
    # --protocol http2 : Kaggle UDP block karta hai, QUIC fail ho jata hai
    with open(log, 'w') as fh:
        subprocess.Popen(
            [exe, 'tunnel', '--url', f'http://127.0.0.1:{PORT}', '--no-autoupdate',
             '--protocol', 'http2', '--loglevel', 'info'],
            stdout=fh, stderr=subprocess.STDOUT)
    url = _grab(log, r'https://[a-z0-9][a-z0-9-]*\.trycloudflare\.com')
    if url:
        return url
    print('  ⚠️ cloudflared fail:', _read(log)[-400:])
    return None


# ------------------------------------------------------------- 2) localhost.run
def via_localhost_run():
    log = os.path.join(WORK, 'tunnel-lhr.log')
    with open(log, 'w') as fh:
        subprocess.Popen(
            ['ssh', '-o', 'StrictHostKeyChecking=no', '-o', 'UserKnownHostsFile=/dev/null',
             '-o', 'ServerAliveInterval=30', '-R', f'80:127.0.0.1:{PORT}',
             'nokey@localhost.run'],
            stdout=fh, stderr=subprocess.STDOUT)
    return _grab(log, r'https://[a-z0-9][a-z0-9-]*\.(?:lhr\.life|localhost\.run)', 70)


# ------------------------------------------------------------------ 3) pinggy
def via_pinggy():
    log = os.path.join(WORK, 'tunnel-pinggy.log')
    with open(log, 'w') as fh:
        subprocess.Popen(
            ['ssh', '-o', 'StrictHostKeyChecking=no', '-o', 'UserKnownHostsFile=/dev/null',
             '-o', 'ServerAliveInterval=30', '-p', '443', '-R', f'0:127.0.0.1:{PORT}',
             'a.pinggy.io'],
            stdout=fh, stderr=subprocess.STDOUT)
    url = _grab(log, r'https://[a-z0-9][a-z0-9-]*\.(?:a\.pinggy\.link|pinggy\.link|pinggy\.io)', 70)
    if not url:
        url = _grab(log, r'http://[a-z0-9][a-z0-9-]*\.(?:a\.pinggy\.link|pinggy\.link|pinggy\.io)', 5)
    return url


def main():
    # ComfyUI zinda hai?
    try:
        with urllib.request.urlopen(f'http://127.0.0.1:{PORT}/system_stats', timeout=5) as r:
            alive = r.status == 200
    except Exception:  # noqa: BLE001
        alive = False
    print('▶ ComfyUI:', 'chal raha hai ✓' if alive else 'BAND hai ✗ (pehle wala cell dobara chalao — sirf ComfyUI start karo)')

    print('▶ tunnel 1/3: cloudflared (http2)…')
    url = via_cloudflared()
    if not url:
        print('▶ tunnel 2/3: localhost.run…')
        url = via_localhost_run()
    if not url:
        print('▶ tunnel 3/3: pinggy…')
        url = via_pinggy()

    print('\n' + '=' * 64)
    if url:
        print('  ✅ COMFYUI URL:', url)
        print('  → RK GEM AI → /studio-remote → Endpoint me paste')
        print('  → phir Image / Video / 🧩 Models sab app se chalega')
    else:
        print('  ❌ Koi tunnel nahi bana. Logs:')
        for f in ('tunnel.log', 'tunnel-lhr.log', 'tunnel-pinggy.log'):
            p = os.path.join(WORK, f)
            if os.path.exists(p):
                print(f'--- {f} ---')
                print(_read(p)[-500:])
        print('  → phir dobara: main()')
    print('=' * 64)


main()
