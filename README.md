# Tarot Voice MVP

A phone-ready tarot companion MVP built for the fastest possible first launch.

This project intentionally uses a chained voice workflow:

1. browser speech capture
2. text reasoning with the OpenAI Responses API
3. a server-side tarot drawing tool
4. optional OpenAI TTS playback

That choice is deliberate. OpenAI's voice-agent guidance says chained voice pipelines are the better fit when you want explicit control over transcription, text reasoning, and speech output, or when you want to reuse an existing text agent in a voice product. The same guide says speech-to-speech Realtime is best when you need barge-in and low-latency conversational feel. For a first shipping MVP, this chain is the fastest path.

## What ships in this repo

- A polished single-page web UI
- Browser voice input through `SpeechRecognition`
- `/api/tarot/turn` for the tarot brain
- Server-side tarot drawing via a function tool
- Optional `/api/tarot/speak` for OpenAI TTS
- Mock mode when `OPENAI_API_KEY` is missing

## Stack

- `Next.js 16`
- `React 19`
- `OpenAI Responses API`
- `OpenAI Audio Speech API`

## Environment

Copy `.env.example` to `.env.local` and fill in:

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.5
OPENAI_TTS_MODEL=gpt-4o-mini-tts
OPENAI_TTS_VOICE=marin
```

Notes:

- The current OpenAI latest-model guide lists `gpt-5.5` as the latest general model.
- The current text-to-speech guide recommends `gpt-4o-mini-tts` for intelligent realtime applications.
- The same guide says the best-quality built-in voices are `marin` and `cedar`.

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
- Tarot is framed as reflection and guidance, not certainty.

## Production next steps

1. Store user history in a database instead of local storage.
2. Add auth and paid session limits.
3. Add event logging for conversion and session quality.
4. Add phone provider adapters.
5. Upgrade to Realtime only if you truly need interruption handling and lower audio latency.
