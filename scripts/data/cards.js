// Major Arcana filenames match the supplied artwork exactly.
const majorCards = [
  ["The Fool", "the fool.png", ["beginnings", "trust", "adventure"]], ["The Magician", "The-magician.png", ["skill", "will", "creation"]],
  ["The High Priestess", "The-highest-priestess.png", ["intuition", "mystery", "wisdom"]], ["The Empress", "The-empress.png", ["abundance", "care", "growth"]],
  ["The Emperor", "the-emperor.png", ["structure", "duty", "leadership"]], ["The Hierophant", "The-Hierophant.png", ["tradition", "guidance", "learning"]],
  ["The Lovers", "The-Lovers.png", ["union", "choice", "devotion"]], ["The Chariot", "The-Chariot.png", ["momentum", "resolve", "victory"]],
  ["Strength", "Strength.png", ["courage", "grace", "patience"]], ["The Hermit", "The-hermit.png", ["solitude", "searching", "truth"]],
  ["Wheel of Fortune", "Wheel-of-fortune.png", ["cycles", "fortune", "change"]], ["Justice", "Justice.png", ["balance", "honesty", "consequence"]],
  ["The Hanged Man", "The-Hanged-Man.png", ["pause", "surrender", "perspective"]], ["Death", "death.png", ["ending", "renewal", "release"]],
  ["Temperance", "Temperance.png", ["harmony", "moderation", "healing"]], ["The Devil", "The-Devil.png", ["attachment", "temptation", "power"]],
  ["The Tower", "The-Tower.png", ["upheaval", "revelation", "freedom"]], ["The Star", "The-Star.png", ["hope", "purpose", "renewal"]],
  ["The Moon", "The-Moon.png", ["uncertainty", "dreams", "instinct"]], ["The Sun", "The-Sun.png", ["joy", "clarity", "vitality"]],
  ["Judgment", "Judgment.png", ["awakening", "reckoning", "calling"]], ["The World", "The-World.png", ["completion", "belonging", "wholeness"]],
];

// Minor Arcana data is generated from four suits and fourteen ranks.
const suits = [["Cups", "cups", ["feeling", "connection", "intuition"]], ["Pentacles", "pentacles", ["resources", "work", "stability"]], ["Swords", "swords", ["truth", "thought", "decision"]], ["Wands", "wands", ["energy", "action", "purpose"]]];
const ranks = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"];
const rankMeanings = ["a new seed", "a meaningful choice", "early expansion", "a firm foundation", "a test of resolve", "restored balance", "a patient stand", "gathering momentum", "earned confidence", "a completed cycle", "curious news", "focused pursuit", "quiet mastery", "seasoned leadership"];

// Handle the few supplied filenames that use different capitalization.
const exactFilename = new Map([["Two of Cups", "Two-Of-Cups.png"], ["Three of Swords", "Three-of-Swords.png"], ...["Three", "Page", "Knight", "Queen", "Ten"].map((rank) => [`${rank} of Pentacles`, `${rank}-of-Pentacles.png`])]);

function createCard({ index, name, image, arcana, suit = null, rank = null, keywords }) {
  const [first, second, third] = keywords;
  return Object.freeze({
    id: `card-${String(index + 1).padStart(2, "0")}`, index, name, arcana, suit, rank,
    imageSrc: `assets/Images/${image}`, imageAlt: `${name} tarot card`, keywords,
    uprightMeaning: `${first}, ${second}, and ${third}`,
    topicMeanings: {
      love: `Notice how ${first} and ${second} shape the relationships you choose to nurture.`,
      finance: `Consider how ${first} can support a careful relationship with work and resources.`,
      general: `Let ${first} and ${third} clarify the next thoughtful step on your path.`,
    },
  });
}

export const cards = Object.freeze([
  ...majorCards.map(([name, image, keywords], index) => createCard({ index, name, image, keywords, arcana: "major" })),
  ...suits.flatMap(([suitName, suitSlug, suitKeywords], suitIndex) => ranks.map((rank, rankIndex) => {
    const name = `${rank} of ${suitName}`;
    const image = exactFilename.get(name) || `${rank}-of-${suitSlug}.png`;
    return createCard({ index: 22 + (suitIndex * 14) + rankIndex, name, image, arcana: "minor", suit: suitSlug, rank: rank.toLowerCase(), keywords: [suitKeywords[0], suitKeywords[1], rankMeanings[rankIndex]] });
  })),
]);

export const positions = [{ key: "past", label: "The Path Behind" }, { key: "present", label: "The Present Road" }, { key: "future", label: "The Road Ahead" }];
export function getCard(cardId) { return cards.find((card) => card.id === cardId); }
