export type SpreadType = "single-card" | "three-card";
export type ToneStyle = "soft" | "direct";
export type MessageSource = "text" | "voice";
export type ModeKind = "live" | "mock";
export type LanguageStyle = "zh" | "en";
export type ReadingMode = "classic" | "yes-no" | "daily";

export interface DrawnCard {
  id: string;
  name: string;
  arcana: "major" | "minor";
  suit?: "Wands" | "Cups" | "Swords" | "Pentacles";
  rank?: string;
  orientation: "upright" | "reversed";
  position: string;
  keywords: string[];
  meaning: string;
  advice: string;
}

export interface DrawnSpread {
  spreadType: SpreadType;
  focusQuestion: string;
  focusArea: string;
  cards: DrawnCard[];
}

export interface TarotChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  source?: MessageSource;
  cards?: DrawnSpread | null;
  createdAt: string;
}

export interface TarotTurnRequest {
  history: TarotChatMessage[];
  userMessage: string;
  spreadType: SpreadType;
  tone: ToneStyle;
  language?: LanguageStyle;
  channel?: "web-text" | "web-voice" | "phone";
}

export interface TarotTurnResponse {
  reply: string;
  cards: DrawnSpread | null;
  mode: ModeKind;
}
