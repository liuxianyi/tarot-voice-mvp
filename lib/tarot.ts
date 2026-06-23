import type { DrawnCard, DrawnSpread, LanguageStyle, SpreadType, ToneStyle } from "@/lib/types";

type CardTemplate = {
  id: string;
  name: string;
  arcana: "major" | "minor";
  suit?: "Wands" | "Cups" | "Swords" | "Pentacles";
  rank?: string;
  uprightKeywords: string[];
  reversedKeywords: string[];
  uprightMeaning: string;
  reversedMeaning: string;
  uprightAdvice: string;
  reversedAdvice: string;
};

const majorArcana: CardTemplate[] = [
  {
    id: "major-fool",
    name: "The Fool",
    arcana: "major",
    uprightKeywords: ["new start", "trust", "fresh energy"],
    reversedKeywords: ["impulse", "drift", "naivete"],
    uprightMeaning: "A new chapter is available if you move with curiosity rather than fear.",
    reversedMeaning: "The desire to escape may be louder than the plan itself.",
    uprightAdvice: "Take one brave step, but define your safety net first.",
    reversedAdvice: "Slow down before you confuse movement with direction."
  },
  {
    id: "major-magician",
    name: "The Magician",
    arcana: "major",
    uprightKeywords: ["agency", "skill", "manifestation"],
    reversedKeywords: ["scattered power", "doubt", "mixed signals"],
    uprightMeaning: "You already have enough tools to influence the outcome.",
    reversedMeaning: "Your energy is leaking across too many priorities or promises.",
    uprightAdvice: "Choose one lever you can control and work it deliberately.",
    reversedAdvice: "Reduce the noise before you ask life for a clearer answer."
  },
  {
    id: "major-high-priestess",
    name: "The High Priestess",
    arcana: "major",
    uprightKeywords: ["intuition", "silence", "inner knowing"],
    reversedKeywords: ["avoidance", "mixed intuition", "held-back truth"],
    uprightMeaning: "Part of the answer is already inside you and needs quiet to surface.",
    reversedMeaning: "You may be calling it intuition when it is actually fear or confusion.",
    uprightAdvice: "Make space for stillness before making a loud external move.",
    reversedAdvice: "Name the truth you keep editing before you ask for another sign."
  },
  {
    id: "major-empress",
    name: "The Empress",
    arcana: "major",
    uprightKeywords: ["nurture", "abundance", "care"],
    reversedKeywords: ["overgiving", "depletion", "neglect"],
    uprightMeaning: "Growth comes through steadiness, care, and receiving support.",
    reversedMeaning: "You may be carrying others so much that your own needs are fading.",
    uprightAdvice: "Let comfort and consistency be part of your strategy.",
    reversedAdvice: "Refill your own reserves before taking on more emotional labor."
  },
  {
    id: "major-emperor",
    name: "The Emperor",
    arcana: "major",
    uprightKeywords: ["structure", "boundaries", "leadership"],
    reversedKeywords: ["rigidity", "control", "pressure"],
    uprightMeaning: "Clarity will come from structure, not from waiting for perfect certainty.",
    reversedMeaning: "A need for control may be squeezing the life out of the decision.",
    uprightAdvice: "Set rules, timelines, and non-negotiables for the next move.",
    reversedAdvice: "Keep the backbone, but loosen the grip."
  },
  {
    id: "major-hierophant",
    name: "The Hierophant",
    arcana: "major",
    uprightKeywords: ["tradition", "guidance", "shared values"],
    reversedKeywords: ["questioning rules", "inner teacher", "misfit path"],
    uprightMeaning: "Support may come through trusted wisdom, shared values, or a structure that has lasted.",
    reversedMeaning: "The old rulebook may not fit the truth of your situation anymore.",
    uprightAdvice: "Seek grounded guidance, but keep your own conscience in the room.",
    reversedAdvice: "Question inherited rules without rejecting wisdom just to feel free."
  },
  {
    id: "major-lovers",
    name: "The Lovers",
    arcana: "major",
    uprightKeywords: ["alignment", "choice", "heart truth"],
    reversedKeywords: ["misalignment", "avoidance", "split desire"],
    uprightMeaning: "This choice is less about chemistry and more about alignment with your values.",
    reversedMeaning: "Part of you wants peace while another part wants approval.",
    uprightAdvice: "Choose what you can respect tomorrow, not just what relieves you tonight.",
    reversedAdvice: "Stop negotiating against your own core needs."
  },
  {
    id: "major-chariot",
    name: "The Chariot",
    arcana: "major",
    uprightKeywords: ["drive", "direction", "discipline"],
    reversedKeywords: ["push-pull", "friction", "loss of grip"],
    uprightMeaning: "Momentum is possible if you commit to one direction.",
    reversedMeaning: "Competing motives are dragging the situation off course.",
    uprightAdvice: "Pick the lane before you press harder on the gas.",
    reversedAdvice: "Resolve the internal conflict before forcing an external result."
  },
  {
    id: "major-strength",
    name: "Strength",
    arcana: "major",
    uprightKeywords: ["courage", "grace", "self-command"],
    reversedKeywords: ["burnout", "self-doubt", "thin patience"],
    uprightMeaning: "Your quiet steadiness matters more than dramatic action right now.",
    reversedMeaning: "You may be stronger than you feel, but too tired to access it cleanly.",
    uprightAdvice: "Lead with softness and consistency, not force.",
    reversedAdvice: "Protect your energy before you demand more from yourself."
  },
  {
    id: "major-hermit",
    name: "The Hermit",
    arcana: "major",
    uprightKeywords: ["reflection", "solitude", "wisdom"],
    reversedKeywords: ["isolation", "stuck reflection", "withdrawal"],
    uprightMeaning: "A thoughtful pause will reveal more than another rushed conversation.",
    reversedMeaning: "Reflection has tipped into hiding or circling the same fear.",
    uprightAdvice: "Step back long enough to hear your own voice again.",
    reversedAdvice: "Seek one grounded perspective instead of spiraling alone."
  },
  {
    id: "major-wheel-of-fortune",
    name: "Wheel of Fortune",
    arcana: "major",
    uprightKeywords: ["turning point", "timing", "cycle shift"],
    reversedKeywords: ["delay", "resistance", "bad timing"],
    uprightMeaning: "The season is changing, and part of the work is learning to move with it.",
    reversedMeaning: "The wheel is moving, but you may be fighting the timing.",
    uprightAdvice: "Look for what the moment is already making easier.",
    reversedAdvice: "Adjust your timing instead of declaring the whole path wrong."
  },
  {
    id: "major-justice",
    name: "Justice",
    arcana: "major",
    uprightKeywords: ["truth", "fairness", "accountability"],
    reversedKeywords: ["bias", "fog", "avoidance of consequence"],
    uprightMeaning: "A clean answer will come from facts, boundaries, and honest cause and effect.",
    reversedMeaning: "Something important is being softened, hidden, or rationalized.",
    uprightAdvice: "List what is true, what is assumed, and what is owed.",
    reversedAdvice: "Stop explaining away what the pattern already shows."
  },
  {
    id: "major-hanged-man",
    name: "The Hanged Man",
    arcana: "major",
    uprightKeywords: ["pause", "new angle", "surrender"],
    reversedKeywords: ["stalling", "martyrdom", "resistance"],
    uprightMeaning: "Progress may require seeing the situation from a completely different angle.",
    reversedMeaning: "You may be calling it patience when it is really postponement.",
    uprightAdvice: "Release the demand for immediate closure and look again.",
    reversedAdvice: "Choose whether this pause is serving you or trapping you."
  },
  {
    id: "major-death",
    name: "Death",
    arcana: "major",
    uprightKeywords: ["ending", "release", "transition"],
    reversedKeywords: ["clinging", "half-ending", "fear of change"],
    uprightMeaning: "Something has reached its natural end, even if your heart has not caught up yet.",
    reversedMeaning: "The pain may be lasting longer because the old door is still half open.",
    uprightAdvice: "Name what is truly over so your energy can move forward.",
    reversedAdvice: "Do not keep feeding what you already know is complete."
  },
  {
    id: "major-temperance",
    name: "Temperance",
    arcana: "major",
    uprightKeywords: ["balance", "blending", "healing"],
    reversedKeywords: ["imbalance", "all-or-nothing", "friction"],
    uprightMeaning: "The healthiest answer comes from integration, not extremes.",
    reversedMeaning: "The situation is asking for calibration, not another dramatic swing.",
    uprightAdvice: "Aim for the sustainable middle, even if it feels less exciting.",
    reversedAdvice: "Reduce the extremes and rebuild rhythm."
  },
  {
    id: "major-devil",
    name: "The Devil",
    arcana: "major",
    uprightKeywords: ["attachment", "temptation", "loop"],
    reversedKeywords: ["release", "truth-telling", "breaking pattern"],
    uprightMeaning: "A binding pattern is shaping the situation more than you want to admit.",
    reversedMeaning: "You are closer to freedom than you think, but honesty is required.",
    uprightAdvice: "Look at the habit, fear, or fantasy that keeps repeating the cycle.",
    reversedAdvice: "Choose one concrete act that weakens the old pattern."
  },
  {
    id: "major-tower",
    name: "The Tower",
    arcana: "major",
    uprightKeywords: ["rupture", "truth shock", "reset"],
    reversedKeywords: ["contained disruption", "delayed truth", "internal quake"],
    uprightMeaning: "A false structure is cracking, and that disruption is also a clearing.",
    reversedMeaning: "The shake-up may be quieter, but it still asks for a reset.",
    uprightAdvice: "Let the truth rearrange the plan instead of rebuilding the same illusion.",
    reversedAdvice: "Address the fracture now before it becomes a collapse."
  },
  {
    id: "major-star",
    name: "The Star",
    arcana: "major",
    uprightKeywords: ["hope", "healing", "renewal"],
    reversedKeywords: ["discouragement", "doubt", "dimmed hope"],
    uprightMeaning: "There is a real path forward, even if you can only see the first few steps.",
    reversedMeaning: "The future is not empty, but your hope may be tired.",
    uprightAdvice: "Protect the small signs of possibility and keep moving toward them.",
    reversedAdvice: "Borrow hope from structure if emotion cannot provide it today."
  },
  {
    id: "major-moon",
    name: "The Moon",
    arcana: "major",
    uprightKeywords: ["uncertainty", "emotion", "hidden layer"],
    reversedKeywords: ["clarification", "false fear", "truth emerging"],
    uprightMeaning: "The emotional weather is real, but it is not the full map.",
    reversedMeaning: "Fog is lifting and patterns are becoming easier to name.",
    uprightAdvice: "Move gently and verify what fear is adding to the picture.",
    reversedAdvice: "Use the new clarity quickly before doubt rewrites it."
  },
  {
    id: "major-sun",
    name: "The Sun",
    arcana: "major",
    uprightKeywords: ["clarity", "warmth", "confidence"],
    reversedKeywords: ["temporary cloud", "hesitation", "muted joy"],
    uprightMeaning: "The path becomes simpler when you let yourself see what is already working.",
    reversedMeaning: "Goodness is present, but stress is making it harder to trust.",
    uprightAdvice: "Choose the option that creates more light, openness, and honesty.",
    reversedAdvice: "Do not let one cloudy moment erase the wider picture."
  },
  {
    id: "major-judgement",
    name: "Judgement",
    arcana: "major",
    uprightKeywords: ["awakening", "decision", "reckoning"],
    reversedKeywords: ["hesitation", "self-criticism", "unfinished lesson"],
    uprightMeaning: "You are being asked to answer the call rather than postpone it.",
    reversedMeaning: "Self-judgement may be delaying the clean decision.",
    uprightAdvice: "Respond to the truth of the moment with maturity, not panic.",
    reversedAdvice: "Separate honest reflection from punishment."
  },
  {
    id: "major-world",
    name: "The World",
    arcana: "major",
    uprightKeywords: ["completion", "integration", "arrival"],
    reversedKeywords: ["unfinished chapter", "loose ends", "near completion"],
    uprightMeaning: "A cycle is coming together, and you are allowed to recognize the progress.",
    reversedMeaning: "You are close to closure, but one piece still needs to be completed cleanly.",
    uprightAdvice: "Finish with intention so the next chapter starts lighter.",
    reversedAdvice: "Tie the loose end instead of carrying it into the next season."
  }
];

const suitThemes = {
  Wands: {
    topic: "action, ambition, attraction, and momentum",
    advice: "Move with courage, but keep your pacing clean."
  },
  Cups: {
    topic: "emotion, intimacy, vulnerability, and relationships",
    advice: "Let honesty lead before intensity does."
  },
  Swords: {
    topic: "thoughts, truth, conflict, and decision-making",
    advice: "Clarity comes from naming the hard thing directly."
  },
  Pentacles: {
    topic: "work, money, the body, and practical security",
    advice: "Ground the reading in what is sustainable in real life."
  }
} as const;

const rankTemplates = {
  Ace: {
    uprightKeywords: ["beginning", "potential", "opening"],
    reversedKeywords: ["delay", "blocked start", "hesitation"],
    uprightMeaning: "Fresh energy is available in this area of life.",
    reversedMeaning: "The opening is real, but it is not moving cleanly yet.",
    uprightAdvice: "Say yes to the seed, then protect it.",
    reversedAdvice: "Remove friction before you force the start."
  },
  Two: {
    uprightKeywords: ["choice", "balance", "meeting point"],
    reversedKeywords: ["split focus", "imbalance", "indecision"],
    uprightMeaning: "The situation is asking for cooperation or a thoughtful choice.",
    reversedMeaning: "Competing priorities are muddying the answer.",
    uprightAdvice: "Balance both sides before committing.",
    reversedAdvice: "Name the tension instead of pretending both paths fit."
  },
  Three: {
    uprightKeywords: ["growth", "expansion", "shared movement"],
    reversedKeywords: ["misalignment", "delay", "thin support"],
    uprightMeaning: "Progress grows when energy connects with others or with a larger vision.",
    reversedMeaning: "The plan may need better support or cleaner coordination.",
    uprightAdvice: "Build with the people and systems that can hold it.",
    reversedAdvice: "Fix the weak link before scaling the effort."
  },
  Four: {
    uprightKeywords: ["stability", "pause", "holding"],
    reversedKeywords: ["restlessness", "stagnation", "tight grip"],
    uprightMeaning: "Stability matters here, even if it feels less exciting.",
    reversedMeaning: "Security may have turned into a rigid holding pattern.",
    uprightAdvice: "Keep what steadies you.",
    reversedAdvice: "Loosen what you are gripping out of fear."
  },
  Five: {
    uprightKeywords: ["friction", "change", "stress test"],
    reversedKeywords: ["recovery", "repair", "settling storm"],
    uprightMeaning: "Conflict or discomfort is revealing where the pressure really is.",
    reversedMeaning: "The tension can soften if you stop feeding the fight.",
    uprightAdvice: "Use the discomfort as data, not identity.",
    reversedAdvice: "Choose repair over replay."
  },
  Six: {
    uprightKeywords: ["movement", "support", "exchange"],
    reversedKeywords: ["imbalance", "unfinished transition", "one-sidedness"],
    uprightMeaning: "The reading points toward a shift, offering, or more balanced exchange.",
    reversedMeaning: "Something is not yet reciprocal or complete.",
    uprightAdvice: "Accept the support or transition that is available.",
    reversedAdvice: "Do not settle for an arrangement that drains more than it returns."
  },
  Seven: {
    uprightKeywords: ["assessment", "tests", "perspective"],
    reversedKeywords: ["illusion", "distraction", "wavering focus"],
    uprightMeaning: "You are being asked to evaluate what is real and what is merely tempting.",
    reversedMeaning: "The field is cluttered with noise, fantasy, or avoidance.",
    uprightAdvice: "Measure the options against your actual goal.",
    reversedAdvice: "Reduce the options until the truth is visible again."
  },
  Eight: {
    uprightKeywords: ["movement", "discipline", "progress"],
    reversedKeywords: ["restriction", "stall", "misfire"],
    uprightMeaning: "There is power in rhythm and continued forward motion.",
    reversedMeaning: "Energy is getting trapped, rushed, or pointed in the wrong direction.",
    uprightAdvice: "Keep a steady cadence.",
    reversedAdvice: "Free the bottleneck before demanding speed."
  },
  Nine: {
    uprightKeywords: ["culmination", "resilience", "inner threshold"],
    reversedKeywords: ["fatigue", "worry", "last-mile strain"],
    uprightMeaning: "You are near a meaningful threshold, and persistence matters.",
    reversedMeaning: "The strain is real and may be distorting the read.",
    uprightAdvice: "Honor how far you have come and finish wisely.",
    reversedAdvice: "Rest enough to make a clear final move."
  },
  Ten: {
    uprightKeywords: ["completion", "full weight", "result"],
    reversedKeywords: ["overload", "unfinished ending", "release needed"],
    uprightMeaning: "The situation has reached a full expression and cannot stay abstract.",
    reversedMeaning: "The load has become too heavy or the ending too drawn out.",
    uprightAdvice: "Acknowledge the result and decide what belongs to you now.",
    reversedAdvice: "Put something down before it breaks your pace."
  },
  Page: {
    uprightKeywords: ["message", "curiosity", "beginner mind"],
    reversedKeywords: ["immaturity", "mixed message", "hesitant start"],
    uprightMeaning: "A learning phase or new message is entering this part of life.",
    reversedMeaning: "The signal is present, but it needs maturity or follow-through.",
    uprightAdvice: "Stay curious and responsive.",
    reversedAdvice: "Do not confuse inspiration with commitment."
  },
  Knight: {
    uprightKeywords: ["drive", "pursuit", "active force"],
    reversedKeywords: ["recklessness", "stalled charge", "misdirected energy"],
    uprightMeaning: "This energy wants action, motion, and a committed pursuit.",
    reversedMeaning: "Action is present, but it may be too rushed or poorly aimed.",
    uprightAdvice: "Move decisively with a real target.",
    reversedAdvice: "Correct the direction before accelerating."
  },
  Queen: {
    uprightKeywords: ["mastery", "presence", "emotional intelligence"],
    reversedKeywords: ["overextension", "guardedness", "inner imbalance"],
    uprightMeaning: "Wisdom here comes from mature presence rather than force.",
    reversedMeaning: "A needed quality is present, but not evenly expressed.",
    uprightAdvice: "Lead from grounded self-respect.",
    reversedAdvice: "Regulate the inner state before guiding the outer one."
  },
  King: {
    uprightKeywords: ["authority", "stability", "command"],
    reversedKeywords: ["hard edge", "control issue", "off-balance leadership"],
    uprightMeaning: "The reading points toward ownership, structure, and mature command.",
    reversedMeaning: "Control may be replacing wisdom in this area.",
    uprightAdvice: "Take responsibility without crushing flexibility.",
    reversedAdvice: "Rebuild authority from steadiness, not dominance."
  }
} as const;

const ranks = Object.keys(rankTemplates) as Array<keyof typeof rankTemplates>;
const suits = Object.keys(suitThemes) as Array<keyof typeof suitThemes>;

function createMinorCard(suit: keyof typeof suitThemes, rank: keyof typeof rankTemplates): CardTemplate {
  const rankTemplate = rankTemplates[rank];
  const suitTheme = suitThemes[suit];

  return {
    id: `minor-${rank.toLowerCase()}-${suit.toLowerCase()}`,
    name: `${rank} of ${suit}`,
    arcana: "minor",
    suit,
    rank,
    uprightKeywords: [...rankTemplate.uprightKeywords, suitTheme.topic.split(",")[0]],
    reversedKeywords: [...rankTemplate.reversedKeywords, suitTheme.topic.split(",")[0]],
    uprightMeaning: `${rankTemplate.uprightMeaning} It especially touches ${suitTheme.topic}.`,
    reversedMeaning: `${rankTemplate.reversedMeaning} It especially touches ${suitTheme.topic}.`,
    uprightAdvice: `${rankTemplate.uprightAdvice} ${suitTheme.advice}`,
    reversedAdvice: `${rankTemplate.reversedAdvice} ${suitTheme.advice}`
  };
}

const fullDeck: CardTemplate[] = [
  ...majorArcana,
  ...suits.flatMap((suit) => ranks.map((rank) => createMinorCard(suit, rank)))
];

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = copy[index];

    copy[index] = copy[swapIndex];
    copy[swapIndex] = current;
  }

  return copy;
}

function mapToDrawnCard(card: CardTemplate, position: string): DrawnCard {
  const upright = Math.random() > 0.35;

  return {
    id: `${card.id}-${upright ? "upright" : "reversed"}-${position.toLowerCase().replace(/\s+/g, "-")}`,
    name: card.name,
    arcana: card.arcana,
    suit: card.suit,
    rank: card.rank,
    orientation: upright ? "upright" : "reversed",
    position,
    keywords: upright ? card.uprightKeywords : card.reversedKeywords,
    meaning: upright ? card.uprightMeaning : card.reversedMeaning,
    advice: upright ? card.uprightAdvice : card.reversedAdvice
  };
}

function positionsForSpread(spreadType: SpreadType): string[] {
  return spreadType === "single-card" ? ["Core message"] : ["Past", "Present", "Near future"];
}

export function drawTarotSpread(question: string, spreadType: SpreadType, focusArea?: string): DrawnSpread {
  const positions = positionsForSpread(spreadType);
  const deck = shuffle(fullDeck);
  const cards = positions.map((position, index) => mapToDrawnCard(deck[index], position));

  return {
    spreadType,
    focusQuestion: question,
    focusArea: focusArea?.trim() || "general",
    cards
  };
}

function renderCardLine(card: DrawnCard, language: LanguageStyle): string {
  const keywordText = card.keywords.join(", ");
  if (language === "zh") {
    return `${card.position}: ${card.name} (${card.orientation})\n- 信号：${card.meaning}\n- 关键词：${keywordText}\n- 建议：${card.advice}`;
  }

  return `${card.position}: ${card.name} (${card.orientation})\n- Signal: ${card.meaning}\n- Keywords: ${keywordText}\n- Advice: ${card.advice}`;
}

export function renderLocalReading(spread: DrawnSpread, tone: ToneStyle, language: LanguageStyle = "zh"): string {
  if (language === "zh") {
    const opening = tone === "direct" ? "这是直接版解读。" : "我会温柔但清晰地陪你看这组三张牌。";
    const cardLines = spread.cards.map((card) => renderCardLine(card, language)).join("\n\n");
    const closing =
      tone === "direct"
        ? "实际下一步：在接下来的 24 小时里，选一个和最强那张牌一致的行动，不要继续等更多征兆。"
        : "实际下一步：在接下来的 24 小时里，选一个踏实的小行动，回应这组牌给你的提醒，而不是等待绝对确定。";

    return `${opening}\n\n问题：${spread.focusQuestion}\n\n${cardLines}\n\n${closing}\n塔罗是一个自我觉察工具，不是对未来结果的保证。`;
  }

  const opening =
    tone === "direct"
      ? "Here is the straight read."
      : "Here is the reading, held gently but clearly.";

  const cardLines = spread.cards.map((card) => renderCardLine(card, language)).join("\n\n");
  const closing =
    tone === "direct"
      ? "Practical next step: choose one action in the next 24 hours that matches the strongest card instead of waiting for more signs."
      : "Practical next step: choose one grounded action in the next 24 hours that honors the strongest card instead of waiting for certainty.";

  return `${opening}\n\nQuestion: ${spread.focusQuestion}\n\n${cardLines}\n\n${closing}\nTarot is a reflection tool, not a guarantee of outcomes.`;
}

const reflectiveKeywords = [
  "love",
  "career",
  "work",
  "money",
  "relationship",
  "job",
  "leave",
  "stay",
  "decision",
  "future",
  "feel",
  "partner",
  "project",
  "family",
  "anxiety",
  "stress",
  "conflict",
  "move",
  "break up",
  "marriage",
  "friend",
  "health",
  "study",
  "创业",
  "工作",
  "感情",
  "恋爱",
  "关系",
  "钱",
  "财务",
  "离职",
  "辞职",
  "要不要",
  "对象",
  "未来",
  "焦虑",
  "压力",
  "项目",
  "家庭",
  "合作"
];

export function needsMockClarification(userMessage: string): boolean {
  const normalized = userMessage.trim().toLowerCase();

  if (normalized.length < 10) {
    return true;
  }

  const matchedKeyword = reflectiveKeywords.some((keyword) => normalized.includes(keyword));

  if (!matchedKeyword) {
    return true;
  }

  const vaguePatterns = [/^help\b/i, /^看看\b/i, /^说说\b/i, /^read me\b/i, /^do a reading\b/i, /^占一下\b/i];
  return vaguePatterns.some((pattern) => pattern.test(normalized));
}

export function createMockTarotTurn(userMessage: string, spreadType: SpreadType, tone: ToneStyle, language: LanguageStyle = "zh") {
  if (needsMockClarification(userMessage)) {
    return {
      cards: null,
      reply:
        language === "zh"
          ? tone === "direct"
            ? "请用一句话说具体一点：这是关于哪个领域？你想让牌看的是哪个决定或拉扯？"
            : "给我一句更清楚的描述：这是关于感情、工作、金钱，还是某个具体决定？我会据此决定是否现在抽牌。"
          : tone === "direct"
            ? "Be specific in one line: what area is this about, and what decision or tension do you want the cards to read?"
            : "Give me one clear line about the area and the tension you want the cards to focus on, such as love, work, money, or a specific decision.",
      mode: "mock" as const
    };
  }

  const spread = drawTarotSpread(userMessage, spreadType, "mock-mode");
  return {
    cards: spread,
    reply: renderLocalReading(spread, tone, language),
    mode: "mock" as const
  };
}
