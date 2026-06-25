"use client";

import {
  BadgeQuestionMark,
  BookOpen,
  Bot,
  CalendarDays,
  CalendarRange,
  Heart,
  LockKeyhole,
  Mic,
  Moon,
  PanelTop,
  RotateCcw,
  Send,
  Settings,
  Sparkles,
  Volume2,
  X
} from "lucide-react";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type {
  DrawnCard,
  DrawnSpread,
  LanguageStyle,
  MessageSource,
  ReadingMode,
  SpreadType,
  TarotChatMessage,
  TarotTurnResponse,
  ToneStyle
} from "@/lib/types";

type ModeIcon = typeof Sparkles;

const STORAGE_KEY = "tarot-voice-mvp-history";
const SESSIONS_STORAGE_KEY = "tarot-voice-mvp-sessions";
const LANGUAGE_STORAGE_KEY = "tarot-voice-mvp-language";
const MAX_HISTORY = 18;

const uiText = {
  zh: {
    intro:
      "我是 Luna。你可以告诉我一段关系、一次职业选择、金钱压力，或任何正在消化的心结。如果问题已经足够清楚，我会先抽牌，再解读；如果还太模糊，我只会先问一个简短的澄清问题。",
    quickPrompts: ["我刚失恋，想看看这段关系给我的提醒。", "我最近在考虑离职，想知道自己没看见什么。", "我和对方的关系很暧昧，我该继续吗？", "我对钱和未来很焦虑，下一步该怎么走？"],
    readingModesLabel: "占卜形式",
    homeGreeting: "让牌面照见此刻的答案",
    modeStripLabel: "当前占卜形式",
    modeCatalogTitle: "选择一种占卜形式开始",
    historyTitle: "历史占卜",
    emptyHistory: "暂无历史记录",
    newReading: "新的占卜",
    classicMode: "三张牌",
    yesNoMode: "是或否",
    dailyMode: "每日指引",
    relationshipMode: "情感牌阵",
    forecastMode: "周期运势",
    learningMode: "牌阵教学",
    privateMode: "私占咨询",
    messageMode: "宇宙传讯",
    aiMode: "AI 塔罗",
    classicHint: "说出具体情况，Luna 默认抽三张牌。",
    yesNoHint: "问一个能回答倾向的问题，Luna 抽一张牌。",
    dailyHint: "不用输入问题，抽今天的一张指引。",
    relationshipHint: "围绕关系状态、对方想法、下一步。",
    forecastHint: "看本周、本月或某阶段的节奏。",
    learningHint: "解释适合这个问题的牌阵和问法。",
    privateHint: "像私占一样先承接背景，再抽牌。",
    messageHint: "偏情绪陪伴和当下提醒。",
    aiHint: "用更结构化的方式拆解问题。",
    dailyQuestion: "请为我抽一张今天的塔罗指引牌，看看我今天最需要留意什么，以及可以采取的一个行动。",
    forecastQuestion: "请为我做一个本周塔罗运势，看看整体主题、需要留意的挑战，以及一个行动建议。",
    learningQuestion: "请教我这个问题适合用什么塔罗牌阵，并给我一个简单可执行的问法。",
    messageQuestion: "请给我一则当下的塔罗传讯，看看现在有什么正在靠近我，以及我需要如何安顿自己。",
    aiQuestion: "请用 AI 塔罗的方式帮我结构化分析当前问题，先拆解关键变量，再抽牌给出反思建议。",
    dailyButton: "抽今日指引",
    forecastButton: "看本周",
    learningButton: "学牌阵",
    messageButton: "收传讯",
    aiButton: "AI 分析",
    eyebrow: "Luna 会先抽牌，再解读",
    title: "Tarot",
    spread: "牌阵",
    threeCards: "三张牌",
    singleCard: "单张牌",
    tone: "语气",
    warm: "温柔",
    direct: "直接",
    language: "语言",
    chinese: "中文",
    english: "English",
    voiceIn: "语音输入",
    voiceOut: "语音输出",
    textOnly: "仅文字",
    browser: "浏览器",
    openaiTts: "AI 语音",
    callSetup: "占卜设置",
    reset: "重置",
    readerTone: "解读语气",
    speechOutput: "朗读方式",
    autoSpeak: "自动朗读解读",
    questionLabel: "你的问题",
    questionPlaceholder: "说说你现在的情况，感情、工作、金钱或某个决定都可以。",
    speak: "说话",
    listening: "聆听中",
    transcribing: "转写中",
    send: "发送",
    reading: "解读中",
    supportNote: "当前浏览器不支持语音输入，你仍然可以用文字聊天。",
    quickPromptsLabel: "快速开始",
    latestSpread: "最近牌阵",
    threeSpreadHint: "过去、现在、近期走向",
    singleSpreadHint: "核心讯息",
    drawing: "抽牌中",
    currentSpread: "当前牌阵",
    waiting: "等待中",
    stageEmptyTitle: "告诉 Luna 正在发生什么。",
    stageDrawing: "牌会先被抽出，然后再写下解读。",
    stageHasSpread: "下面的解读依据这几张已经翻开的牌。",
    stageEmpty: "一个清楚的情况，会开启三张牌阵。",
    assistantName: "Luna",
    userName: "你",
    now: "现在",
    loading: "正在阅读你的描述，判断是先澄清，还是可以抽牌……",
    sourceText: "文字",
    sourceVoice: "语音",
    live: "实时",
    mock: "模拟",
    voiceUnavailable: "这个浏览器暂时无法语音识别，你可以直接输入文字。",
    voiceStopped: "语音输入已停止",
    voiceNetworkError: "本地语音转写失败，请确认 Whisper 已安装并稍后重试。",
    voicePermissionError: "麦克风权限未开启。请在浏览器地址栏的网站权限中允许使用麦克风。",
    voiceNoSpeech: "没有听清楚，请靠近麦克风后再试一次。",
    voiceStartFailed: "语音输入无法启动。如果浏览器已经占用麦克风，请停止后再试。",
    ttsFallback: "OpenAI 语音暂时不可用，已切换为浏览器朗读。",
    ttsUnavailable: "OpenAI 语音暂时不可用。",
    turnFailed: "塔罗解读失败。"
  },
  en: {
    intro:
      "I am Luna. Ask me about a relationship, career move, money decision, or emotional knot. If your question is clear enough, I will draw the cards. If not, I will ask one short clarifier first.",
    quickPrompts: [
      "Should I leave my current job this summer?",
      "What is really happening in this situationship?",
      "What am I not seeing about my money stress?",
      "What is the next clean step for my side project?"
    ],
    readingModesLabel: "Reading type",
    homeGreeting: "Let the cards reflect this moment",
    modeStripLabel: "Current reading type",
    modeCatalogTitle: "Choose a reading type to begin",
    historyTitle: "Reading history",
    emptyHistory: "No readings yet",
    newReading: "New reading",
    classicMode: "Three cards",
    yesNoMode: "Yes or No",
    dailyMode: "Daily guide",
    relationshipMode: "Relationship",
    forecastMode: "Forecast",
    learningMode: "Spread lesson",
    privateMode: "Private reading",
    messageMode: "Intuitive message",
    aiMode: "AI tarot",
    classicHint: "Describe a specific situation. Luna draws three cards by default.",
    yesNoHint: "Ask one question with a clear leaning. Luna draws one card.",
    dailyHint: "No typing needed. Draw one card for today.",
    relationshipHint: "Focus on the bond, their stance, and the next move.",
    forecastHint: "Read the rhythm of this week, month, or phase.",
    learningHint: "Learn which spread fits your question.",
    privateHint: "Give context for a more consultative reading.",
    messageHint: "A softer message for what is moving toward you.",
    aiHint: "Structure the situation before drawing cards.",
    dailyQuestion: "Please draw one tarot card as my guidance for today. Show what I most need to notice today and one action I can take.",
    forecastQuestion: "Please give me a tarot forecast for this week: the overall theme, the challenge to watch, and one action I can take.",
    learningQuestion: "Teach me which tarot spread fits this question and give me a simple, practical wording I can use.",
    messageQuestion: "Please give me an intuitive tarot message for this moment: what may be moving toward me and how I can steady myself.",
    aiQuestion: "Use an AI tarot style to structure my current issue first, then draw cards and give reflective advice.",
    dailyButton: "Draw today",
    forecastButton: "This week",
    learningButton: "Teach me",
    messageButton: "Receive",
    aiButton: "Analyze",
    eyebrow: "Luna reads after the cards are drawn",
    title: "Tarot",
    spread: "Spread",
    threeCards: "Three cards",
    singleCard: "Single card",
    tone: "Tone",
    warm: "Warm",
    direct: "Direct",
    language: "Language",
    chinese: "中文",
    english: "English",
    voiceIn: "Voice in",
    voiceOut: "Voice out",
    textOnly: "Text only",
    browser: "Browser",
    openaiTts: "Server TTS",
    callSetup: "Call setup",
    reset: "Reset",
    readerTone: "Reader tone",
    speechOutput: "Speech output",
    autoSpeak: "Auto-play the reading out loud",
    questionLabel: "Your question",
    questionPlaceholder: "Ask about love, work, money, or a decision.",
    speak: "Speak",
    listening: "Listening",
    transcribing: "Transcribing",
    send: "Send",
    reading: "Reading",
    supportNote: "This browser does not support voice input yet. Text chat is still fully available.",
    quickPromptsLabel: "Quick prompts",
    latestSpread: "Latest spread",
    threeSpreadHint: "Past, present, near future",
    singleSpreadHint: "Single core card",
    drawing: "Drawing",
    currentSpread: "Current spread",
    waiting: "Waiting",
    stageEmptyTitle: "Tell Luna what is happening.",
    stageDrawing: "Cards are being selected before the reading is written.",
    stageHasSpread: "The interpretation below is based on these revealed cards.",
    stageEmpty: "A clear situation unlocks the three-card spread.",
    assistantName: "Luna",
    userName: "You",
    now: "now",
    loading: "Reading the thread and deciding whether to clarify or draw...",
    sourceText: "text",
    sourceVoice: "voice",
    live: "Live",
    mock: "Mock",
    voiceUnavailable: "Speech recognition is not available in this browser. You can still type.",
    voiceStopped: "Voice capture stopped",
    voiceNetworkError: "Local speech transcription failed. Check the Whisper installation and try again.",
    voicePermissionError: "Microphone access is blocked. Allow microphone access in this site's browser permissions.",
    voiceNoSpeech: "No speech was detected. Move closer to the microphone and try again.",
    voiceStartFailed: "Voice capture could not start. If your browser already has the mic open, stop it and try again.",
    ttsFallback: "OpenAI TTS was unavailable, so the browser voice will take over.",
    ttsUnavailable: "OpenAI TTS unavailable.",
    turnFailed: "Tarot turn failed."
  }
} satisfies Record<LanguageStyle, Record<string, string | string[]>>;

interface TarotSession {
  id: string;
  title: string;
  messages: TarotChatMessage[];
  updatedAt: string;
}

function createIntroMessage(language: LanguageStyle): TarotChatMessage {
  return {
    id: "intro",
    role: "assistant",
    content: uiText[language].intro as string,
    createdAt: new Date().toISOString(),
    cards: null
  };
}

function createSessionId() {
  return `session-${crypto.randomUUID()}`;
}

function createEmptySession(language: LanguageStyle): TarotSession {
  const intro = createIntroMessage(language);

  return {
    id: createSessionId(),
    title: uiText[language].newReading as string,
    messages: [intro],
    updatedAt: intro.createdAt
  };
}

function titleForMessages(messages: TarotChatMessage[], fallback: string) {
  const firstUserMessage = messages.find((message) => message.role === "user")?.content.trim();

  if (!firstUserMessage) {
    return fallback;
  }

  return firstUserMessage.length > 28 ? `${firstUserMessage.slice(0, 28)}...` : firstUserMessage;
}

function createMessage(role: "user" | "assistant", content: string, source?: MessageSource, cards?: DrawnSpread | null) {
  return {
    id: `${role}-${crypto.randomUUID()}`,
    role,
    content,
    source,
    cards: cards || null,
    createdAt: new Date().toISOString()
  } satisfies TarotChatMessage;
}

function spreadForMode(mode: ReadingMode, fallback: SpreadType): SpreadType {
  if (mode === "yes-no" || mode === "daily" || mode === "message" || mode === "learning") {
    return "single-card";
  }

  return mode === "classic" ? fallback : "three-card";
}

function defaultPromptForMode(mode: ReadingMode, text: Record<string, string | string[]>) {
  if (mode === "daily") return text.dailyQuestion as string;
  if (mode === "forecast") return text.forecastQuestion as string;
  if (mode === "learning") return text.learningQuestion as string;
  if (mode === "message") return text.messageQuestion as string;
  if (mode === "ai") return text.aiQuestion as string;
  return "";
}

function instructionForMode(mode: ReadingMode, language: LanguageStyle) {
  const zh = {
    classic: "模式：经典三张牌。围绕用户的具体处境抽牌，优先使用过去、现在、近期走向的结构。",
    "yes-no": "模式：是或否。用户需要一个倾向性回答。抽单张牌，给出偏是、偏否或暂不清晰的反思性倾向，不要做确定预言。",
    daily: "模式：每日指引。抽单张牌，聚焦今天最需要留意的主题和一个可执行行动。",
    relationship: "模式：情感牌阵。抽三张牌，聚焦关系现状、对方或互动中的隐藏信号、用户下一步建议。",
    forecast: "模式：周期运势。抽三张牌，聚焦整体主题、挑战、行动建议。避免绝对预测。",
    learning: "模式：牌阵教学。优先教学，不要神秘化。可抽单张牌作为示例，并说明适合的牌阵、提问方式和使用边界。",
    private: "模式：私占咨询。像一对一咨询一样承接背景。如果信息足够具体，抽三张牌并给出细致但简洁的解读；如果太空泛，只问一个澄清问题。",
    message: "模式：宇宙传讯。抽单张牌，语气更安抚，聚焦当下情绪、正在靠近的主题和自我安顿。不要宣称超自然确定性。",
    ai: "模式：AI 塔罗。先结构化拆解用户问题的关键变量，再抽三张牌做反思性建议。保持温暖，不要显得机械。"
  } satisfies Record<ReadingMode, string>;
  const en = {
    classic: "Mode: classic three-card reading. Use the user's specific situation and prefer a past, present, near-future structure.",
    "yes-no": "Mode: yes-or-no. The user wants a leaning. Draw one card and answer as leaning yes, leaning no, or not clear yet. Do not claim certainty.",
    daily: "Mode: daily guidance. Draw one card for what to notice today and one practical action.",
    relationship: "Mode: relationship spread. Draw three cards for the current bond, hidden signal in the interaction, and the user's next step.",
    forecast: "Mode: period forecast. Draw three cards for overall theme, challenge, and action. Avoid absolute prediction.",
    learning: "Mode: spread lesson. Prioritize teaching. You may draw one example card and explain the fitting spread, wording, and boundaries.",
    private: "Mode: private consultation. Hold the user's context like a one-on-one reading. Draw three cards if specific enough, otherwise ask one clarifier.",
    message: "Mode: intuitive message. Draw one card with a soothing tone, focused on the present emotional theme and self-grounding. Do not claim supernatural certainty.",
    ai: "Mode: AI tarot. First structure the key variables in the user's issue, then draw three cards for reflective advice. Stay warm, not mechanical."
  } satisfies Record<ReadingMode, string>;

  return language === "zh" ? zh[mode] : en[mode];
}

function requestTextForMode(userText: string, mode: ReadingMode, language: LanguageStyle) {
  const label = language === "zh" ? "用户问题" : "User question";
  return `${instructionForMode(mode, language)}\n\n${label}: ${userText}`;
}

const modeIconMap = {
  classic: PanelTop,
  "yes-no": BadgeQuestionMark,
  daily: CalendarDays,
  relationship: Heart,
  forecast: CalendarRange,
  learning: BookOpen,
  private: LockKeyhole,
  message: Moon,
  ai: Bot
} satisfies Record<ReadingMode, ModeIcon>;

function formatTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(iso));
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const tokenPattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;

  for (const match of text.matchAll(tokenPattern)) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${match.index}-${token}`;

    if (token.startsWith("**")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function MarkdownMessage({ content }: { content: string }) {
  const blocks = content.trim().split(/\n{2,}/);

  return (
    <div className="markdown-message">
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n").filter((line) => line.trim());
        const trimmedBlock = block.trim();

        if (/^---+$/.test(trimmedBlock)) {
          return <hr key={`block-${blockIndex}`} />;
        }

        const heading = trimmedBlock.match(/^(#{1,4})\s+(.+)$/);

        if (heading) {
          const level = heading[1].length;
          const HeadingTag = `h${Math.min(level + 2, 6)}` as "h3" | "h4" | "h5" | "h6";

          return <HeadingTag key={`block-${blockIndex}`}>{renderInlineMarkdown(heading[2])}</HeadingTag>;
        }

        if (lines.every((line) => line.trim().startsWith(">"))) {
          return (
            <blockquote key={`block-${blockIndex}`}>
              {lines.map((line) => line.replace(/^\s*>\s?/, "")).map((line, lineIndex) => (
                <p key={`quote-${blockIndex}-${lineIndex}`}>{renderInlineMarkdown(line)}</p>
              ))}
            </blockquote>
          );
        }

        const listItems = lines
          .map((line) => line.match(/^\s*(?:[-*]|\d+\.)\s+(.+)$/)?.[1])
          .filter((line): line is string => Boolean(line));

        if (listItems.length === lines.length && listItems.length > 0) {
          return (
            <ul key={`block-${blockIndex}`}>
              {listItems.map((item, itemIndex) => (
                <li key={`item-${blockIndex}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>
              ))}
            </ul>
          );
        }

        return <p key={`block-${blockIndex}`}>{renderInlineMarkdown(block)}</p>;
      })}
    </div>
  );
}

function hashText(text: string) {
  return text.split("").reduce((hash, char) => {
    return (hash * 31 + char.charCodeAt(0)) % 997;
  }, 17);
}

function cardPalette(card: DrawnCard) {
  if (card.arcana === "major") {
    return {
      glow: "#d8c06a",
      wash: "rgba(216, 192, 106, 0.18)",
      ink: "#f7e7a3"
    };
  }

  if (card.suit === "Cups") {
    return {
      glow: "#6ec7d8",
      wash: "rgba(110, 199, 216, 0.18)",
      ink: "#b7edf4"
    };
  }

  if (card.suit === "Swords") {
    return {
      glow: "#a8b2ff",
      wash: "rgba(168, 178, 255, 0.16)",
      ink: "#d9ddff"
    };
  }

  if (card.suit === "Pentacles") {
    return {
      glow: "#83d69b",
      wash: "rgba(131, 214, 155, 0.17)",
      ink: "#c7f0d1"
    };
  }

  return {
    glow: "#e78a64",
    wash: "rgba(231, 138, 100, 0.18)",
    ink: "#ffd0bd"
  };
}

function getSpreadLabel(spread: DrawnSpread | null, fallback: SpreadType, language: LanguageStyle) {
  const value = spread?.spreadType || fallback;
  return value === "three-card" ? uiText[language].threeCards : uiText[language].singleCard;
}

function displayPosition(position: string, language: LanguageStyle) {
  if (language === "en") {
    return position;
  }

  const positions: Record<string, string> = {
    Past: "过去",
    Present: "现在",
    "Near future": "近期走向",
    "Core message": "核心讯息"
  };

  return positions[position] || position;
}

function displayOrientation(orientation: DrawnCard["orientation"], language: LanguageStyle) {
  if (language === "en") {
    return orientation;
  }

  return orientation === "upright" ? "正位" : "逆位";
}

function displayArcana(card: DrawnCard, language: LanguageStyle) {
  if (language === "en") {
    return card.arcana === "major" ? "Major Arcana" : card.suit;
  }

  if (card.arcana === "major") {
    return "大阿卡那";
  }

  const suits: Record<string, string> = {
    Wands: "权杖",
    Cups: "圣杯",
    Swords: "宝剑",
    Pentacles: "星币"
  };

  return card.suit ? suits[card.suit] : "小阿卡那";
}

const tarotCardArtwork: Record<string, string> = {
  "major-fool": "/tarot-cards/major-fool.webp"
};

function getTarotCardArtwork(card: DrawnCard) {
  const baseId = card.id.replace(/-(upright|reversed)-.+$/, "");
  return `${tarotCardArtwork[baseId] || `/tarot-cards/${baseId}.webp`}?v=webp-deck-20260624`;
}

function TarotCardImage({ card, index, language }: { card: DrawnCard; index: number; language: LanguageStyle }) {
  const artwork = getTarotCardArtwork(card);
  const palette = cardPalette(card);
  const seed = hashText(card.id);
  const symbol = card.arcana === "major" ? "✦" : card.suit === "Cups" ? "☽" : card.suit === "Swords" ? "◇" : card.suit === "Pentacles" ? "◎" : "△";
  const cardStyle = {
    "--card-glow": palette.glow,
    "--card-wash": palette.wash,
    "--card-ink": palette.ink,
    "--card-tilt": `${(seed % 7) - 3}deg`,
    "--reveal-delay": `${index * 130}ms`
  } as CSSProperties;

  return (
    <article className={`tarot-card-image ${artwork ? "has-artwork" : ""} ${card.orientation === "reversed" ? "is-reversed" : ""}`} style={cardStyle}>
      <div className="tarot-card-frame">
        {artwork ? (
          <img
            alt={`${card.name} · ${displayOrientation(card.orientation, language)}`}
            className="tarot-card-artwork"
            src={artwork}
          />
        ) : (
          <>
            <div className="tarot-card-sky">
              <span className="tarot-orbit one" />
              <span className="tarot-orbit two" />
              <span className="tarot-star a" />
              <span className="tarot-star b" />
              <span className="tarot-star c" />
            </div>
            <div className="tarot-symbol" aria-hidden="true">
              {symbol}
            </div>
            <div className="tarot-card-title">
              <span>{displayPosition(card.position, language)}</span>
              <strong>{card.name}</strong>
            </div>
            <div className="tarot-card-footer">
              <span>{displayOrientation(card.orientation, language)}</span>
              <span>{displayArcana(card, language)}</span>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

function SpreadReveal({ spread, language, compact = false }: { spread: DrawnSpread; language: LanguageStyle; compact?: boolean }) {
  return (
    <div className={compact ? "spread-reveal compact" : "spread-reveal"}>
      {spread.cards.map((card, index) => (
        <div className="spread-card-wrap" key={`${card.id}-${card.position}`}>
          <TarotCardImage card={card} index={index} language={language} />
          <div className="spread-card-copy">
            <span>{displayPosition(card.position, language)}</span>
            <strong>{card.name}</strong>
            <p>{card.advice}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptySpread() {
  return (
    <div className="empty-spread" aria-hidden="true">
      {[0, 1, 2].map((item) => (
        <div className="empty-card-back" key={item}>
          <span />
        </div>
      ))}
    </div>
  );
}

export function TarotVoiceApp() {
  const [language, setLanguage] = useState<LanguageStyle>("zh");
  const initialSession = useMemo(() => createEmptySession("zh"), []);
  const [sessions, setSessions] = useState<TarotSession[]>([initialSession]);
  const [currentSessionId, setCurrentSessionId] = useState(initialSession.id);
  const [messages, setMessages] = useState<TarotChatMessage[]>(initialSession.messages);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [readingMode, setReadingMode] = useState<ReadingMode>("classic");
  const [spreadType, setSpreadType] = useState<SpreadType>("three-card");
  const [tone, setTone] = useState<ToneStyle>("soft");
  const [ttsMode, setTtsMode] = useState<"browser" | "openai">("browser");
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const messagesRef = useRef<TarotChatMessage[]>(messages);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const historyPointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const t = uiText[language];
  const quickPrompts = t.quickPrompts as string[];
  const visibleSessions = sessions.filter((session) => session.messages.some((message) => message.id !== "intro"));
  const readingModes = [
    { mode: "classic", label: t.classicMode, hint: t.classicHint },
    { mode: "yes-no", label: t.yesNoMode, hint: t.yesNoHint },
    { mode: "daily", label: t.dailyMode, hint: t.dailyButton },
    { mode: "relationship", label: t.relationshipMode, hint: t.relationshipHint },
    { mode: "forecast", label: t.forecastMode, hint: t.forecastButton },
    { mode: "learning", label: t.learningMode, hint: t.learningButton },
    { mode: "private", label: t.privateMode, hint: t.privateHint },
    { mode: "message", label: t.messageMode, hint: t.messageButton },
    { mode: "ai", label: t.aiMode, hint: t.aiButton }
  ] satisfies Array<{ mode: ReadingMode; label: string | string[]; hint: string | string[] }>;
  const selectedMode = readingModes.find((item) => item.mode === readingMode) || readingModes[0];
  const selectedModeHint = selectedMode.hint as string;
  const currentSessionHasConversation = messages.some((message) => message.id !== "intro");

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (storedLanguage === "en" || storedLanguage === "zh") {
      setLanguage(storedLanguage);
      setMessages((current) => (current.length === 1 && current[0].id === "intro" ? [createIntroMessage(storedLanguage)] : current));
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedSessions = window.localStorage.getItem(SESSIONS_STORAGE_KEY);

    if (storedSessions) {
      try {
        const parsed = JSON.parse(storedSessions) as TarotSession[];

        if (Array.isArray(parsed) && parsed.length > 0) {
          const nextSession = createEmptySession(language);
          setSessions(parsed);
          setCurrentSessionId(nextSession.id);
          setMessages(nextSession.messages);
          setSessionsLoaded(true);
          return;
        }
      } catch {
        window.localStorage.removeItem(SESSIONS_STORAGE_KEY);
      }
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as TarotChatMessage[];

        if (Array.isArray(parsed) && parsed.length > 0) {
          const nextSession = createEmptySession(language);
          const migratedSession = {
            id: createSessionId(),
            title: titleForMessages(parsed, uiText[language].newReading as string),
            messages: parsed,
            updatedAt: parsed.at(-1)?.createdAt || new Date().toISOString()
          };
          setSessions([migratedSession]);
          setCurrentSessionId(nextSession.id);
          setMessages(nextSession.messages);
          setSessionsLoaded(true);
          return;
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    setSessionsLoaded(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!sessionsLoaded) {
      return;
    }

    const hasConversation = messages.some((message) => message.id !== "intro");

    if (!hasConversation) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      setSessions((current) => current.filter((session) => session.id !== currentSessionId));
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    setSessions((current) => {
      const fallbackTitle = uiText[language].newReading as string;
      const updatedSession = {
        id: currentSessionId,
        title: titleForMessages(messages, fallbackTitle),
        messages,
        updatedAt: messages.at(-1)?.createdAt || new Date().toISOString()
      };
      const withoutCurrent = current.filter((session) => session.id !== currentSessionId);

      return [updatedSession, ...withoutCurrent];
    });
  }, [currentSessionId, language, messages, sessionsLoaded]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!sessionsLoaded) {
      return;
    }

    window.localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions, sessionsLoaded]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, isThinking]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setSpeechSupported(Boolean(navigator.mediaDevices && typeof window.MediaRecorder !== "undefined"));

    return () => {
      recorderRef.current?.stop();
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const latestSpread = useMemo(() => {
    return [...messages].reverse().find((message) => message.cards)?.cards || null;
  }, [messages]);

  async function speakText(text: string) {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    audioRef.current?.pause();

    if (ttsMode === "openai") {
      try {
        const response = await fetch("/api/tarot/speak", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text,
            language
          })
        });

        if (!response.ok) {
          throw new Error(t.ttsUnavailable as string);
        }

        const audioBlob = await response.blob();
        const url = URL.createObjectURL(audioBlob);
        const audio = new Audio(url);

        audioRef.current = audio;
        audio.onended = () => URL.revokeObjectURL(url);
        await audio.play();
        return;
      } catch {
        setError(t.ttsFallback as string);
      }
    }

    if (!("speechSynthesis" in window)) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === "zh" ? "zh-CN" : "en-US";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  async function submitTurn(rawText: string, source: MessageSource, requestedMode: ReadingMode = readingMode) {
    const text = rawText.trim();

    if (!text || isThinking) {
      return;
    }

    setError(null);
    setIsThinking(true);
    setChatOpen(true);

    const userMessage = createMessage("user", text, source, null);
    const historyForRequest = [...messagesRef.current, userMessage].slice(-MAX_HISTORY);

    startTransition(() => {
      setMessages(historyForRequest);
    });

    try {
      const response = await fetch("/api/tarot/turn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          history: messagesRef.current,
          userMessage: requestTextForMode(text, requestedMode, language),
          spreadType: spreadForMode(requestedMode, spreadType),
          tone,
          language,
          channel: source === "voice" ? "web-voice" : "web-text"
        })
      });

      if (!response.ok) {
        const failure = (await response.json().catch(() => null)) as { detail?: string; error?: string } | null;
        throw new Error(failure?.detail || failure?.error || (t.turnFailed as string));
      }

      const result = (await response.json()) as TarotTurnResponse;
      const assistantMessage = createMessage("assistant", result.reply, undefined, result.cards);

      startTransition(() => {
        setMessages((current) => [...current, assistantMessage].slice(-MAX_HISTORY));
      });

      if (autoSpeak) {
        await speakText(result.reply);
      }
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unknown error.");
    } finally {
      setIsThinking(false);
    }
  }

  function handleReset() {
    recorderRef.current?.stop();
    recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioRef.current?.pause();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    const nextSession = createEmptySession(language);
    setDraft("");
    setError(null);
    setChatOpen(false);
    setHistoryOpen(false);
    setCurrentSessionId(nextSession.id);
    setMessages(nextSession.messages);
  }

  function openSession(session: TarotSession) {
    recorderRef.current?.stop();
    audioRef.current?.pause();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setError(null);
    setDraft("");
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setChatOpen(true);
    setHistoryOpen(false);
  }

  function handleHistoryPointerDown(clientX: number, clientY: number) {
    historyPointerStartRef.current = { x: clientX, y: clientY };
  }

  function handleHistoryPointerUp(clientX: number, clientY: number) {
    const start = historyPointerStartRef.current;
    historyPointerStartRef.current = null;

    if (!start) {
      return;
    }

    const deltaX = clientX - start.x;
    const deltaY = clientY - start.y;

    if (deltaX < -48 && Math.abs(deltaY) < 42) {
      setHistoryOpen(false);
    }
  }

  async function startListening() {
    if (isListening) {
      recorderRef.current?.stop();
      return;
    }

    if (!speechSupported) {
      setError(t.voiceUnavailable as string);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordingStreamRef.current = stream;
      recorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        setIsListening(false);
        stream.getTracks().forEach((track) => track.stop());
        setIsTranscribing(true);

        try {
          const audio = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
          const formData = new FormData();
          formData.append("audio", audio, "recording.webm");
          formData.append("language", language);
          const response = await fetch("/api/tarot/transcribe", { method: "POST", body: formData });
          const result = (await response.json()) as { text?: string; error?: string; detail?: string };

          if (!response.ok || !result.text) throw new Error(result.error || result.detail || (t.voiceNetworkError as string));
          setDraft(result.text);
          await submitTurn(result.text, "voice");
          setDraft("");
        } catch (transcriptionError) {
          setError(transcriptionError instanceof Error ? transcriptionError.message : (t.voiceNetworkError as string));
        } finally {
          setIsTranscribing(false);
        }
      };
      recorder.start();
      setError(null);
      setIsListening(true);
    } catch (captureError) {
      const permissionDenied = captureError instanceof DOMException && captureError.name === "NotAllowedError";
      setError(permissionDenied ? (t.voicePermissionError as string) : (t.voiceStartFailed as string));
    }
  }

  function changeLanguage(nextLanguage: LanguageStyle) {
    setLanguage(nextLanguage);
    setMessages((current) => (current.length === 1 && current[0].id === "intro" ? [createIntroMessage(nextLanguage)] : current));
  }

  function changeReadingMode(nextMode: ReadingMode) {
    setReadingMode(nextMode);
    setSpreadType(spreadForMode(nextMode, "three-card"));
  }

  return (
    <main className={chatOpen ? "chat-page is-chat" : "chat-page is-home"}>
      <header className="chat-header">
        <div className="chat-brand">
          <div className="brand-lockup">
            <img className="brand-art" src="/brand/tarot-icon.webp" alt="" aria-hidden="true" />
            <div>
              <h1>{t.title}</h1>
            </div>
          </div>
          <button
            aria-label={historyOpen ? "关闭历史占卜" : "打开历史占卜"}
            className={historyOpen ? "history-toggle" : "history-toggle is-collapsed"}
            onClick={() => {
              setHistoryOpen((current) => !current);
              setSettingsOpen(false);
            }}
            title={historyOpen ? "关闭历史占卜" : "打开历史占卜"}
            type="button"
          >
            <span className="history-toggle-icon" aria-hidden="true">
              <span />
              <span />
            </span>
          </button>
        </div>
      </header>

      <div className={historyOpen ? "app-workspace" : "app-workspace history-collapsed"}>
      {historyOpen ? (
        <div
          aria-hidden="true"
          className="history-scrim"
          onClick={() => setHistoryOpen(false)}
          onPointerDown={(event) => handleHistoryPointerDown(event.clientX, event.clientY)}
          onPointerUp={(event) => handleHistoryPointerUp(event.clientX, event.clientY)}
        />
      ) : null}
      {historyOpen ? <aside
        className="history-sidebar"
        aria-label={t.historyTitle as string}
        onPointerDown={(event) => handleHistoryPointerDown(event.clientX, event.clientY)}
        onPointerUp={(event) => handleHistoryPointerUp(event.clientX, event.clientY)}
      >
        <div className="history-header">
          <button className="history-new" onClick={handleReset} type="button">
            <span aria-hidden="true">+</span>
            <strong>{t.newReading}</strong>
          </button>
        </div>
        <div className="history-list">
          {visibleSessions.length ? (
            visibleSessions.map((session) => (
              <button
                className={session.id === currentSessionId ? "history-item active" : "history-item"}
                key={session.id}
                onClick={() => openSession(session)}
                type="button"
              >
                <strong>{session.title}</strong>
                <span>{hydrated ? formatTime(session.updatedAt) : "--:--"}</span>
              </button>
            ))
          ) : (
            <p>{t.emptyHistory}</p>
          )}
        </div>
        <button
          aria-label={t.callSetup as string}
          className={settingsOpen ? "history-settings active" : "history-settings"}
          onClick={() => setSettingsOpen((current) => !current)}
          title={t.callSetup as string}
          type="button"
        >
          <Settings aria-hidden="true" size={18} />
          <span>{t.callSetup}</span>
        </button>
      </aside> : null}

      <section className="chat-shell">
        {!chatOpen ? (
        <div className="home-hero">
          <h2>{t.homeGreeting}</h2>
        </div>
        ) : null}

        {chatOpen ? (
          <div className="chat-agent-hero">
            <div className="agent-title-row">
              <h2>{selectedMode.label}</h2>
            </div>
          </div>
        ) : null}

        {error ? <div className="error-banner">{error}</div> : null}

        <div className="chat-composer">
          <textarea
            aria-label={t.questionLabel as string}
            id="question"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (draft.trim() && !isThinking) {
                  void submitTurn(draft, "text");
                  setDraft("");
                }
              }
            }}
            placeholder={defaultPromptForMode(readingMode, t) || (t.questionPlaceholder as string)}
            rows={2}
            value={draft}
          />
          {!chatOpen ? <p className="composer-hint">{selectedModeHint}</p> : null}
          <div className="composer-toolbar">
            {!chatOpen ? (
              <button
                aria-label={t.speak as string}
                className={isListening ? "composer-icon pulse" : "composer-icon"}
                disabled={!speechSupported || isTranscribing}
                onClick={() => void startListening()}
                title={isTranscribing ? t.transcribing as string : t.speak as string}
                type="button"
              >
                <Mic aria-hidden="true" size={19} />
              </button>
            ) : <span />}
            <button
              aria-label={t.send as string}
              className="send-button"
              disabled={(!draft.trim() && !defaultPromptForMode(readingMode, t)) || isThinking}
              onClick={() => {
                const text = !draft.trim() ? defaultPromptForMode(readingMode, t) : draft;
                void submitTurn(text, "text", readingMode);
                setDraft("");
              }}
              title={t.send as string}
              type="button"
            >
              {isThinking ? <Volume2 aria-hidden="true" size={19} /> : <Send aria-hidden="true" size={19} />}
            </button>
          </div>
        </div>

        {chatOpen && messages.length <= 1 && !defaultPromptForMode(readingMode, t) ? (
          <div className="starter-prompts" aria-label={t.quickPromptsLabel as string}>
            {quickPrompts.slice(0, 3).map((prompt) => (
              <button key={prompt} onClick={() => setDraft(prompt)} type="button">{prompt}</button>
            ))}
          </div>
        ) : null}

        {chatOpen ? (
          <div className="conversation-list" ref={listRef}>
            {currentSessionHasConversation ? messages.map((message) => (
              <article className={message.role === "assistant" ? "message assistant" : "message user"} key={message.id}>
                <div className="message-meta">
                  <span>{message.role === "assistant" ? t.assistantName : t.userName}</span>
                  <span>{hydrated ? formatTime(message.createdAt) : "--:--"}</span>
                </div>
                {message.cards ? <SpreadReveal language={language} spread={message.cards} /> : null}
                <MarkdownMessage content={message.content} />
                {message.source ? <span className="message-source">{message.source === "voice" ? t.sourceVoice : t.sourceText}</span> : null}
              </article>
            )) : null}

            {isThinking ? (
              <article className="message assistant loading">
                <div className="message-meta">
                  <span>{t.assistantName}</span>
                  <span>{t.now}</span>
                </div>
                <p>{t.loading}</p>
              </article>
            ) : null}
          </div>
        ) : null}

        {!chatOpen ? (
        <div className="mode-catalog">
          <p>{t.modeCatalogTitle}</p>
          <div className="reading-modes" aria-label={t.readingModesLabel as string}>
            {readingModes.map((item) => {
              const defaultPrompt = defaultPromptForMode(item.mode, t);
              const canAutoSubmit = Boolean(defaultPrompt);
              const ModeIcon = modeIconMap[item.mode];

              return (
                <button
                  className={["reading-mode", `mode-${item.mode}`, readingMode === item.mode ? "active" : ""].filter(Boolean).join(" ")}
                  disabled={isThinking}
                  key={item.mode}
                  onClick={() => {
                    changeReadingMode(item.mode);
                    if (canAutoSubmit) {
                      void submitTurn(defaultPrompt, "text", item.mode);
                    }
                  }}
                  type="button"
                >
                  <span className="reading-mode-avatar" aria-hidden="true">
                    <ModeIcon size={21} strokeWidth={1.7} />
                  </span>
                  <span>
                    <strong>{item.label}</strong>
                    <span>{item.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        ) : null}
      </section>
      </div>

      {settingsOpen ? (
        <div className="settings-layer" role="presentation" onMouseDown={() => setSettingsOpen(false)}>
          <aside aria-label={t.callSetup as string} className="settings-drawer" onMouseDown={(event) => event.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <span>{t.eyebrow}</span>
                <h2>{t.callSetup}</h2>
              </div>
              <button aria-label="Close" className="icon-button" onClick={() => setSettingsOpen(false)} type="button">
                <X aria-hidden="true" size={20} />
              </button>
            </div>

          <div className="control-group">
            <label>{t.readerTone}</label>
            <div className="toggle-row">
              <button
                className={tone === "soft" ? "toggle-button active" : "toggle-button"}
                onClick={() => setTone("soft")}
                type="button"
              >
                {t.warm}
              </button>
              <button
                className={tone === "direct" ? "toggle-button active" : "toggle-button"}
                onClick={() => setTone("direct")}
                type="button"
              >
                {t.direct}
              </button>
            </div>
          </div>

          <div className="control-group">
            <label>{t.language}</label>
            <div className="toggle-row">
              <button
                className={language === "zh" ? "toggle-button active" : "toggle-button"}
                onClick={() => changeLanguage("zh")}
                type="button"
              >
                {t.chinese}
              </button>
              <button
                className={language === "en" ? "toggle-button active" : "toggle-button"}
                onClick={() => changeLanguage("en")}
                type="button"
              >
                {t.english}
              </button>
            </div>
          </div>

          <div className="control-group">
            <label>{t.speechOutput}</label>
            <div className="toggle-row">
              <button
                className={ttsMode === "browser" ? "toggle-button active" : "toggle-button"}
                onClick={() => setTtsMode("browser")}
                type="button"
              >
                {t.browser}
              </button>
              <button
                className={ttsMode === "openai" ? "toggle-button active" : "toggle-button"}
                onClick={() => setTtsMode("openai")}
                type="button"
              >
                {t.openaiTts}
              </button>
            </div>
          </div>

          <label className="switch-row">
            <input checked={autoSpeak} onChange={() => setAutoSpeak((current) => !current)} type="checkbox" />
            <span>{t.autoSpeak}</span>
          </label>
          <button className="drawer-reset" onClick={handleReset} type="button">
            <RotateCcw aria-hidden="true" size={16} />
            <span>{t.reset}</span>
          </button>
          </aside>
        </div>
      ) : null}
    </main>
  );
}
