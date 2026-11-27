# ===== RK GEM AI — sirf tunnel (2 min, kuch download nahi) =====
# Kab use karein: ComfyUI pehle se chal raha hai aur sirf URL nahi mila
# (AttributeError: module 'pycloudflared' has no attribute 'default_url')
# Naya cell banao → ye paste karo → Run. Bas URL mil jayega.

import os, re, shutil, subprocess, time, urllib.request

PORT = 8188
exe = os.path.join('/kaggle/working', 'cloudflared')
if not os.path.exists(exe):
    print('↓ cloudflared download…')
    urllib.request.urlretrieve(
        'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64', exe)
os.chmod(exe, 0o755)

# purani cloudflared process band karo (dobara chalane par conflict na ho)
os.system("pkill -f 'cloudflared tunnel' || true")

log = '/kaggle/working/tunnel.log'
with open(log, 'w') as fh:
    subprocess.Popen([exe, 'tunnel', '--url', f'http://127.0.0.1:{PORT}',
                      '--no-autoupdate', '--loglevel', 'info'],
                     stdout=fh, stderr=subprocess.STDOUT)

url = None
for _ in range(60):
    time.sleep(2)
    text = open(log, errors='ignore').read()
    m = re.search(r'https://[a-z0-9][a-z0-9-]*\.trycloudflare\.com', text)
    if m:
        url = m.group(0)
        break

print('\n' + '=' * 60)
if url:
    print('✅ COMFYUI URL:', url)
    print('→ RK GEM AI → /studio-remote → Endpoint me paste → Test')
else:
    print('❌ URL nahi mila. Log tail:')
    print(open(log, errors='ignore').read()[-900:])
print('=' * 60)
