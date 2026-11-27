#!/usr/bin/env bash
# RK GEM AI — local AI setup helper
# Krishn Gupta (Founder & CEO) · Riya Gupta (Co-Founder)
#
# Usage:
#   bash scripts/setup-local-video.sh --check         # kya already installed hai
#   bash scripts/setup-local-video.sh --ollama        # chat (2 GB, any laptop)
#   bash scripts/setup-local-video.sh --wan2gp        # VIDEO (6 GB+ VRAM)
#   bash scripts/setup-local-video.sh --comfyui       # image + video (node based)
#   bash scripts/setup-local-video.sh --all
#
# Safe by design: nothing is installed outside the target folder, no sudo
# except Ollama's official installer (which you are told about first).

set -euo pipefail

BLUE='\033[0;34m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
say()  { printf "${BLUE}▸${NC} %s\n" "$1"; }
ok()   { printf "${GREEN}✓${NC} %s\n" "$1"; }
warn() { printf "${YELLOW}!${NC} %s\n" "$1"; }
die()  { printf "${RED}✗${NC} %s\n" "$1"; exit 1; }

ROOT="${RK_AI_HOME:-$HOME/rk-ai}"
PY="${PYTHON:-python3}"

need() { command -v "$1" >/dev/null 2>&1; }

nvidia_vram() {
  if need nvidia-smi; then
    nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits 2>/dev/null | head -1 | tr -d ' '
  else
    echo ""
  fi
}

print_hardware() {
  say "Hardware check"
  local vram; vram="$(nvidia_vram)"
  if [[ -n "$vram" ]]; then
    ok "NVIDIA GPU: ${vram} MB VRAM"
    if   (( vram >= 20000 )); then ok "→ Wan 2.2 14B 720p, HunyuanVideo chalega"
    elif (( vram >= 11000 )); then ok "→ Wan 2.1 14B (480p), LTX-Video chalega"
    elif (( vram >= 7000  )); then ok "→ Wan 2.1 1.3B, FLUX schnell chalega"
    else warn "→ sirf chhote models / 480p short clips"
    fi
  elif [[ "$(uname -s)" == "Darwin" ]]; then
    ok "Apple Silicon detected → Metal/MPS par Wan 2.1 1.3B theek chalta hai"
  else
    warn "NVIDIA GPU nahi mila — video bahut slow hoga (SDXL-Turbo image phir bhi chalega)"
  fi
  need ffmpeg && ok "ffmpeg mila (video join/encode ke liye)" || warn "ffmpeg nahi hai → sudo apt install ffmpeg"
  need git    && ok "git mila" || die "git chahiye"
}

check_all() {
  print_hardware
  say "Running engines"
  curl -s -m 1 http://127.0.0.1:11434/api/tags >/dev/null 2>&1 && ok "Ollama online (11434)" || warn "Ollama offline"
  curl -s -m 1 http://127.0.0.1:7860/ >/dev/null 2>&1       && ok "Wan2GP online (7860)"  || warn "Wan2GP offline"
  curl -s -m 1 http://127.0.0.1:8188/system_stats >/dev/null 2>&1 && ok "ComfyUI online (8188)" || warn "ComfyUI offline"
}

install_ollama() {
  say "Ollama (chat) install"
  if need ollama; then ok "already installed"; else
    warn "Ollama ka official installer chalega (sudo maang sakta hai)"
    curl -fsSL https://ollama.com/install.sh | sh
  fi
  ok "model pull: llama3.2 (2 GB)"
  ollama pull llama3.2 || warn "pull fail — manually: ollama pull qwen2.5:7b"
  ok "RK GEM AI → /settings → Ollama → http://127.0.0.1:11434/v1"
}

install_wan2gp() {
  say "Wan2GP (video) install → $ROOT/Wan2GP"
  mkdir -p "$ROOT"
  [[ -d "$ROOT/Wan2GP" ]] || git clone https://github.com/deepbeepmeep/Wan2GP "$ROOT/Wan2GP"
  cd "$ROOT/Wan2GP"
  [[ -d venv ]] || $PY -m venv venv
  # shellcheck disable=SC1091
  source venv/bin/activate
  pip install --upgrade pip >/dev/null
  [[ -f requirements.txt ]] && pip install -r requirements.txt
  ok "install done"
  cat <<EOF

  Start karne ke liye:
    cd $ROOT/Wan2GP && source venv/bin/activate && python wgp.py --port 7860

  Phir RK GEM AI mein:
    /local  →  Wan2GP 🟢  (auto-detect)
    ya /settings → Local Models → Wan2GP → http://127.0.0.1:7860
    aur /studio → Video Studio → model = Wan 2.1 (1.3B)

EOF
}

install_comfyui() {
  say "ComfyUI (image + video) install → $ROOT/ComfyUI"
  mkdir -p "$ROOT"
  [[ -d "$ROOT/ComfyUI" ]] || git clone https://github.com/comfyanonymous/ComfyUI "$ROOT/ComfyUI"
  cd "$ROOT/ComfyUI"
  [[ -d venv ]] || $PY -m venv venv
  # shellcheck disable=SC1091
  source venv/bin/activate
  pip install --upgrade pip >/dev/null
  pip install -r requirements.txt
  ok "install done"
  cat <<EOF

  Start:
    cd $ROOT/ComfyUI && source venv/bin/activate && python main.py --port 8188

  Models yahan rakhein: ComfyUI/models/checkpoints/
  (SDXL ≈ 6 GB, FLUX.1-schnell ≈ 12 GB, Wan2.1-T2V-1.3B ≈ 6 GB)

EOF
}

case "${1:-}" in
  --check)   check_all ;;
  --ollama)  print_hardware; install_ollama ;;
  --wan2gp)  print_hardware; install_wan2gp ;;
  --comfyui) print_hardware; install_comfyui ;;
  --all)     print_hardware; install_ollama; install_wan2gp; install_comfyui; ok "sab ready" ;;
  *)
    cat <<EOF
RK GEM AI — local setup

  bash scripts/setup-local-video.sh --check      # hardware + status
  bash scripts/setup-local-video.sh --ollama     # chat
  bash scripts/setup-local-video.sh --wan2gp     # VIDEO (best for GPU)
  bash scripts/setup-local-video.sh --comfyui    # image + video
  bash scripts/setup-local-video.sh --all

Install location: \$RK_AI_HOME (default ~/rk-ai)
EOF
    ;;
esac
