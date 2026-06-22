import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

export const runtime = "nodejs";
export const maxDuration = 120;

const execFileAsync = promisify(execFile);
const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();
  const audio = formData.get("audio");
  const language = formData.get("language") === "en" ? "en" : "zh";

  if (!(audio instanceof File) || audio.size === 0) {
    return Response.json({ error: "audio is required." }, { status: 400 });
  }

  if (audio.size > MAX_AUDIO_BYTES) {
    return Response.json({ error: "Audio is too large. Keep recordings under 15 MB." }, { status: 413 });
  }

  const workDir = await mkdtemp(path.join(tmpdir(), "tarot-stt-"));
  const extension = audio.type.includes("mp4") ? ".mp4" : audio.type.includes("ogg") ? ".ogg" : ".webm";
  const audioPath = path.join(workDir, `recording${extension}`);

  try {
    await writeFile(audioPath, Buffer.from(await audio.arrayBuffer()));

    const python = process.env.STT_PYTHON || path.join(process.cwd(), ".venv", "bin", "python");
    const script = path.join(process.cwd(), "scripts", "whisper_transcribe.py");
    const model = process.env.STT_MODEL || "mlx-community/whisper-small-mlx";
    const { stdout } = await execFileAsync(python, [script, audioPath, "--language", language, "--model", model], {
      env: {
        ...process.env,
        HF_ENDPOINT: process.env.HF_ENDPOINT || "https://hf-mirror.com",
        NO_PROXY: "127.0.0.1,localhost",
        no_proxy: "127.0.0.1,localhost"
      },
      maxBuffer: 1024 * 1024,
      timeout: 120_000
    });
    const result = JSON.parse(stdout) as { text?: string };
    const text = result.text?.trim();

    if (!text) {
      return Response.json({ error: language === "zh" ? "没有识别到语音，请再试一次。" : "No speech was recognized. Please try again." }, { status: 422 });
    }

    return Response.json({ text });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown transcription error.";
    return Response.json({ error: "Local speech transcription failed.", detail }, { status: 500 });
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
