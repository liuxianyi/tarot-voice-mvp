import { hasLiveTarotProvider, runTarotTurn } from "@/lib/openai";
import { createMockTarotTurn } from "@/lib/tarot";
import type { TarotTurnRequest } from "@/lib/types";

export async function POST(request: Request) {
  let body: TarotTurnRequest;

  try {
    body = (await request.json()) as TarotTurnRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const userMessage = body.userMessage?.trim();
  const spreadType = body.spreadType === "single-card" ? "single-card" : "three-card";
  const tone = body.tone === "direct" ? "direct" : "soft";
  const language = body.language === "en" ? "en" : "zh";
  const history = Array.isArray(body.history) ? body.history : [];
  const channel = body.channel || "web-text";

  if (!userMessage) {
    return Response.json({ error: "userMessage is required." }, { status: 400 });
  }

  if (!hasLiveTarotProvider()) {
    return Response.json(createMockTarotTurn(userMessage, spreadType, tone, language));
  }

  try {
    const result = await runTarotTurn({
      history,
      userMessage,
      spreadType,
      tone,
      language,
      channel
    });

    return Response.json({
      ...result,
      mode: "live"
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error: "Tarot turn failed.",
        detail: error instanceof Error ? error.message : "Unknown error."
      },
      { status: 500 }
    );
  }
}
