import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const outDir = path.join(process.cwd(), "public", "tarot-cards");

const majorCards = [
  ["major-magician", "The Magician", "I"],
  ["major-high-priestess", "The High Priestess", "II"],
  ["major-empress", "The Empress", "III"],
  ["major-emperor", "The Emperor", "IV"],
  ["major-hierophant", "The Hierophant", "V"],
  ["major-lovers", "The Lovers", "VI"],
  ["major-chariot", "The Chariot", "VII"],
  ["major-strength", "Strength", "VIII"],
  ["major-hermit", "The Hermit", "IX"],
  ["major-wheel-of-fortune", "Wheel of Fortune", "X"],
  ["major-justice", "Justice", "XI"],
  ["major-hanged-man", "The Hanged Man", "XII"],
  ["major-death", "Death", "XIII"],
  ["major-temperance", "Temperance", "XIV"],
  ["major-devil", "The Devil", "XV"],
  ["major-tower", "The Tower", "XVI"],
  ["major-star", "The Star", "XVII"],
  ["major-moon", "The Moon", "XVIII"],
  ["major-sun", "The Sun", "XIX"],
  ["major-judgement", "Judgement", "XX"],
  ["major-world", "The World", "XXI"]
];

const suits = {
  Wands: { symbol: "△", color: "#ef8a58", accent: "#ffd0bd" },
  Cups: { symbol: "☽", color: "#5dbbd1", accent: "#c6f1f6" },
  Swords: { symbol: "◇", color: "#9da8ff", accent: "#e0e3ff" },
  Pentacles: { symbol: "◎", color: "#70c98b", accent: "#d1f3d9" }
};

const ranks = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"];

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function hashText(text) {
  return [...text].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 1009, 23);
}

function wrapTitle(title) {
  const words = title.split(" ");
  if (title.length <= 16) {
    return [title];
  }

  const lines = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > 16 && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }

  if (line) {
    lines.push(line);
  }

  return lines.slice(0, 2);
}

function arcPath(seed, index) {
  const y = 146 + index * 54 + (seed % 13);
  const bend = 38 + ((seed + index * 17) % 54);

  return `M ${58 + index * 4} ${y} C ${150} ${y - bend}, ${270} ${y + bend}, ${392 - index * 5} ${y - 8}`;
}

function motif(card) {
  const seed = hashText(card.id);
  const strokes = Array.from({ length: 5 }, (_, index) => {
    return `<path d="${arcPath(seed, index)}" fill="none" stroke="url(#line-${card.id})" stroke-width="${1.2 + (index % 2) * 0.8}" opacity="${0.28 + index * 0.08}"/>`;
  }).join("");
  const stars = Array.from({ length: 18 }, (_, index) => {
    const x = 55 + ((seed * (index + 3)) % 340);
    const y = 86 + ((seed + index * 61) % 520);
    const r = 0.9 + ((seed + index) % 4) * 0.42;

    return `<circle cx="${x}" cy="${y}" r="${r.toFixed(2)}" fill="#fff7d8" opacity="${0.22 + (index % 5) * 0.08}"/>`;
  }).join("");

  return `${strokes}${stars}`;
}

function renderCard(card) {
  const titleLines = wrapTitle(card.name);
  const titleY = titleLines.length > 1 ? 482 : 500;
  const symbolSize = card.arcana === "major" ? 116 : 102;
  const subtitle = card.arcana === "major" ? "Major Arcana" : card.suit;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1350" viewBox="0 0 450 675" role="img" aria-label="${escapeXml(card.name)} tarot card">
  <defs>
    <linearGradient id="bg-${card.id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#150f25"/>
      <stop offset="0.48" stop-color="#251a36"/>
      <stop offset="1" stop-color="#0b1421"/>
    </linearGradient>
    <radialGradient id="glow-${card.id}" cx="50%" cy="42%" r="52%">
      <stop offset="0" stop-color="${card.color}" stop-opacity="0.82"/>
      <stop offset="0.48" stop-color="${card.color}" stop-opacity="0.22"/>
      <stop offset="1" stop-color="${card.color}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="line-${card.id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${card.accent}" stop-opacity="0"/>
      <stop offset="0.5" stop-color="${card.accent}" stop-opacity="0.9"/>
      <stop offset="1" stop-color="${card.accent}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="450" height="675" rx="34" fill="url(#bg-${card.id})"/>
  <rect x="18" y="18" width="414" height="639" rx="28" fill="none" stroke="${card.accent}" stroke-opacity="0.72" stroke-width="2"/>
  <rect x="31" y="31" width="388" height="613" rx="22" fill="none" stroke="#fff7d8" stroke-opacity="0.16"/>
  <circle cx="225" cy="302" r="170" fill="url(#glow-${card.id})"/>
  <circle cx="225" cy="302" r="118" fill="none" stroke="${card.accent}" stroke-opacity="0.42" stroke-width="1.4"/>
  <circle cx="225" cy="302" r="76" fill="none" stroke="#fff7d8" stroke-opacity="0.18" stroke-width="1"/>
  ${motif(card)}
  <text x="225" y="70" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="23" letter-spacing="2" fill="${card.accent}">${escapeXml(card.mark)}</text>
  <text x="225" y="333" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${symbolSize}" fill="${card.accent}" opacity="0.95">${escapeXml(card.symbol)}</text>
  ${titleLines.map((line, index) => `<text x="225" y="${titleY + index * 34}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="28" fill="#fff6da">${escapeXml(line)}</text>`).join("")}
  <text x="225" y="580" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="13" letter-spacing="4" fill="${card.accent}" opacity="0.78">${escapeXml(subtitle.toUpperCase())}</text>
  <path d="M 86 612 H 364" stroke="${card.accent}" stroke-opacity="0.42"/>
  <text x="225" y="632" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11" letter-spacing="3" fill="#fff6da" opacity="0.58">LUNA TAROT</text>
</svg>
`;
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const minorCards = Object.entries(suits).flatMap(([suit, suitMeta]) =>
    ranks.map((rank) => ({
      id: `minor-${rank.toLowerCase()}-${suit.toLowerCase()}`,
      name: `${rank} of ${suit}`,
      arcana: "minor",
      suit,
      mark: suitMeta.symbol,
      symbol: suitMeta.symbol,
      color: suitMeta.color,
      accent: suitMeta.accent
    }))
  );

  const cards = [
    ...majorCards.map(([id, name, mark]) => ({
      id,
      name,
      arcana: "major",
      mark,
      symbol: "✦",
      color: "#d7bd62",
      accent: "#f6e2a0"
    })),
    ...minorCards
  ];

  await Promise.all(cards.map((card) => writeFile(path.join(outDir, `${card.id}.svg`), renderCard(card), "utf8")));
  console.log(`Generated ${cards.length} tarot card SVGs in ${outDir}`);
}

await main();
