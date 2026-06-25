# Tarot Voice MVP

A phone-ready tarot companion MVP built for the fastest possible first launch.

This project intentionally uses a chained voice workflow:

1. browser audio capture with local MLX Whisper transcription
2. text reasoning with OpenAI Responses API or DeepSeek Chat Completions
3. a server-side tarot drawing tool
4. optional OpenAI, Cloudflare Workers AI, or VoxCPM TTS playback

That choice is deliberate. OpenAI's voice-agent guidance says chained voice pipelines are the better fit when you want explicit control over transcription, text reasoning, and speech output, or when you want to reuse an existing text agent in a voice product. The same guide says speech-to-speech Realtime is best when you need barge-in and low-latency conversational feel. For a first shipping MVP, this chain is the fastest path.

## What ships in this repo

- A polished single-page web UI with a tarot-room visual theme
- A voice-first home flow with reading-type shortcuts
- A persistent history sidebar with new-reading and settings controls
- Mobile layout keeps the history panel as a compact side rail instead of moving it to the top
- A left-bottom settings popover for tone, language, and speech output
- Browser audio recording through `MediaRecorder`, transcribed locally with MLX Whisper
- `/api/tarot/turn` for the tarot brain
- Server-side tarot drawing via a function tool
- Optional `/api/tarot/speak` for OpenAI, Cloudflare Workers AI, or VoxCPM TTS
- Mock mode when the selected text provider API key is missing

## Stack

- `Next.js 16`
- `React 19`
- `OpenAI Responses API` or `DeepSeek Chat Completions`
- `OpenAI Audio Speech API`, `Cloudflare Workers AI MeloTTS`, or local `VoxCPM` TTS

## Environment

Copy `.env.example` to `.env.local` and fill in:

```bash
AI_PROVIDER=deepseek
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.5
TTS_PROVIDER=openai
OPENAI_TTS_MODEL=gpt-4o-mini-tts
OPENAI_TTS_VOICE=marin
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_TTS_MODEL=@cf/myshell-ai/melotts
CLOUDFLARE_TTS_LANG=zh
VOXCPM_TTS_ENDPOINT=http://127.0.0.1:8810/synthesize
VOXCPM_TTS_CONTROL=年轻女性，声音温柔平静，有疗愈感，语速适中，适合塔罗解读
VOXCPM_TTS_CFG=2.0
VOXCPM_TTS_STEPS=10
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-chat
```

Notes:

- Set `AI_PROVIDER=deepseek` to use DeepSeek for `/api/tarot/turn`.
- If `AI_PROVIDER` is omitted, the server automatically selects DeepSeek when `DEEPSEEK_API_KEY` is present; otherwise it selects OpenAI.
- DeepSeek uses `DEEPSEEK_API_KEY` and `DEEPSEEK_MODEL`.
- Set `TTS_PROVIDER=cloudflare` to use Cloudflare Workers AI MeloTTS for `/api/tarot/speak`.
- Set `TTS_PROVIDER=voxcpm` to use a local VoxCPM TTS service for `/api/tarot/speak`.
- OpenAI TTS uses `OPENAI_API_KEY`, even when the tarot turn uses DeepSeek.
- Cloudflare TTS uses `CLOUDFLARE_ACCOUNT_ID` and a `CLOUDFLARE_API_TOKEN` with Workers AI access.
- The current OpenAI latest-model guide lists `gpt-5.5` as the latest general model.
- The current text-to-speech guide recommends `gpt-4o-mini-tts` for intelligent realtime applications.
- The same guide says the best-quality built-in voices are `marin` and `cedar`.

## Cloudflare Workers AI TTS

Cloudflare MeloTTS is a low-cost server-side TTS option. The Next.js `/api/tarot/speak` route calls Cloudflare's Workers AI REST API and returns `audio/mpeg` to the browser.

Set:

```bash
TTS_PROVIDER=cloudflare
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_TTS_MODEL=@cf/myshell-ai/melotts
CLOUDFLARE_TTS_LANG=zh
```

Keep the app's speech output set to Server TTS in the UI. If Cloudflare rejects the language value for a deployment, override `CLOUDFLARE_TTS_LANG` with the value accepted by the model.

## VoxCPM TTS

VoxCPM is a Python model runtime, so this repo calls it through a small local HTTP service.

Install VoxCPM in a Python environment that satisfies the VoxCPM requirements:

```bash
pip install voxcpm
```

Start the local TTS service:

```bash
python scripts/voxcpm_tts_server.py --host 127.0.0.1 --port 8810 --device auto
```

Then set:

```bash
TTS_PROVIDER=voxcpm
VOXCPM_TTS_ENDPOINT=http://127.0.0.1:8810/synthesize
```

Keep the app's speech output set to Server TTS in the UI. That button means server-side AI voice; the server decides whether that is OpenAI or VoxCPM through `TTS_PROVIDER`.

## Local speech input

Install MLX Whisper into the project environment and start Next.js normally:

```bash
uv pip install --python .venv/bin/python mlx-whisper
npm run dev
```

The first recording downloads `mlx-community/whisper-small-mlx`; later recordings use the local model cache. Set `STT_MODEL` to choose another MLX Whisper model or `STT_PYTHON` to override the project Python executable.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3017](http://127.0.0.1:3017).

## API contract

### `POST /api/tarot/turn`

Request:

```json
{
  "history": [
    {
      "id": "msg_1",
      "role": "user",
      "content": "Should I leave my job this summer?",
      "createdAt": "2026-06-18T10:00:00.000Z"
    }
  ],
  "userMessage": "What am I not seeing?",
  "spreadType": "three-card",
  "tone": "soft",
  "channel": "web-voice"
}
```

Response:

```json
{
  "reply": "Here is the reading...",
  "cards": {
    "spreadType": "three-card",
    "focusQuestion": "What am I not seeing?",
    "focusArea": "career",
    "cards": []
  },
  "mode": "live"
}
```

This is the endpoint to reuse for phone agents.

## How to plug in Vapi, Retell, or Twilio later

Keep the tarot logic exactly as-is and only swap the audio layer.

### Vapi or Retell

- Let the platform handle call audio, ASR, and playback.
- Send the transcripted caller turn to `POST /api/tarot/turn`.
- Read the returned `reply` back to the caller.
- Optionally show the returned `cards` in your operator dashboard.

### Twilio plus your own orchestration

- Twilio captures the call.
- Your media or transcript layer turns speech into text.
- Your webhook posts each user turn to `/api/tarot/turn`.
- You can either play the returned `reply` through your own TTS, or call `/api/tarot/speak`.

## Product notes

- If the user question is too vague, Luna asks one clarifying question instead of drawing immediately.
- If the question is specific enough, the model calls the `draw_tarot_spread` tool and then interprets the cards.
- The default product path is a three-card reading, while specialized modes can request single-card or teaching-style turns.
- The interface keeps the tarot experience primary: the first screen is the usable reading surface, not a marketing landing page.
- Current styling uses a dark charcoal tarot-room palette with a restrained copper-gold accent.
- The history sidebar supports tactile hover and active states for new readings, history items, and settings.
- On phone-sized screens, the history sidebar remains on the side so navigation stays spatially consistent.
- Tarot is framed as reflection and guidance, not certainty.

## Production next steps

1. Store user history in a database instead of local storage.
2. Add auth and paid session limits.
3. Add event logging for conversion and session quality.
4. Add phone provider adapters.
5. Upgrade to Realtime only if you truly need interruption handling and lower audio latency.
