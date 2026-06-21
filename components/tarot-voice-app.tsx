"use client";

import { Mic, RotateCcw, Send, Volume2 } from "lucide-react";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import type {
  DrawnSpread,
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
const MAX_HISTORY = 18;

const introMessage: TarotChatMessage = {
  id: "intro",
  role: "assistant",
  content:
    "I am Luna. Ask me about a relationship, career move, money decision, or emotional knot. If your question is clear enough, I will draw the cards. If not, I will ask one short clarifier first.",
  createdAt: new Date().toISOString(),
  cards: null
};

const quickPrompts = [
  "Should I leave my current job this summer?",
  "What is really happening in this situationship?",
  "What am I not seeing about my money stress?",
  "What is the next clean step for my side project?"
];

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

export function TarotVoiceApp() {
  const [messages, setMessages] = useState<TarotChatMessage[]>([introMessage]);
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
    recognition.lang = "zh-CN";
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
      setError(`Voice capture stopped: ${event.error}`);
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
            text
          })
        });

        if (!response.ok) {
          throw new Error("OpenAI TTS unavailable.");
        }

        const audioBlob = await response.blob();
        const url = URL.createObjectURL(audioBlob);
        const audio = new Audio(url);

        audioRef.current = audio;
        audio.onended = () => URL.revokeObjectURL(url);
        await audio.play();
        return;
      } catch {
        setError("OpenAI TTS was unavailable, so the browser voice will take over.");
      }
    }

    if (!("speechSynthesis" in window)) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
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
          channel: source === "voice" ? "web-voice" : "web-text"
        })
      });

      if (!response.ok) {
        const failure = (await response.json().catch(() => null)) as { detail?: string; error?: string } | null;
        throw new Error(failure?.detail || failure?.error || "Tarot turn failed.");
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
    setMessages([introMessage]);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  function startListening() {
    if (!recognitionRef.current) {
      setError("Speech recognition is not available in this browser. You can still type.");
      return;
    }

    try {
      recognitionRef.current.start();
    } catch {
      setError("Voice capture could not start. If your browser already has the mic open, stop it and try again.");
    }
  }

  return (
    <main className="page-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Tarot Voice MVP</p>
          <h1>Luna Voice Tarot</h1>
        </div>

        <div className="status-strip">
          <span className={`pill ${mode === "live" ? "pill-live" : "pill-mock"}`}>{mode === "live" ? "Live" : "Mock"}</span>
          <div>
            <span>Spread</span>
            <strong>{spreadType === "three-card" ? "Three-card" : "Single-card"}</strong>
          </div>
          <div>
            <span>Tone</span>
            <strong>{tone === "soft" ? "Warm" : "Direct"}</strong>
          </div>
          <div>
            <span>Voice in</span>
            <strong>{speechSupported ? "SpeechRecognition" : "Text only"}</strong>
          </div>
          <div>
            <span>Voice out</span>
            <strong>{ttsMode === "openai" ? "OpenAI TTS" : "Browser"}</strong>
          </div>
        </div>
      </header>

      <section className="workspace-grid">
        <div className="control-panel">
          <div className="panel-header">
            <h2>Call setup</h2>
            <button className="ghost-button" onClick={handleReset} type="button">
              <RotateCcw aria-hidden="true" size={16} />
              <span>Reset</span>
            </button>
          </div>

          <div className="control-group">
            <label>Spread</label>
            <div className="toggle-row">
              <button
                className={spreadType === "three-card" ? "toggle-button active" : "toggle-button"}
                onClick={() => setSpreadType("three-card")}
                type="button"
              >
                Three-card
              </button>
              <button
                className={spreadType === "single-card" ? "toggle-button active" : "toggle-button"}
                onClick={() => setSpreadType("single-card")}
                type="button"
              >
                Single-card
              </button>
            </div>
          </div>

          <div className="control-group">
            <label>Reader tone</label>
            <div className="toggle-row">
              <button
                className={tone === "soft" ? "toggle-button active" : "toggle-button"}
                onClick={() => setTone("soft")}
                type="button"
              >
                Warm
              </button>
              <button
                className={tone === "direct" ? "toggle-button active" : "toggle-button"}
                onClick={() => setTone("direct")}
                type="button"
              >
                Direct
              </button>
            </div>
          </div>

          <div className="control-group">
            <label>Speech output</label>
            <div className="toggle-row">
              <button
                className={ttsMode === "browser" ? "toggle-button active" : "toggle-button"}
                onClick={() => setTtsMode("browser")}
                type="button"
              >
                Browser
              </button>
              <button
                className={ttsMode === "openai" ? "toggle-button active" : "toggle-button"}
                onClick={() => setTtsMode("openai")}
                type="button"
              >
                OpenAI TTS
              </button>
            </div>
          </div>

          <label className="switch-row">
            <input checked={autoSpeak} onChange={() => setAutoSpeak((current) => !current)} type="checkbox" />
            <span>Auto-play the reading out loud</span>
          </label>

          <div className="composer-card">
            <label htmlFor="question">Your question</label>
            <textarea
              id="question"
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about love, work, money, or a decision."
              rows={6}
              value={draft}
            />

            <div className="composer-actions">
              <button
                className={isListening ? "primary-button pulse" : "primary-button"}
                disabled={!speechSupported}
                onClick={startListening}
                type="button"
                title="Start voice input"
              >
                <Mic aria-hidden="true" size={18} />
                <span>{isListening ? "Listening" : "Speak"}</span>
              </button>
              <button
                className="secondary-button"
                disabled={!draft.trim() || isThinking}
                onClick={() => {
                  void submitTurn(draft, "text");
                  setDraft("");
                }}
                type="button"
                title="Send text"
              >
                {isThinking ? <Volume2 aria-hidden="true" size={18} /> : <Send aria-hidden="true" size={18} />}
                <span>{isThinking ? "Reading" : "Send"}</span>
              </button>
            </div>

            {!speechSupported ? (
              <p className="support-note">This browser does not support voice input yet. Text chat is still fully available.</p>
            ) : null}
          </div>

          <div className="quick-prompt-group">
            <label>Quick prompts</label>
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
                <h2>Latest spread</h2>
                <span>{latestSpread.spreadType === "three-card" ? "Past, present, near future" : "Single core card"}</span>
              </div>

              <div className="spread-stack">
                {latestSpread.cards.map((card) => (
                  <article className="card-tile" key={card.id}>
                    <span className="card-position">{card.position}</span>
                    <h3>{card.name}</h3>
                    <p className="card-meta">
                      {card.orientation} / {card.arcana}
                    </p>
                    <p>{card.meaning}</p>
                    <p className="card-advice">{card.advice}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="conversation-panel">
          <div className="panel-header">
            <h2>Conversation</h2>
            <span className="panel-subtitle">{isThinking ? "Luna is drawing the pattern..." : "Ready for the next turn"}</span>
          </div>

          <div className="conversation-list" ref={listRef}>
            {messages.map((message) => (
              <article className={message.role === "assistant" ? "message assistant" : "message user"} key={message.id}>
                <div className="message-meta">
                  <span>{message.role === "assistant" ? "Luna" : "You"}</span>
                  <span>{hydrated ? formatTime(message.createdAt) : "--:--"}</span>
                </div>
                <p>{message.content}</p>
                {message.source ? <span className="message-source">{message.source}</span> : null}
              </article>
            ))}

            {isThinking ? (
              <article className="message assistant loading">
                <div className="message-meta">
                  <span>Luna</span>
                  <span>now</span>
                </div>
                <p>Reading the thread and deciding whether to clarify or draw...</p>
              </article>
            ) : null}
          </div>

          {error ? <div className="error-banner">{error}</div> : null}

        </div>
      </section>
    </main>
  );
}
