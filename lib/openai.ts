import type { DrawnSpread, LanguageStyle, SpreadType, TarotChatMessage, ToneStyle } from "@/lib/types";
import { drawTarotSpread } from "@/lib/tarot";

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

type AiProvider = "openai" | "deepseek";

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

type ChatToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_call_id?: string;
  tool_calls?: ChatToolCall[];
};

interface ChatCompletionResult {
  choices?: Array<{
    message?: {
      content?: string | null;
      tool_calls?: ChatToolCall[];
    };
  }>;
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

const deepseekTarotTools = tarotTools.map((tool) => ({
  type: "function",
  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters
  }
}));

function getAiProvider(): AiProvider {
  const requestedProvider = process.env.AI_PROVIDER;

  if (requestedProvider === "deepseek") {
    return process.env.DEEPSEEK_API_KEY ? "deepseek" : "openai";
  }

  if (requestedProvider === "openai") {
    return process.env.OPENAI_API_KEY ? "openai" : "deepseek";
  }

  // Prefer the provider that is actually configured so deployments do not
  // silently fall back to mock mode when AI_PROVIDER was omitted.
  if (process.env.DEEPSEEK_API_KEY) {
    return "deepseek";
  }

  return "openai";
}

export function hasLiveTarotProvider() {
  const provider = getAiProvider();

  if (provider === "deepseek") {
    return Boolean(process.env.DEEPSEEK_API_KEY);
  }

  return Boolean(process.env.OPENAI_API_KEY);
}

function buildInstructions(tone: ToneStyle, spreadType: SpreadType, channel: string, language: LanguageStyle) {
  const toneGuide =
    tone === "direct"
      ? "Speak plainly, groundedly, and without fluff."
      : "Speak warmly, calm the user, and stay emotionally intelligent.";
  const languageGuide =
    language === "zh"
      ? "Reply entirely in Simplified Chinese. Use natural, warm Chinese phrasing. Translate card positions and orientation into Chinese when mentioning them."
      : "Reply entirely in English. Use natural, warm English phrasing.";

  return [
    "You are Luna, an emotionally intelligent AI tarot reader.",
    toneGuide,
    languageGuide,
    `The preferred spread for this session is ${spreadType}.`,
    `The interaction channel is ${channel}.`,
    "Tarot is a reflection tool, not supernatural certainty.",
    "If the user's request is vague, ask exactly one short clarifying question and do not draw yet.",
    "If the user's request is concrete enough, call draw_tarot_spread exactly once for the current turn.",
    "After the tool returns, explain only the cards returned by the tool. Do not invent extra cards.",
    "Structure the reading around each returned card's position, name, orientation, meaning, and advice.",
    "Always end with two practical next steps.",
    "Never give legal, medical, or financial certainty. Redirect to reflection and grounded action.",
    "Do not use em dashes, en dashes, or Chinese long dash separators. Use periods, commas, colons, or line breaks instead.",
    "Keep the final answer easy to listen to aloud."
  ].join(" ");
}

function buildTranscript(history: TarotChatMessage[], userMessage: string, language: LanguageStyle) {
  const clippedHistory = history.slice(-8);
  const transcript = clippedHistory
    .map((message) => `${message.role === "user" ? (language === "zh" ? "用户" : "User") : "Luna"}: ${message.content}`)
    .join("\n\n");

  if (language === "zh") {
    return [
      transcript ? `目前对话：\n${transcript}` : "目前对话：\n新会话。",
      `用户最新一轮：\n${userMessage}`,
      "判断现在是只问一个澄清问题，还是已经可以抽牌。"
    ].join("\n\n");
  }

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

async function callDeepseekChat(messages: ChatMessage[]) {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is missing.");
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      messages,
      tools: deepseekTarotTools,
      max_tokens: 900,
      temperature: 0.8
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`DeepSeek Chat Completion API error: ${response.status} ${errorBody}`);
  }

  const result = (await response.json()) as ChatCompletionResult;
  const message = result.choices?.[0]?.message;

  if (!message) {
    throw new Error("DeepSeek returned an empty chat completion.");
  }

  return message;
}

async function runDeepseekTarotTurn({
  history,
  userMessage,
  spreadType,
  tone,
  language,
  channel
}: {
  history: TarotChatMessage[];
  userMessage: string;
  spreadType: SpreadType;
  tone: ToneStyle;
  language: LanguageStyle;
  channel: string;
}): Promise<{ reply: string; cards: DrawnSpread | null }> {
  const instructions = buildInstructions(tone, spreadType, channel, language);
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: instructions
    },
    {
      role: "user",
      content: buildTranscript(history, userMessage, language)
    }
  ];

  let latestSpread: DrawnSpread | null = null;

  for (let step = 0; step < 3; step += 1) {
    const message = await callDeepseekChat(messages);
    const toolCalls = message.tool_calls || [];

    messages.push({
      role: "assistant",
      content: message.content || null,
      tool_calls: toolCalls.length > 0 ? toolCalls : undefined
    });

    if (toolCalls.length === 0) {
      const reply =
        message.content?.trim() ||
        (language === "zh"
          ? "如果你告诉我更具体的决定、关系或工作问题，我会读得更清楚。"
          : "I can read this more clearly if you tell me the exact decision, relationship, or work question you want the cards to focus on.");

      return {
        reply,
        cards: latestSpread
      };
    }

    for (const call of toolCalls) {
      if (call.function.name !== "draw_tarot_spread") {
        continue;
      }

      const args = parseFunctionArguments(call.function.arguments);
      const spread = drawTarotSpread(args.question, args.spreadType, args.focusArea);
      latestSpread = spread;

      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(spread)
      });
    }
  }

  return {
    reply:
      language === "zh"
        ? "牌已经抽出，但这次解读没有稳定完成。你可以用同一个问题再问一次，我会更直接地解读这组牌。"
        : "I drew the cards, but the interpretation took too long to settle. Try asking again with the same question, and I will read the spread more directly.",
    cards: latestSpread
  };
}

export async function runTarotTurn({
  history,
  userMessage,
  spreadType,
  tone,
  language,
  channel
}: {
  history: TarotChatMessage[];
  userMessage: string;
  spreadType: SpreadType;
  tone: ToneStyle;
  language: LanguageStyle;
  channel: string;
}): Promise<{ reply: string; cards: DrawnSpread | null }> {
  if (getAiProvider() === "deepseek") {
    return runDeepseekTarotTurn({
      history,
      userMessage,
      spreadType,
      tone,
      language,
      channel
    });
  }

  const model = process.env.OPENAI_MODEL || "gpt-5.5";
  const instructions = buildInstructions(tone, spreadType, channel, language);

  let result = await callResponses({
    model,
    instructions,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: buildTranscript(history, userMessage, language)
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
    (language === "zh"
      ? "如果你告诉我更具体的决定、关系或工作问题，我会读得更清楚。"
      : "I can read this more clearly if you tell me the exact decision, relationship, or work question you want the cards to focus on.");

  return {
    reply,
    cards: latestSpread
  };
}
