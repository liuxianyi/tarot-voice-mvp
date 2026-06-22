#!/usr/bin/env python3
"""Small VoxCPM TTS HTTP server for the Next.js tarot app.

Install dependencies separately:
  pip install voxcpm

Run:
  python scripts/voxcpm_tts_server.py --host 127.0.0.1 --port 8810 --device auto

Request:
  POST /synthesize
  {"text":"你好","control":"年轻女性，声音温柔平静","cfg_value":2.0}

Response:
  audio/wav
"""

from __future__ import annotations

import argparse
import io
import json
import logging
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

import soundfile as sf
from voxcpm import VoxCPM
from voxcpm.model.utils import resolve_runtime_device

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
LOGGER = logging.getLogger("voxcpm-tts-server")


class VoxCpmEngine:
    def __init__(self, model_id: str, device: str) -> None:
        self.model_id = model_id
        self.device = resolve_runtime_device(device, "cuda")
        self.optimize = self.device.startswith("cuda")
        self.model: VoxCPM | None = None

    def get_model(self) -> VoxCPM:
        if self.model is None:
            LOGGER.info("Loading VoxCPM model %s on %s", self.model_id, self.device)
            self.model = VoxCPM.from_pretrained(
                self.model_id,
                optimize=self.optimize,
                device=self.device,
            )
            LOGGER.info("VoxCPM model loaded")
        return self.model

    def synthesize(self, payload: dict[str, Any]) -> bytes:
        text = str(payload.get("text") or "").strip()
        if not text:
            raise ValueError("text is required")

        control = str(payload.get("control") or "").strip()
        control = re.sub(r"[()（）]", "", control).strip()
        final_text = f"({control}){text}" if control else text

        cfg_value = float(payload.get("cfg_value") or 2.0)
        inference_timesteps = int(payload.get("inference_timesteps") or 10)
        normalize = bool(payload.get("normalize", True))
        denoise = bool(payload.get("denoise", False))
        reference_wav_path = payload.get("reference_wav_path") or None
        prompt_wav_path = payload.get("prompt_wav_path") or None
        prompt_text = str(payload.get("prompt_text") or "").strip() or None

        model = self.get_model()
        LOGGER.info("Synthesizing %d chars", len(text))
        kwargs: dict[str, Any] = {
            "text": final_text,
            "reference_wav_path": reference_wav_path,
            "cfg_value": cfg_value,
            "inference_timesteps": inference_timesteps,
            "normalize": normalize,
            "denoise": denoise,
        }

        if prompt_wav_path and prompt_text:
            kwargs["prompt_wav_path"] = prompt_wav_path
            kwargs["prompt_text"] = prompt_text

        wav = model.generate(**kwargs)
        buffer = io.BytesIO()
        sf.write(buffer, wav, model.tts_model.sample_rate, format="WAV")
        return buffer.getvalue()


def make_handler(engine: VoxCpmEngine):
    class Handler(BaseHTTPRequestHandler):
        protocol_version = "HTTP/1.1"

        def do_GET(self) -> None:
          if self.path == "/health":
              body = b'{"ok":true}'
              self.send_response(200)
              self.send_header("Content-Type", "application/json")
              self.send_header("Content-Length", str(len(body)))
              self.end_headers()
              self.wfile.write(body)
              return
          self.send_error(404)

        def do_POST(self) -> None:
            if self.path != "/synthesize":
                self.send_error(404)
                return

            try:
                content_length = int(self.headers.get("Content-Length", "0"))
                raw_body = self.rfile.read(content_length)
                payload = json.loads(raw_body.decode("utf-8")) if raw_body else {}
                audio = engine.synthesize(payload)
                self.send_response(200)
                self.send_header("Content-Type", "audio/wav")
                self.send_header("Content-Length", str(len(audio)))
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                self.wfile.write(audio)
            except Exception as error:
                LOGGER.exception("Synthesis failed")
                body = json.dumps({"error": str(error)}, ensure_ascii=False).encode("utf-8")
                self.send_response(500)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)

        def log_message(self, format: str, *args: Any) -> None:
            LOGGER.info("%s - %s", self.address_string(), format % args)

    return Handler


def main() -> None:
    parser = argparse.ArgumentParser(description="Run a local VoxCPM TTS HTTP server.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=8810, type=int)
    parser.add_argument("--model-id", default="openbmb/VoxCPM2")
    parser.add_argument("--device", default="auto")
    args = parser.parse_args()

    engine = VoxCpmEngine(model_id=args.model_id, device=args.device)
    server = ThreadingHTTPServer((args.host, args.port), make_handler(engine))
    LOGGER.info("VoxCPM TTS server listening on http://%s:%s", args.host, args.port)
    server.serve_forever()


if __name__ == "__main__":
    main()
