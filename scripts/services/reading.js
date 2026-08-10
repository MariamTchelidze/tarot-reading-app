import { cards, positions } from "../data/cards.js";

// Fisher-Yates uses browser cryptography instead of Math.random().
export function shuffleDeck() {
  const deck = cards.map((card) => card.id);
  const random = crypto.getRandomValues(new Uint32Array(deck.length));
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const other = random[index] % (index + 1);
    [deck[index], deck[other]] = [deck[other], deck[index]];
  }
  return deck;
}

export function createDraft(userId) {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), userId, status: "selecting", deckOrder: shuffleDeck(), selectedCards: [], topic: null, startedAt: now, updatedAt: now };
}

// Add a unique card to the next available reading position.
export function selectCard(draft, cardId, deckIndex) {
  if (draft.status !== "selecting" || draft.selectedCards.length >= 3 || draft.selectedCards.some((item) => item.cardId === cardId)) return false;
  draft.selectedCards.push({ cardId, deckIndex, position: positions[draft.selectedCards.length].key, selectedAt: new Date().toISOString() });
  draft.updatedAt = new Date().toISOString();
  if (draft.selectedCards.length === 3) draft.status = "topic_selection";
  return true;
}

// Removing the middle card compacts later cards into the correct position.
export function removeCard(draft, cardId) {
  if (draft.status !== "selecting") return false;
  draft.selectedCards = draft.selectedCards.filter((item) => item.cardId !== cardId).map((item, index) => ({ ...item, position: positions[index].key }));
  draft.updatedAt = new Date().toISOString();
  return true;
}

export function unlockDraft(draft) {
  draft.status = "selecting";
  draft.topic = null;
  draft.updatedAt = new Date().toISOString();
}
