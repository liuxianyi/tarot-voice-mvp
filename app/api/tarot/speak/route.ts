import type { LanguageStyle } from "@/lib/types";

type TtsProvider = "openai" | "voxcpm" | "cloudflare";

function getTtsProvider(): TtsProvider {
  if (process.env.TTS_PROVIDER === "voxcpm") {
    return "voxcpm";
  }

  if (process.env.TTS_PROVIDER === "cloudflare") {
    return "cloudflare";
  }

  return "openai";
}

function getOpenAiVoiceInstructions(language: LanguageStyle) {
  return language === "zh"
    ? "用温柔、平静、略带疗愈感的中文塔罗解读语气朗读，节奏清晰，停顿自然。"
    : "Speak like a calm tarot guide with warmth, patience, and clean pacing.";
}

function getVoxCpmControl(language: LanguageStyle) {
  return (
    process.env.VOXCPM_TTS_CONTROL ||
    (language === "zh" ? "年轻女性，声音温柔平静，有疗愈感，语速适中，适合塔罗解读" : "A warm young woman, calm and gentle, medium pace, suitable for a tarot reading")
  );
}

function getCloudflareTtsLanguage(language: LanguageStyle) {
  return process.env.CLOUDFLARE_TTS_LANG || (language === "zh" ? "zh" : "en");
}

function decodeBase64Audio(audio: string) {
  const binary = atob(audio);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function callOpenAiTts(text: string, language: LanguageStyle) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return Response.json({ error: "OPENAI_API_KEY is missing." }, { status: 501 });
  }

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
      voice: process.env.OPENAI_TTS_VOICE || "marin",
      input: text.slice(0, 1800),
      instructions: getOpenAiVoiceInstructions(language)
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    const errorBody = await response.text();
    return Response.json(
      {
        error: "OpenAI TTS request failed.",
        detail: errorBody
      },
      { status: 500 }
    );
  }

  const audio = await response.arrayBuffer();

  return new Response(audio, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store"
    }
  });
}

async function callCloudflareTts(text: string, language: LanguageStyle) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const model = process.env.CLOUDFLARE_TTS_MODEL || "@cf/myshell-ai/melotts";

  if (!accountId || !apiToken) {
    return Response.json({ error: "CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are required for Cloudflare TTS." }, { status: 501 });
  }

  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: text.slice(0, 900),
      lang: getCloudflareTtsLanguage(language)
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    const errorBody = await response.text();
    return Response.json(
      {
        error: "Cloudflare TTS request failed.",
        detail: errorBody
      },
      { status: 500 }
    );
  }

  const result = (await response.json()) as { result?: { audio?: string }; errors?: unknown[] };
  const audio = result.result?.audio;

  if (!audio) {
    return Response.json(
      {
        error: "Cloudflare TTS response did not include audio.",
        detail: result
      },
      { status: 500 }
    );
  }

  return new Response(decodeBase64Audio(audio), {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store"
    }
  });
}

async function callVoxCpmTts(text: string, language: LanguageStyle) {
  const endpoint = process.env.VOXCPM_TTS_ENDPOINT || "http://127.0.0.1:8810/synthesize";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text: text.slice(0, 900),
      control: getVoxCpmControl(language),
      language,
      cfg_value: Number(process.env.VOXCPM_TTS_CFG || "2.0"),
      inference_timesteps: Number(process.env.VOXCPM_TTS_STEPS || "10"),
      normalize: process.env.VOXCPM_TTS_NORMALIZE !== "false",
      denoise: process.env.VOXCPM_TTS_DENOISE === "true"
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    const errorBody = await response.text();
    return Response.json(
      {
        error: "VoxCPM TTS request failed.",
        detail: errorBody
      },
      { status: 500 }
    );
  }

  const audio = await response.arrayBuffer();

  return new Response(audio, {
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "audio/wav",
      "Cache-Control": "no-store"
    }
  });
}

export async function POST(request: Request) {
  let body: { language?: LanguageStyle; text?: string };

  try {
    body = (await request.json()) as { language?: LanguageStyle; text?: string };
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = body.text?.trim();
  const language = body.language === "en" ? "en" : "zh";

  if (!text) {
    return Response.json({ error: "text is required." }, { status: 400 });
  }

  const provider = getTtsProvider();

  if (provider === "voxcpm") {
    return callVoxCpmTts(text, language);
  }

  if (provider === "cloudflare") {
    return callCloudflareTts(text, language);
  }

  return callOpenAiTts(text, language);
}
