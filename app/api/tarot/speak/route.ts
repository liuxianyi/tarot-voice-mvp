export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return Response.json({ error: "OPENAI_API_KEY is missing." }, { status: 501 });
  }

  let body: { text?: string };

  try {
    body = (await request.json()) as { text?: string };
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = body.text?.trim();

  if (!text) {
    return Response.json({ error: "text is required." }, { status: 400 });
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
      instructions: "Speak like a calm tarot guide with warmth, patience, and clean pacing."
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
