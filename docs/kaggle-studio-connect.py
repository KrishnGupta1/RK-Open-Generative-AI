# ==========================================================================
#  RK GEM AI  ·  KAGGLE ALL-IN-ONE  (v3)
#  Ek cell. Copy → paste → Run. 3-4 minute me studio URL mil jayega.
# ==========================================================================
#
#  Kaggle me kya karna hai:
#    1) Right panel → Session options → Accelerator = GPU T4 x2
#    2) Usi panel me → Internet = ON        (iske bina tunnel nahi banega)
#    3) Starter cells (jo pehle se likhe hain) delete kar do
#    4) Neeche ka POORA code ek cell me paste karo → Run
#    5) Aakhir me "STUDIO URL" line aayegi → woh URL app me paste karo
#       (poora output bhi paste kar sakte ho — app khud URL nikaal lega)
#
#  Ye script kya karta hai:
#    · GPU check (T4 x2 = ~29 GB VRAM)
#    · ComfyUI install (torch pehle se Kaggle image me hai — install skip)
#    · Model agent (app se download / delete / switch)
#    · ComfyUI start — 4 tarike se, silent hang nahi hoga
#    · Tunnel — cloudflared → localhost.run → pinggy
#
#  Koi model pre-download nahi hota. Model app ke "Models" tab se chunte ho.
# ==========================================================================

import os, re, shutil, socket, subprocess, sys, time, pathlib, urllib.request

WORK = '/kaggle/working'
AGENT_URL = 'https://raw.githubusercontent.com/KrishnGupta1/RK-Open-Generative-AI/main/docs/rkgem_agent.py'
PORT = 8188
HERE = os.path.dirname(os.path.abspath(__file__)) if '__file__' in globals() else os.getcwd()


def say(msg):
    print(msg, flush=True)


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


def _tail(path, n=1200):
    txt = _read(path)
    return txt[-n:] if txt else '(log khali hai)'


def comfy_alive(port=PORT):
    try:
        with urllib.request.urlopen(f'http://127.0.0.1:{port}/system_stats', timeout=5) as r:
            return r.status == 200
    except Exception:
        return False


def port_open(port=PORT):
    s = socket.socket()
    s.settimeout(1.5)
    try:
        return s.connect_ex(('127.0.0.1', port)) == 0
    except Exception:
        return False
    finally:
        s.close()


# ---------------------------------------------------------------- install --
def find_comfy_root():
    """ComfyUI kahan hai — chahe humne clone kiya ho ya pehle se ho."""
    for cand in (os.path.join(WORK, 'ComfyUI'), os.path.join(WORK, 'comfyui'), '/kaggle/working/ComfyUI'):
        if os.path.isdir(cand) and os.path.exists(os.path.join(cand, 'main.py')):
            return cand
    return None


def clone_comfy():
    root = find_comfy_root()
    if root:
        say(f'  ✓ ComfyUI pehle se hai: {root}')
        return root
    say('  ↓ ComfyUI clone…')
    os.chdir(WORK)
    rc = os.system('git clone --depth 1 -q https://github.com/comfyanonymous/ComfyUI 2>&1 | tail -3')
    if rc != 0:
        say('  ⚠️ git clone fail — zip se try karta hoon')
        try:
            zpath = os.path.join(WORK, 'comfy.zip')
            urllib.request.urlretrieve('https://github.com/comfyanonymous/ComfyUI/archive/refs/heads/master.zip', zpath)
            import zipfile
            with zipfile.ZipFile(zpath) as z:
                z.extractall(WORK)
            for d in os.listdir(WORK):
                if d.lower().startswith('comfyui-') and d != 'ComfyUI':
                    os.rename(os.path.join(WORK, d), os.path.join(WORK, 'ComfyUI'))
                    break
            say('  ✓ zip se nikal gaya')
        except Exception as exc:
            say(f'  ✗ ComfyUI install nahi hua: {exc}')
    return find_comfy_root()


def install_deps(root):
    """torch Kaggle image me pehle se hai — wo install karna 3GB waste hai."""
    req = os.path.join(root, 'requirements.txt')
    say('  ↓ dependencies…')
    try:
        lines = [l.strip() for l in open(req) if l.strip() and not l.startswith('#')]
    except Exception:
        lines = []
    skip = ('torch', 'torchvision', 'torchaudio', 'xformers', 'numpy==', 'numpy<2')
    keep = [l for l in lines if not l.lower().startswith(skip)]
    say(f'  · {len(lines)} me se {len(keep)} install kar raha (torch pehle se hai)')
    if keep:
        tmp = os.path.join(WORK, 'req-slim.txt')
        open(tmp, 'w').write('\n'.join(keep))
        os.system(f'pip install -q -r {tmp} 2>&1 | tail -5')
    say('  ✓ dependencies done')


def install_agent(root):
    d = os.path.join(root, 'custom_nodes', 'rkgem_agent')
    pathlib.Path(d).mkdir(parents=True, exist_ok=True)
    target = os.path.join(d, '__init__.py')
    # Local file pehle (agar notebook me agent bhi hai), warna GitHub se
    for src in (os.path.join(HERE, 'rkgem_agent.py'), os.path.join(WORK, 'rkgem_agent.py')):
        if os.path.exists(src):
            shutil.copy(src, target)
            say('  ✓ model agent ready (local copy)')
            return True
    try:
        urllib.request.urlretrieve(AGENT_URL, target)
        say('  ✓ model agent ready (GitHub se)')
        return True
    except Exception as exc:
        say(f'  ⚠️ agent fail (models tab kaam nahi karega): {exc}')
        return False


# ---------------------------------------------------------------- comfy run --
def try_launch(root, cmd, tag, wait_s=90):
    """ComfyUI start karo, port khula ya na khula — dono check karo."""
    log = os.path.join(WORK, f'comfy-{tag}.log')
    say(f'  → try: {tag}')
    try:
        subprocess.Popen(cmd, cwd=root, stdout=open(log, 'w'), stderr=subprocess.STDOUT)
    except Exception as exc:
        say(f'    ✗ start nahi hua: {exc}')
        return False

    for _ in range(max(2, wait_s // 3)):
        time.sleep(3)
        if comfy_alive():
            say(f'    ✓ ONLINE (port {PORT}) — {tag}')
            return True
        if port_open():
            say(f'    ~ port khul gaya par /system_stats nahi — import error ho sakta hai')
    err = _tail(log, 900)
    if err.strip():
        say(f'    ✗ nahi chala. log:')
        for line in err.strip().splitlines()[-8:]:
            say(f'      {line}')
    return False


def launch_comfy(root):
    """4 tarike — pehla jo chal jaye wahi use karo."""
    base = [sys.executable, 'main.py', '--listen', '0.0.0.0', '--port', str(PORT)]

    # 0) Purana instance? (dobara run karne par)
    if comfy_alive():
        say('  ✓ ComfyUI pehle se chal raha hai')
        return True
    os.system(f"pkill -f 'main.py --listen' 2>/dev/null; sleep 1")

    attempts = [
        ('normal', base),
        ('cpu-vae', base + ['--lowvram']),
        ('no-smart-mem', base + ['--disable-smart-memory', '--lowvram']),
        ('minimal', base + ['--cpu']),
    ]
    for tag, cmd in attempts:
        if try_launch(root, cmd, tag):
            return True

    say('  ✗ ComfyUI 4 tarike se bhi nahi chala.')
    say(f'  Last log ({WORK}/comfy-normal.log):')
    say(_tail(os.path.join(WORK, 'comfy-normal.log'), 1500))
    return False


# ---------------------------------------------------------------- tunnel --
def via_cloudflared(port=PORT):
    say('  → 1/3 cloudflared (http2)…')
    os.environ['TUNNEL_TRANSPORT_PROTOCOL'] = 'http2'
    log = os.path.join(WORK, 'tunnel.log')
    try:
        exe = shutil.which('cloudflared') or os.path.join(WORK, 'cloudflared')
        if not os.path.exists(exe):
            urllib.request.urlretrieve(
                'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64', exe)
        os.chmod(exe, 0o755)
        os.system("pkill -f 'cloudflared tunnel' 2>/dev/null; sleep 1")
        with open(log, 'w') as fh:
            subprocess.Popen([exe, 'tunnel', '--url', f'http://127.0.0.1:{port}', '--no-autoupdate',
                              '--protocol', 'http2', '--edge-ip-version', '4', '--loglevel', 'info'],
                             stdout=fh, stderr=subprocess.STDOUT)
        url = _grab(log, r'https://[a-z0-9][a-z0-9-]*\.trycloudflare\.com', 100)
        if url:
            return url
        say(f'    ✗ cloudflared: {_tail(log, 400)}')
    except Exception as exc:
        say(f'    ✗ cloudflared fail: {exc}')
    return None


def via_localhost_run(port=PORT):
    say('  → 2/3 localhost.run…')
    log = os.path.join(WORK, 'tunnel-lhr.log')
    try:
        with open(log, 'w') as fh:
            subprocess.Popen(['ssh', '-o', 'StrictHostKeyChecking=no', '-o', 'UserKnownHostsFile=/dev/null',
                              '-o', 'ServerAliveInterval=30', '-R', f'80:127.0.0.1:{port}', 'nokey@localhost.run'],
                             stdout=fh, stderr=subprocess.STDOUT)
        url = _grab(log, r'https://[a-z0-9][a-z0-9-]*\.(?:lhr\.life|localhost\.run)', 70)
        if url:
            return url
        say(f'    ✗ localhost.run: {_tail(log, 300)}')
    except Exception as exc:
        say(f'    ✗ localhost.run fail: {exc}')
    return None


def via_pinggy(port=PORT):
    say('  → 3/3 pinggy…')
    log = os.path.join(WORK, 'tunnel-pinggy.log')
    try:
        with open(log, 'w') as fh:
            subprocess.Popen(['ssh', '-o', 'StrictHostKeyChecking=no', '-o', 'UserKnownHostsFile=/dev/null',
                              '-o', 'ServerAliveInterval=30', '-p', '443', '-R', f'0:127.0.0.1:{port}', 'a.pinggy.io'],
                             stdout=fh, stderr=subprocess.STDOUT)
        url = _grab(log, r'https?://[a-z0-9][a-z0-9-]*\.(?:a\.pinggy\.link|pinggy\.link|pinggy\.io)', 70)
        if url:
            return url
        say(f'    ✗ pinggy: {_tail(log, 300)}')
    except Exception as exc:
        say(f'    ✗ pinggy fail: {exc}')
    return None


# ---------------------------------------------------------------- main --
def main():
    t0 = time.time()
    say('=' * 62)
    say('  RK GEM AI  ·  Kaggle GPU setup')
    say('=' * 62)

    say('\n[1/5] GPU check')
    os.system('nvidia-smi --query-gpu=name,memory.total --format=csv,noheader || echo "❌ NO GPU — Session options → GPU T4 x2"')
    os.chdir(WORK)

    say('\n[2/5] ComfyUI')
    root = clone_comfy()
    if not root:
        say('\n❌ ComfyUI install nahi hua. Internet ON hai? Dobara chalao: main()')
        return
    os.chdir(root)
    install_deps(root)
    install_agent(root)

    say('\n[3/5] ComfyUI start')
    ok = launch_comfy(root)
    if not ok:
        say('\n⚠️ ComfyUI nahi chala — tunnel bhi nahi banega.')
        say('   Cache clear karke dobara try karo:')
        say('     !rm -rf /kaggle/working/ComfyUI && main()')
        return

    say('\n[4/5] tunnel')
    url = via_cloudflared()
    if not url:
        url = via_localhost_run()
    if not url:
        url = via_pinggy()

    say('\n' + '=' * 62)
    if url:
        say('  ✅ STUDIO URL:')
        say('')
        say(f'     {url}')
        say('')
        say('  Ab website kholo:')
        say('    Studio → "Apna GPU" → URL paste karo → Jodo')
        say('    (poora output paste karo to bhi chalega)')
        say('')
        say('  Phir Models tab → "🎯 Aapke GPU ke liye best" → download')
        say(f'  (setup time: {int(time.time() - t0)}s)')
    else:
        say('  ❌ Tunnel nahi bana — logs:')
        for f in ('tunnel.log', 'tunnel-lhr.log', 'tunnel-pinggy.log'):
            p = os.path.join(WORK, f)
            if os.path.exists(p):
                say(f'  --- {f} ---')
                say(_tail(p, 500))
        say('  → Internet ON hai? Session options me check karo.')
        say('  → Dobara: main()')
    say('=' * 62)
    say('\n  Note: notebook band → URL mar jata hai. Cell dobara chalao.')
    say('  ComfyUI + models bhi reset hote hain (naya session = naya disk).')


main()
