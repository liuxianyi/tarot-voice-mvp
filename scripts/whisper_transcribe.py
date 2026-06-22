import argparse
import json
import sys

import mlx_whisper


def main() -> None:
    parser = argparse.ArgumentParser(description="Transcribe an audio file with MLX Whisper.")
    parser.add_argument("audio_path")
    parser.add_argument("--language", choices=("zh", "en"), default="zh")
    parser.add_argument("--model", default="mlx-community/whisper-small-mlx")
    args = parser.parse_args()

    result = mlx_whisper.transcribe(
        args.audio_path,
        path_or_hf_repo=args.model,
        language=args.language,
        fp16=True,
    )
    text = str(result.get("text", "")).strip()
    sys.stdout.write(json.dumps({"text": text}, ensure_ascii=False))


if __name__ == "__main__":
    main()
