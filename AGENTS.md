# AGENTS.md

This repo is a Next.js MVP for a voice-first tarot companion.

The intended product direction is: the user says or types their current situation, the app understands the situation, draws a default three-card tarot spread, and shows three tarot card images with a short spoken/written interpretation.

## Current State

- Framework: Next.js 16 App Router with React 19 and TypeScript.
- Main UI: `components/tarot-voice-app.tsx`.
- Tarot turn API: `app/api/tarot/turn/route.ts`.
- Optional text-to-speech API: `app/api/tarot/speak/route.ts`.
- Optional local VoxCPM TTS server: `scripts/voxcpm_tts_server.py`.
- OpenAI Responses and DeepSeek Chat Completions integration: `lib/openai.ts`.
- Local tarot deck, mock readings, and spread drawing: `lib/tarot.ts`.
- Shared types: `lib/types.ts`.
- Global styling: `app/globals.css`.

The app already supports:

- browser speech input through `SpeechRecognition`;
- text input fallback;
- assistant replies stored in local storage;
- a server-side `draw_tarot_spread` tool call;
- `single-card` and `three-card` spreads;
- mock mode when the selected text provider API key is missing;
- optional server-side TTS through `/api/tarot/speak`, backed by OpenAI, Cloudflare Workers AI MeloTTS, or VoxCPM.

The app does not yet generate or display real tarot images. It currently renders drawn cards as text tiles in the "Latest spread" panel.

## Product Goal

Build toward this core flow:

1. User describes their situation in natural language, preferably by voice.
2. The app sends the turn to `/api/tarot/turn`.
3. Luna asks one short clarifying question only when the situation is too vague.
4. Once the situation is specific enough, Luna draws three cards by default.
5. The response includes:
   - concise interpretation text;
   - three drawn card objects;
   - image data for each card, or stable URLs for generated card images.
6. The UI displays the three cards visually, preserving card position labels such as Past, Present, and Near future.

Keep tarot framed as reflection and guidance, not certainty. Avoid legal, medical, or financial certainty.

## Recommended Implementation Direction

Prefer keeping the image-generation pipeline on the server.

Suggested shape:

- Extend `DrawnCard` in `lib/types.ts` with optional image fields, for example:
  - `imageUrl?: string`;
  - `imagePrompt?: string`;
  - `imageStatus?: "pending" | "ready" | "failed"`.
- Add a server helper such as `lib/tarot-images.ts` to build consistent prompts from card name, orientation, position, focus area, and user question.
- Add an API route such as `app/api/tarot/images/route.ts` if image generation should happen after the reading, or generate images inside `/api/tarot/turn` if latency is acceptable.
- Store generated images somewhere durable before returning URLs. Avoid returning huge base64 payloads from normal chat turns unless this is only a local prototype.
- In mock mode, use deterministic placeholder images or CSS card art so the UI remains testable without an API key.
- Keep `/api/tarot/turn` as the product contract that other channels can reuse later.

If using OpenAI image generation, keep provider-specific code isolated from `components/tarot-voice-app.tsx`. The component should only consume typed response data.

## UX Requirements

- Default spread should be `three-card`.
- The visual result should be visible as a primary part of the experience, not hidden below the conversation.
- A drawn spread should show three fixed-size card images in order:
  - Past
  - Present
  - Near future
- Each card should show at least image, position, card name, orientation, and a short advice line.
- Loading states should account for image generation, which may be slower than text generation.
- Keep the interface usable on phone-sized screens.
- Do not make this a marketing landing page. The first screen should be the usable tarot experience.

## Code Conventions

- Use TypeScript types from `lib/types.ts` rather than duplicating response shapes.
- Keep OpenAI network calls server-side.
- Keep tarot deck mechanics in `lib/tarot.ts`.
- Keep model/tool orchestration in `lib/openai.ts`.
- Keep UI state and rendering in `components/tarot-voice-app.tsx`.
- Use `rg` for searching.
- Use `npm run typecheck` before handing off meaningful code changes.
- Use `npm run build` when changing API routes, Next config, or rendering behavior with higher risk.

## Environment

Expected environment variables:

```bash
AI_PROVIDER=openai
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

Set `AI_PROVIDER=deepseek` to use DeepSeek for tarot text reasoning. DeepSeek support lives in `lib/openai.ts` beside the OpenAI Responses implementation. OpenAI TTS still requires `OPENAI_API_KEY`.

Set `TTS_PROVIDER=voxcpm` to use local VoxCPM speech synthesis. VoxCPM is a Python model runtime, so run `python scripts/voxcpm_tts_server.py --host 127.0.0.1 --port 8810 --device auto` in a Python environment with `voxcpm` installed. The Next.js route calls `VOXCPM_TTS_ENDPOINT` and returns `audio/wav`.

Set `TTS_PROVIDER=cloudflare` to use Cloudflare Workers AI MeloTTS. The Next.js route calls Cloudflare's Workers AI REST API with `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_TTS_MODEL`, and `CLOUDFLARE_TTS_LANG`, then returns `audio/mpeg`.

Future image generation work will likely need an explicit image model variable, for example:

```bash
OPENAI_IMAGE_MODEL=...
```

Do not hard-code secrets or provider credentials.

## Local Commands

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

The dev server is configured for:

```text
http://127.0.0.1:3017
```

## Important Files

- `README.md`: user-facing project overview and API contract.
- `components/tarot-voice-app.tsx`: main client component, voice capture, chat state, spread rendering.
- `app/api/tarot/turn/route.ts`: validates turn requests, chooses mock or live mode.
- `app/api/tarot/speak/route.ts`: dispatches to OpenAI TTS, Cloudflare Workers AI MeloTTS, or local VoxCPM TTS and returns audio.
- `scripts/voxcpm_tts_server.py`: lightweight local HTTP server wrapping `voxcpm.VoxCPM.generate()`.
- `lib/openai.ts`: OpenAI Responses call, DeepSeek Chat Completions call, tool definition, tool output loops.
- `lib/tarot.ts`: deck templates, shuffle/draw logic, mock clarification behavior.
- `lib/types.ts`: shared request/response/card types.
- `app/globals.css`: global layout and component styling.

## Notes for Future Agents

- The current README mentions latest OpenAI model choices. Verify current OpenAI docs before changing model defaults.
- The repo may not have usable Git metadata in this workspace, so inspect files directly when needed.
- Preserve existing user changes. Do not reset or rewrite unrelated files.
- When adding image support, update `README.md` and this file together so the API contract stays discoverable.
