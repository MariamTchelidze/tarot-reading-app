import { getCard, positions } from "../data/cards.js";

const topicLabels = { love: "Love", finance: "Finance", general: "General" };

// Each spread position changes how the same card should be understood.
const positionLenses = {
  past: {
    purpose: "the foundation beneath this question",
    explanation: "This position describes an earlier influence, learned pattern, or experience that still shapes the way you approach the present. It is context, not a sentence you must repeat.",
  },
  present: {
    purpose: "the energy active at the present crossing",
    explanation: "This position highlights what currently asks for attention: a choice, resource, tension, or truth that may be easier to work with once it is named clearly.",
  },
  future: {
    purpose: "the direction now beginning to form",
    explanation: "This position suggests a likely development if current patterns continue. It describes possibility rather than an unavoidable outcome, leaving room for choice and changed circumstances.",
  },
};

// Topic lenses keep advice relevant while respecting responsible-content limits.
const topicLenses = {
  love: {
    focus: "connection, reciprocity, boundaries, and honest communication",
    invitation: "Consider what can be communicated directly, where care is mutual, and which boundaries allow closeness to remain respectful. The cards cannot reveal another person's private thoughts or consent.",
  },
  finance: {
    focus: "work, resources, priorities, and measured decision-making",
    invitation: "Use this reading to review habits, assumptions, and available information before acting. It does not recommend buying, selling, borrowing, or making a particular investment.",
  },
  general: {
    focus: "your wider priorities, personal energy, and next meaningful direction",
    invitation: "Notice which part of life feels most connected to these symbols. Keep the interpretation reflective and bring medical, legal, or safety questions to qualified professionals.",
  },
};

// Minor Arcana suits describe the everyday area in which a card tends to operate.
const suitMeanings = {
  cups: "Cups speak through emotion, intuition, belonging, and the quality of connection.",
  pentacles: "Pentacles concern resources, the body of daily work, patience, and what can be made sustainable.",
  swords: "Swords bring attention to thought, communication, discernment, conflict, and difficult clarity.",
  wands: "Wands carry creative energy, motivation, initiative, and the courage required to begin or continue.",
};

const suitFocus = {
  cups: "emotion, intuition, and relationships",
  pentacles: "resources, patience, and sustainable effort",
  swords: "thought, communication, and discernment",
  wands: "motivation, initiative, and creative energy",
};

// Rank meanings add a developmental stage to every Minor Arcana card.
const rankMeanings = {
  ace: "As an Ace, it holds concentrated potential: a beginning that needs conscious direction.",
  two: "As a Two, it presents relationship, contrast, or a choice between competing possibilities.",
  three: "As a Three, it asks how an early idea can grow through cooperation, expression, or planning.",
  four: "As a Four, it seeks stability while warning against structures that have become too rigid.",
  five: "As a Five, it marks friction or change that can expose what needs adjustment.",
  six: "As a Six, it looks for restored movement, exchange, or a more workable balance.",
  seven: "As a Seven, it calls for assessment, patience, and alignment between intention and effort.",
  eight: "As an Eight, it emphasizes momentum, disciplined attention, and the consequences of repetition.",
  nine: "As a Nine, it reflects maturity, nearing completion, and the wisdom gained through endurance.",
  ten: "As a Ten, it brings a cycle to fullness and asks what should be completed, shared, or released.",
  page: "As a Page, it brings curiosity, a message, or a beginner's willingness to learn.",
  knight: "As a Knight, it puts the suit into motion and asks whether speed and direction are well matched.",
  queen: "As a Queen, it represents inward mastery, mature receptivity, and influence expressed with awareness.",
  king: "As a King, it concerns outward stewardship, responsibility, and the ethical use of experience.",
};

function cardDepth(card) {
  if (card.arcana === "major") {
    return `${card.name} belongs to the Major Arcana, so its appearance gives this position extra weight. Its themes of ${card.uprightMeaning} point to an underlying life lesson or meaningful turning point rather than a passing detail.`;
  }
  return `${suitMeanings[card.suit]} ${rankMeanings[card.rank]}`;
}

// Find repeated suits and the balance between major and everyday influences.
function buildPatternAnalysis(chosen) {
  const majorCount = chosen.filter((card) => card.arcana === "major").length;
  const suits = chosen.filter((card) => card.suit).map((card) => card.suit);
  const repeatedSuit = suits.find((suit) => suits.filter((item) => item === suit).length > 1);
  const scale = majorCount >= 2
    ? `${majorCount} Major Arcana cards suggest that the reading is centered on a larger transition, identity question, or lesson with significance beyond a single short-term event.`
    : majorCount === 1
      ? "One Major Arcana card anchors the spread, while the Minor Arcana cards show how that larger theme is being expressed through daily choices and circumstances."
      : "All three cards are Minor Arcana, placing the emphasis on practical patterns, present habits, and changes that can be approached one step at a time.";
  const repetition = repeatedSuit
    ? `The repeated ${repeatedSuit} suit strengthens the importance of ${suitFocus[repeatedSuit]}.`
    : "Because no suit dominates, the spread asks you to balance several kinds of information rather than reducing the situation to one concern.";
  return `${scale} ${repetition}`;
}

// Compose a detailed, deterministic reading entirely on the user's device.
export function createInterpretation(draft) {
  const chosen = draft.selectedCards.map((selected) => getCard(selected.cardId));
  const topic = draft.topic;
  const topicLens = topicLenses[topic];
  const cardInsights = chosen.map((card, index) => {
    const position = positions[index];
    const lens = positionLenses[position.key];
    return {
      cardId: card.id,
      position: position.key,
      heading: position.label,
      role: `Here, ${card.name} represents ${lens.purpose}.`,
      symbolism: cardDepth(card),
      interpretation: `${lens.explanation} In a ${topicLabels[topic].toLowerCase()} reading, ${card.topicMeanings[topic]} The useful question is how ${card.keywords[0]} can work with ${card.keywords[1]} without losing sight of ${card.keywords[2]}.`,
    };
  });

  return {
    title: `${topicLabels[topic]} Reading · The Three Roads`,
    overview: `Your spread moves from ${chosen[0].name}, through ${chosen[1].name}, toward ${chosen[2].name}. Its central movement is from ${chosen[0].keywords[0]} into ${chosen[1].keywords[0]}, with ${chosen[2].keywords[0]} emerging as the developing possibility. For ${topicLens.focus}, this is a layered story rather than three isolated definitions: the past explains the pattern, the present identifies your point of agency, and the future shows what the current direction may cultivate.`,
    cardInsights,
    patternAnalysis: buildPatternAnalysis(chosen),
    synthesis: `${chosen[0].name} suggests that ${chosen[0].keywords[1]} has already shaped the ground beneath this question. ${chosen[1].name} brings the reading into the present by asking for ${chosen[1].keywords[1]} rather than an automatic response. If that present lesson is engaged thoughtfully, ${chosen[2].name} opens a path toward ${chosen[2].keywords[1]} and ${chosen[2].keywords[2]}. The tension in the spread is between ${chosen[0].keywords[0]} and ${chosen[1].keywords[0]}; its opportunity is to combine them instead of choosing one and rejecting the other. ${topicLens.invitation}`,
    guidance: [
      `Name one past pattern connected with ${chosen[0].keywords[0]} and decide whether it is still useful.`,
      `Give focused attention to ${chosen[1].keywords[1]} before making the next important choice.`,
      `Choose one small, reversible action that supports ${chosen[2].keywords[0]} without demanding certainty.`,
      "Return to the reading after a day or two and note what feels clearer, less relevant, or newly important.",
    ],
    reflections: [
      `Where has ${chosen[0].keywords[0]} influenced your expectations more than you realized?`,
      `What would ${chosen[1].keywords[1]} look like as a concrete behavior today?`,
      `What fear or assumption could make it difficult to welcome ${chosen[2].keywords[0]}?`,
      "Which part of this interpretation feels grounded in your experience, and which part should you question?",
    ],
    disclaimer: "This reading is for reflection and entertainment. It is not professional advice and does not predict guaranteed outcomes.",
    generator: "local-v2",
  };
}

// The draft ID becomes the reading ID to prevent duplicate saves.
export function completeReading(draft) {
  return { id: draft.id, userId: draft.userId, topic: draft.topic, cards: draft.selectedCards, interpretation: createInterpretation(draft), startedAt: draft.startedAt, completedAt: new Date().toISOString(), contentVersion: "local-v2" };
}
