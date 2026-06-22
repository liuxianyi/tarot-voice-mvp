"use client";

import { Mic, RotateCcw, Send, Volume2 } from "lucide-react";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type {
  DrawnCard,
  DrawnSpread,
  LanguageStyle,
  MessageSource,
  SpreadType,
  TarotChatMessage,
  TarotTurnResponse,
  ToneStyle
} from "@/lib/types";

type BrowserSpeechRecognitionResult = {
  isFinal: boolean;
  0: {
    transcript: string;
  };
  length: number;
};

type BrowserSpeechRecognitionEvent = Event & {
  results: ArrayLike<BrowserSpeechRecognitionResult>;
};

type BrowserSpeechRecognitionErrorEvent = Event & {
  error: string;
};

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  }
}

const STORAGE_KEY = "tarot-voice-mvp-history";
const LANGUAGE_STORAGE_KEY = "tarot-voice-mvp-language";
const MAX_HISTORY = 18;

const uiText = {
  zh: {
    intro:
      "我是 Luna。你可以告诉我一段关系、一次职业选择、金钱压力，或任何正在消化的心结。如果问题已经足够清楚，我会先抽牌，再解读；如果还太模糊，我只会先问一个简短的澄清问题。",
    quickPrompts: ["我刚失恋，想看看这段关系给我的提醒。", "我最近在考虑离职，想知道自己没看见什么。", "我和对方的关系很暧昧，我该继续吗？", "我对钱和未来很焦虑，下一步该怎么走？"],
    eyebrow: "Luna 会先抽牌，再解读",
    title: "Luna 语音塔罗",
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
    eyebrow: "Luna reads after the cards are drawn",
    title: "Luna Voice Tarot",
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
    voiceStartFailed: "Voice capture could not start. If your browser already has the mic open, stop it and try again.",
    ttsFallback: "OpenAI TTS was unavailable, so the browser voice will take over.",
    ttsUnavailable: "OpenAI TTS unavailable.",
    turnFailed: "Tarot turn failed."
  }
} satisfies Record<LanguageStyle, Record<string, string | string[]>>;

function createIntroMessage(language: LanguageStyle): TarotChatMessage {
  return {
    id: "intro",
    role: "assistant",
    content: uiText[language].intro as string,
    createdAt: new Date().toISOString(),
    cards: null
  };
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

function TarotCardImage({ card, index, language }: { card: DrawnCard; index: number; language: LanguageStyle }) {
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
    <article className={`tarot-card-image ${card.orientation === "reversed" ? "is-reversed" : ""}`} style={cardStyle}>
      <div className="tarot-card-frame">
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
  const [messages, setMessages] = useState<TarotChatMessage[]>([createIntroMessage("zh")]);
  const [draft, setDraft] = useState("");
  const [spreadType, setSpreadType] = useState<SpreadType>("three-card");
  const [tone, setTone] = useState<ToneStyle>("soft");
  const [ttsMode, setTtsMode] = useState<"browser" | "openai">("browser");
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [mode, setMode] = useState<"live" | "mock">("mock");
  const [error, setError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const messagesRef = useRef<TarotChatMessage[]>(messages);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptRef = useRef("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const t = uiText[language];
  const quickPrompts = t.quickPrompts as string[];

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

    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as TarotChatMessage[];

      if (Array.isArray(parsed) && parsed.length > 0) {
        setMessages(parsed);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

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

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    setSpeechSupported(true);

    const recognition = new SpeechRecognition();
    recognition.lang = language === "zh" ? "zh-CN" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      transcriptRef.current = "";
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setError(`${t.voiceStopped}: ${event.error}`);
    };

    recognition.onresult = async (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || "")
        .join("")
        .trim();

      transcriptRef.current = transcript;
      setDraft(transcript);

      const lastResult = event.results[event.results.length - 1];

      if (lastResult?.isFinal && transcript) {
        await submitTurn(transcript, "voice");
        setDraft("");
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [language, t.voiceStopped]);

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

  async function submitTurn(rawText: string, source: MessageSource) {
    const text = rawText.trim();

    if (!text || isThinking) {
      return;
    }

    setError(null);
    setIsThinking(true);

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
          userMessage: text,
          spreadType,
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

      setMode(result.mode);
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
    recognitionRef.current?.stop();
    audioRef.current?.pause();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setDraft("");
    setError(null);
    setMessages([createIntroMessage(language)]);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  function startListening() {
    if (!recognitionRef.current) {
      setError(t.voiceUnavailable as string);
      return;
    }

    try {
      recognitionRef.current.start();
    } catch {
      setError(t.voiceStartFailed as string);
    }
  }

  function changeLanguage(nextLanguage: LanguageStyle) {
    setLanguage(nextLanguage);
    setMessages((current) => (current.length === 1 && current[0].id === "intro" ? [createIntroMessage(nextLanguage)] : current));
  }

  return (
    <main className="page-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
        </div>

        <div className="status-strip">
          <span className={`pill ${mode === "live" ? "pill-live" : "pill-mock"}`}>{mode === "live" ? t.live : t.mock}</span>
          <div>
            <span>{t.spread}</span>
            <strong>{getSpreadLabel(latestSpread, spreadType, language)}</strong>
          </div>
          <div>
            <span>{t.tone}</span>
            <strong>{tone === "soft" ? t.warm : t.direct}</strong>
          </div>
          <div>
            <span>{t.voiceIn}</span>
            <strong>{speechSupported ? "SpeechRecognition" : t.textOnly}</strong>
          </div>
          <div>
            <span>{t.voiceOut}</span>
            <strong>{ttsMode === "openai" ? t.openaiTts : t.browser}</strong>
          </div>
        </div>
      </header>

      <section className="workspace-grid">
        <div className="control-panel">
          <div className="panel-header">
            <h2>{t.callSetup}</h2>
            <button className="ghost-button" onClick={handleReset} type="button">
              <RotateCcw aria-hidden="true" size={16} />
              <span>{t.reset}</span>
            </button>
          </div>

          <div className="control-group">
            <label>{t.spread}</label>
            <div className="toggle-row">
              <button
                className={spreadType === "three-card" ? "toggle-button active" : "toggle-button"}
                onClick={() => setSpreadType("three-card")}
                type="button"
              >
                {t.threeCards}
              </button>
              <button
                className={spreadType === "single-card" ? "toggle-button active" : "toggle-button"}
                onClick={() => setSpreadType("single-card")}
                type="button"
              >
                {t.singleCard}
              </button>
            </div>
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

          <div className="composer-card">
            <label htmlFor="question">{t.questionLabel}</label>
            <textarea
              id="question"
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t.questionPlaceholder as string}
              rows={6}
              value={draft}
            />

            <div className="composer-actions">
              <button
                className={isListening ? "primary-button pulse" : "primary-button"}
                disabled={!speechSupported}
                onClick={startListening}
                type="button"
                title={t.speak as string}
              >
                <Mic aria-hidden="true" size={18} />
                <span>{isListening ? t.listening : t.speak}</span>
              </button>
              <button
                className="secondary-button"
                disabled={!draft.trim() || isThinking}
                onClick={() => {
                  void submitTurn(draft, "text");
                  setDraft("");
                }}
                type="button"
                title={t.send as string}
              >
                {isThinking ? <Volume2 aria-hidden="true" size={18} /> : <Send aria-hidden="true" size={18} />}
                <span>{isThinking ? t.reading : t.send}</span>
              </button>
            </div>

            {!speechSupported ? (
              <p className="support-note">{t.supportNote}</p>
            ) : null}
          </div>

          <div className="quick-prompt-group">
            <label>{t.quickPromptsLabel}</label>
            <div className="chip-stack">
              {quickPrompts.map((prompt) => (
                <button
                  className="prompt-chip"
                  key={prompt}
                  onClick={() => {
                    setDraft(prompt);
                  }}
                  type="button"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {latestSpread ? (
            <div className="spread-panel">
              <div className="panel-header compact">
                <h2>{t.latestSpread}</h2>
                <span>{latestSpread.spreadType === "three-card" ? t.threeSpreadHint : t.singleSpreadHint}</span>
              </div>

              <SpreadReveal compact language={language} spread={latestSpread} />
            </div>
          ) : null}
        </div>

        <div className="conversation-panel">
          <div className="reading-stage">
            <div>
              <span className="stage-kicker">{isThinking ? t.drawing : latestSpread ? t.currentSpread : t.waiting}</span>
              <h2>{latestSpread ? latestSpread.focusQuestion : t.stageEmptyTitle}</h2>
            </div>
            <p>
              {isThinking
                ? t.stageDrawing
                : latestSpread
                  ? t.stageHasSpread
                  : t.stageEmpty}
            </p>
          </div>

          {latestSpread ? <SpreadReveal language={language} spread={latestSpread} /> : <EmptySpread />}

          <div className="conversation-list" ref={listRef}>
            {messages.map((message) => (
              <article className={message.role === "assistant" ? "message assistant" : "message user"} key={message.id}>
                <div className="message-meta">
                  <span>{message.role === "assistant" ? t.assistantName : t.userName}</span>
                  <span>{hydrated ? formatTime(message.createdAt) : "--:--"}</span>
                </div>
                {message.cards ? <SpreadReveal language={language} spread={message.cards} /> : null}
                <MarkdownMessage content={message.content} />
                {message.source ? <span className="message-source">{message.source === "voice" ? t.sourceVoice : t.sourceText}</span> : null}
              </article>
            ))}

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

          {error ? <div className="error-banner">{error}</div> : null}

        </div>
      </section>
    </main>
  );
}
