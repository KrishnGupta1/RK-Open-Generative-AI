# RK GEM AI — GPU agent (ComfyUI custom node)
#
# Kaggle / Colab / any rented GPU: paste this file next to ComfyUI once, and our
# website gets full control of the models — download, delete, see what is on
# disk, watch progress — without you ever typing a command again.
#
# How it is used (the 1-cell script does this automatically):
#
#   mkdir -p ComfyUI/custom_nodes/rkgem_agent
#   cp rkgem_agent.py ComfyUI/custom_nodes/rkgem_agent/__init__.py
#
# Then restart ComfyUI. Endpoints (all under the same tunnel URL):
#
#   GET  /rkgem/status              → { ok, gpu, vram, disk, python }
#   GET  /rkgem/models              → { files: {ckpt_name: [...], unet_name: [...]}, disk }
#   POST /rkgem/download            → { jobId }   body: {id, url, filename, folder}
#   GET  /rkgem/download/<jobId>    → { state, received, total, percent, speed, error }
#   POST /rkgem/delete              → { ok }      body: {filename, folder}
#   GET  /rkgem/downloads           → { jobs: [...] }
#
# Safety: only two folders are touched (models/<folder>), filenames are
# basenames only, and deletes move the file to models/.rkgem-trash/ so a
# mistake is recoverable.

import json
import os
import re
import shutil
import threading
import time
import urllib.request
import uuid

import folder_paths
from aiohttp import web
from server import PromptServer

ROUTES = PromptServer.instance.routes
JOBS = {}
JOBS_LOCK = threading.Lock()
TRASH = os.path.join(folder_paths.models_dir, ".rkgem-trash")

# object_info key → models subfolder
# Allowed model subfolders (models/<folder>). `llm` = coding models (GGUF).
ALLOWED_FOLDERS = {"checkpoints", "diffusion_models", "text_encoders",
                   "clip_vision", "vae", "loras", "llm", "unet", "clip"}

FOLDER_BY_FIELD = {
    "ckpt_name": "checkpoints",
    "unet_name": "diffusion_models",
    "clip_name": "text_encoders",
    "clip_vision_name": "clip_vision",
    "vae_name": "vae",
    "lora_name": "loras",
}

SAFE_DIR = re.compile(r"^[a-z_]+$")


def _safe_name(name):
    base = os.path.basename(str(name or ""))
    if not base or base in (".", "..") or base.startswith("."):
        raise ValueError("bad filename")
    return base


def _safe_dir(folder):
    folder = str(folder or "").strip().lower()
    if not SAFE_DIR.match(folder):
        raise ValueError("bad folder")
    if folder not in ALLOWED_FOLDERS:
        raise ValueError("folder not allowed")
    return folder


def _models_root():
    return folder_paths.models_dir


def _list_files():
    """What is on disk, keyed the same way ComfyUI's loaders see it."""
    out = {k: [] for k in FOLDER_BY_FIELD}
    root = _models_root()
    for field, sub in FOLDER_BY_FIELD.items():
        d = os.path.join(root, sub)
        if not os.path.isdir(d):
            continue
        found = []
        for dirpath, _dirnames, filenames in os.walk(d):
            for f in filenames:
                if f.endswith((".safetensors", ".ckpt", ".pt", ".pth", ".gguf", ".bin")):
                    rel = os.path.relpath(os.path.join(dirpath, f), d)
                    found.append(rel.replace(os.sep, "/"))
        out[field] = sorted(found)
    # clip_name is shared by CLIPLoader + CLIPVisionLoader in ComfyUI
    vision = out.pop("clip_vision_name", [])
    out["clip_name"] = sorted(set(out.get("clip_name", []) + ["clip_vision/" + v for v in vision]))
    return out


def _disk():
    try:
        usage = shutil.disk_usage(_models_root())
        return {
            "totalGB": round(usage.total / 1e9, 1),
            "freeGB": round(usage.free / 1e9, 1),
            "usedGB": round((usage.total - usage.free) / 1e9, 1),
        }
    except Exception:
        return None


def _gpu():
    try:
        import torch

        if not torch.cuda.is_available():
            return None
        props = torch.cuda.get_device_properties(0)
        free, total = torch.cuda.mem_get_info()
        return {
            "name": props.name,
            "count": torch.cuda.device_count(),
            "totalGB": round(total / 1e9, 1),
            "freeGB": round(free / 1e9, 1),
        }
    except Exception:
        return None


@ROUTES.get("/rkgem/status")
async def rkgem_status(_request):
    return web.json_response({"ok": True, "gpu": _gpu(), "disk": _disk(), "jobs": len(JOBS)})


@ROUTES.get("/rkgem/models")
async def rkgem_models(_request):
    return web.json_response({"ok": True, "files": _list_files(), "disk": _disk()})


def _worker(job_id, url, dest, total_hint):
    part = dest + ".part"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "rkgem-ai/1.0"})
        with urllib.request.urlopen(req, timeout=60) as resp, open(part, "wb") as fh:
            total = int(resp.headers.get("Content-Length") or 0) or total_hint
            with JOBS_LOCK:
                JOBS[job_id].update(state="downloading", total=total)
            received = 0
            started = time.time()
            while True:
                chunk = resp.read(1024 * 512)
                if not chunk:
                    break
                fh.write(chunk)
                received += len(chunk)
                elapsed = max(time.time() - started, 0.01)
                with JOBS_LOCK:
                    JOBS[job_id].update(
                        received=received,
                        percent=round(received / total * 100, 1) if total else None,
                        speedMBs=round(received / elapsed / 1e6, 1),
                    )
        os.replace(part, dest)
        with JOBS_LOCK:
            JOBS[job_id].update(state="done", percent=100.0, finished=time.time())
    except Exception as exc:  # noqa: BLE001 — surface any failure to the UI
        try:
            if os.path.exists(part):
                os.remove(part)
        except OSError:
            pass
        with JOBS_LOCK:
            JOBS[job_id].update(state="error", error=str(exc)[:300], finished=time.time())


@ROUTES.post("/rkgem/download")
async def rkgem_download(request):
    try:
        body = await request.json()
        filename = _safe_name(body.get("filename"))
        folder = _safe_dir(body.get("folder"))
        url = str(body.get("url") or "")
        if not url.startswith(("https://", "http://")):
            raise ValueError("bad url")
        dest_dir = os.path.join(_models_root(), folder)
        os.makedirs(dest_dir, exist_ok=True)
        dest = os.path.join(dest_dir, filename)
        if os.path.exists(dest):
            return web.json_response({"ok": True, "already": True, "jobId": None})
        job_id = uuid.uuid4().hex[:12]
        with JOBS_LOCK:
            JOBS[job_id] = {
                "id": job_id,
                "filename": filename,
                "folder": folder,
                "state": "queued",
                "received": 0,
                "total": 0,
                "percent": 0.0,
                "speedMBs": 0.0,
                "started": time.time(),
            }
        threading.Thread(
            target=_worker,
            args=(job_id, url, dest, int(body.get("sizeBytes") or 0)),
            daemon=True,
        ).start()
        return web.json_response({"ok": True, "jobId": job_id})
    except Exception as exc:  # noqa: BLE001
        return web.json_response({"ok": False, "error": str(exc)[:300]}, status=400)


@ROUTES.get("/rkgem/download/{job_id}")
async def rkgem_download_status(request):
    job_id = request.match_info["job_id"]
    with JOBS_LOCK:
        job = JOBS.get(job_id)
        job = dict(job) if job else None
    if not job:
        return web.json_response({"ok": False, "error": "unknown job"}, status=404)
    return web.json_response({"ok": True, **job})


@ROUTES.get("/rkgem/downloads")
async def rkgem_downloads(_request):
    with JOBS_LOCK:
        jobs = [dict(j) for j in JOBS.values()]
    jobs.sort(key=lambda j: j.get("started", 0), reverse=True)
    return web.json_response({"ok": True, "jobs": jobs[:40]})


@ROUTES.post("/rkgem/delete")
async def rkgem_delete(request):
    try:
        body = await request.json()
        filename = _safe_name(body.get("filename"))
        folder = _safe_dir(body.get("folder"))
        src = os.path.join(_models_root(), folder, filename)
        if not os.path.exists(src):
            return web.json_response({"ok": False, "error": "file not found"}, status=404)
        os.makedirs(TRASH, exist_ok=True)
        target = os.path.join(TRASH, f"{int(time.time())}-{filename}")
        shutil.move(src, target)
        return web.json_response({"ok": True, "movedTo": "models/.rkgem-trash/" + os.path.basename(target)})
    except Exception as exc:  # noqa: BLE001
        return web.json_response({"ok": False, "error": str(exc)[:300]}, status=400)


NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}
print("[RK GEM AI] model agent ready → /rkgem/status")
