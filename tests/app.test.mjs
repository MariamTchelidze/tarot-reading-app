import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { cards } from "../scripts/data/cards.js";
import { createDraft, removeCard, selectCard, shuffleDeck } from "../scripts/services/reading.js";
import { normalizeEmail } from "../scripts/services/auth.js";
import { authTemplate } from "../scripts/views/templates.js";
import { dashboardTemplate } from "../scripts/views/templates.js";
import { createInterpretation } from "../scripts/services/interpretation.js";

// The manifest must always represent one complete, unique tarot deck.
test("catalog contains exactly 78 unique cards and usable images", async () => {
  assert.equal(cards.length, 78);
  assert.equal(new Set(cards.map((card) => card.id)).size, 78);
  await Promise.all(cards.map((card) => access(new URL(`../${card.imageSrc}`, import.meta.url))));
  await access(new URL("../assets/Images/background.png", import.meta.url));
});

// A shuffled draft must contain every card exactly once.
test("cryptographic shuffle preserves the complete deck", () => {
  const deck = shuffleDeck();
  assert.equal(deck.length, 78);
  assert.equal(new Set(deck).size, 78);
  assert.deepEqual(new Set(deck), new Set(cards.map((card) => card.id)));
});

// Selection stops at three, and removing the middle card compacts positions.
test("reading selection enforces limits and compacts positions", () => {
  const draft = createDraft("user-test");
  assert.equal(selectCard(draft, draft.deckOrder[0], 0), true);
  assert.equal(selectCard(draft, draft.deckOrder[1], 1), true);
  assert.equal(draft.selectedCards[1].position, "present");
  assert.equal(removeCard(draft, draft.selectedCards[0].cardId), true);
  assert.equal(draft.selectedCards[0].position, "past");
  selectCard(draft, draft.deckOrder[2], 2);
  selectCard(draft, draft.deckOrder[3], 3);
  assert.equal(draft.selectedCards.length, 3);
  assert.equal(draft.status, "topic_selection");
  assert.equal(selectCard(draft, draft.deckOrder[4], 4), false);
});

// Chosen cards stay secret until a topic starts the scanning phase.
test("selected card faces reveal only after topic choice", () => {
  const draft = createDraft("user-test");
  selectCard(draft, draft.deckOrder[0], 0);
  const selectedCard = cards.find((card) => card.id === draft.selectedCards[0].cardId);
  const user = { displayName: "Test", avatar: { value: "leaf" } };
  const preferences = { deckLayout: "auto" };
  assert.doesNotMatch(dashboardTemplate(user, draft, preferences), new RegExp(selectedCard.imageSrc.replaceAll("/", "\\/")));
  draft.status = "scanning";
  assert.match(dashboardTemplate(user, draft, preferences), new RegExp(selectedCard.imageSrc.replaceAll("/", "\\/")));
});

// New readings provide several layers instead of three brief definitions.
test("local reading contains detailed analysis and guidance", () => {
  const draft = createDraft("user-test");
  draft.selectedCards = draft.deckOrder.slice(0, 3).map((cardId, index) => ({ cardId, deckIndex: index, position: ["past", "present", "future"][index] }));
  draft.topic = "general";
  const reading = createInterpretation(draft);
  const completeText = JSON.stringify(reading);
  assert.ok(completeText.split(/\s+/).length > 450);
  assert.equal(reading.cardInsights.length, 3);
  assert.equal(reading.guidance.length, 4);
  assert.equal(reading.reflections.length, 4);
  assert.ok(reading.patternAnalysis.length > 100);
});

// Authentication compares normalized emails, not capitalization or spaces.
test("email normalization is deterministic", () => {
  assert.equal(normalizeEmail("  Traveler@Example.COM "), "traveler@example.com");
});

// Validation re-renders must restore the values the user already entered.
test("registration template preserves form values after an error", () => {
  const html = authTemplate("register", "Fix the highlighted fields.", {
    displayName: "Arwen",
    email: "arwen@example.com",
    password: "long-password",
    confirmPassword: "different-password",
    avatar: "moon",
  });
  assert.match(html, /value="Arwen"/);
  assert.match(html, /value="arwen@example\.com"/);
  assert.match(html, /value="long-password"/);
  assert.match(html, /value="moon" checked/);
});

// HTML and CSS should point to the single entry files requested by the user.
test("HTML, SCSS, and JavaScript have one entry point each", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const scss = await readFile(new URL("../assets/scss/main.scss", import.meta.url), "utf8");
  assert.match(html, /assets\/styles\/styles\.css/);
  assert.match(html, /scripts\/main\.js/);
  assert.match(scss, /@use "layout\/dashboard"/);
  assert.doesNotMatch(html, /react|next|vue/i);
});
