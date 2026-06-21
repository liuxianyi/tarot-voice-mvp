import type { DrawnSpread, SpreadType, TarotChatMessage, ToneStyle } from "@/lib/types";
import { drawTarotSpread } from "@/lib/tarot";

const OPENAI_API_URL = "https://api.openai.com/v1/responses";

type ResponsesOutputItem =
  | {
      type: "function_call";
      name: string;
      call_id: string;
      arguments: string;
    }
  | {
      type: "message";
      content?: ResponsesMessageContent[];
    }
  | {
      type: string;
      [key: string]: unknown;
    };

type ResponsesMessageContent =
  | {
      type: "output_text";
      text: string;
    }
  | {
      type: "text";
      text: string;
    }
  | {
      type: string;
      [key: string]: unknown;
    };

interface ResponsesPayload {
  model: string;
  instructions: string;
  input: unknown;
  tools?: unknown[];
  max_output_tokens?: number;
  text?: {
    verbosity: "low" | "medium" | "high";
  };
  reasoning?: {
    effort: "none" | "low" | "medium";
  };
  previous_response_id?: string;
}

interface ResponsesResult {
  id: string;
  output?: ResponsesOutputItem[];
  output_text?: string;
}

const tarotTools = [
  {
    type: "function",
    name: "draw_tarot_spread",
    description:
      "Draw a tarot spread for the caller once their situation is specific enough. Use single-card for a sharp pulse check and three-card for past/present/near-future guidance.",
    parameters: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "The user's actual question in plain language."
        },
        spreadType: {
          type: "string",
          enum: ["single-card", "three-card"],
          description: "Which spread to use for this turn."
        },
        focusArea: {
          type: "string",
          description: "A short tag such as love, work, self-worth, conflict, or money."
        }
      },
      required: ["question", "spreadType", "focusArea"],
      additionalProperties: false
    }
  }
];

function buildInstructions(tone: ToneStyle, spreadType: SpreadType, channel: string) {
  const toneGuide =
    tone === "direct"
      ? "Speak plainly, groundedly, and without fluff."
      : "Speak warmly, calm the user, and stay emotionally intelligent.";

  return [
    "You are Luna, an emotionally intelligent AI tarot reader.",
    toneGuide,
    `The preferred spread for this session is ${spreadType}.`,
    `The interaction channel is ${channel}.`,
    "Tarot is a reflection tool, not supernatural certainty.",
    "If the user's request is vague, ask exactly one short clarifying question and do not draw yet.",
    "If the user's request is concrete enough, call draw_tarot_spread exactly once for the current turn.",
    "After the tool returns, explain the spread in conversational language.",
    "Always end with two practical next steps.",
    "Never give legal, medical, or financial certainty. Redirect to reflection and grounded action.",
    "Keep the final answer easy to listen to aloud."
  ].join(" ");
}

function buildTranscript(history: TarotChatMessage[], userMessage: string) {
  const clippedHistory = history.slice(-8);
  const transcript = clippedHistory
    .map((message) => `${message.role === "user" ? "User" : "Luna"}: ${message.content}`)
    .join("\n\n");

  return [
    transcript ? `Conversation so far:\n${transcript}` : "Conversation so far:\nNew session.",
    `Latest user turn:\n${userMessage}`,
    "Decide whether to ask one clarifying question or draw the cards now."
  ].join("\n\n");
}

function parseFunctionArguments(raw: string): {
  question: string;
  spreadType: SpreadType;
  focusArea: string;
} {
  const parsed = JSON.parse(raw) as {
    question?: string;
    spreadType?: SpreadType;
    focusArea?: string;
  };

  return {
    question: parsed.question?.trim() || "General guidance",
    spreadType: parsed.spreadType === "single-card" ? "single-card" : "three-card",
    focusArea: parsed.focusArea?.trim() || "general"
  };
}

function extractText(result: ResponsesResult): string {
  if (typeof result.output_text === "string" && result.output_text.trim()) {
    return result.output_text.trim();
  }

  const text = (result.output || [])
    .flatMap((item) => {
      if (item.type !== "message") {
        return [];
      }

      const contentItems: ResponsesMessageContent[] = Array.isArray(item.content) ? item.content : [];

      return contentItems.map((content) => {
        if (content.type === "output_text" || content.type === "text") {
          return content.text;
        }

        return "";
      });
    })
    .filter(Boolean)
    .join("\n")
    .trim();

  return text;
}

async function callResponses(payload: ResponsesPayload) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI Responses API error: ${response.status} ${errorBody}`);
  }

  return (await response.json()) as ResponsesResult;
}

export async function runTarotTurn({
  history,
  userMessage,
  spreadType,
  tone,
  channel
}: {
  history: TarotChatMessage[];
  userMessage: string;
  spreadType: SpreadType;
  tone: ToneStyle;
  channel: string;
}): Promise<{ reply: string; cards: DrawnSpread | null }> {
  const model = process.env.OPENAI_MODEL || "gpt-5.5";
  const instructions = buildInstructions(tone, spreadType, channel);

  let result = await callResponses({
    model,
    instructions,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: buildTranscript(history, userMessage)
          }
        ]
      }
    ],
    tools: tarotTools,
    max_output_tokens: 900,
    text: {
      verbosity: "low"
    },
    reasoning: {
      effort: "none"
    }
  });

  let latestSpread: DrawnSpread | null = null;

  for (let step = 0; step < 3; step += 1) {
    const functionCalls = (result.output || []).filter(
      (item): item is Extract<ResponsesOutputItem, { type: "function_call" }> => item.type === "function_call"
    );

    if (functionCalls.length === 0) {
      break;
    }

    const toolOutputs = functionCalls.map((call) => {
      const args = parseFunctionArguments(call.arguments);
      const spread = drawTarotSpread(args.question, args.spreadType, args.focusArea);

      latestSpread = spread;

      return {
        type: "function_call_output",
        call_id: call.call_id,
        output: JSON.stringify(spread)
      };
    });

    result = await callResponses({
      model,
      instructions,
      previous_response_id: result.id,
      input: toolOutputs,
      tools: tarotTools,
      max_output_tokens: 900,
      text: {
        verbosity: "low"
      },
      reasoning: {
        effort: "none"
      }
    });
  }

  const reply =
    extractText(result) ||
    "I can read this more clearly if you tell me the exact decision, relationship, or work question you want the cards to focus on.";

  return {
    reply,
    cards: latestSpread
  };
}
