import { getCard, positions } from "../data/cards.js";
import { escapeHtml, formatDate } from "../utils/dom.js";

const avatars = { leaf: "❧", star: "✦", crown: "♔", moon: "☾" };
const topicLabels = { love: "Love", finance: "Finance", general: "General" };

// Card faces use the real supplied image and keep a text fallback underneath.
export function cardFace(card) {
  return `<div class="card-face"><div class="card-fallback"><strong>${escapeHtml(card.name)}</strong><small>${escapeHtml(card.uprightMeaning)}</small></div><img src="${card.imageSrc}" alt="${escapeHtml(card.imageAlt)}" loading="lazy"></div>`;
}

// All 78 face-down cards share the supplied background artwork.
export function cardBack() {
  return `<div class="card-back"><span aria-hidden="true">✦</span><img src="assets/Images/background.png" alt="" loading="eager"></div>`;
}

// Authentication is the only view available without a local session.
export function authTemplate(mode = "login", message = "", values = {}) {
  const register = mode === "register";
  const savedAvatar = values.avatar || "leaf";
  return `<section class="auth-page">
    <div class="brand-panel"><span class="brand">✦ Middle-earth Reading</span><div><p class="eyebrow">A private three-card ritual</p><h1>Welcome to<br><em>Middle-earth Reading</em></h1><p>Pause at the edge of the known road. Choose three cards and receive a reflective chronicle kept only in this browser.</p></div><small>No cloud account · No questions transmitted</small></div>
    <div class="auth-panel"><div class="auth-card"><p class="eyebrow">Enter the chronicle</p><h2>${register ? "Create your local account" : "Welcome back, traveler"}</h2><p>${register ? "Your account and readings stay on this device." : "Continue the journey saved in this browser."}</p>
      <div class="auth-tabs" role="tablist" aria-label="Account options"><button class="${register ? "" : "active"}" data-auth-mode="login" role="tab" aria-selected="${!register}">Sign in</button><button class="${register ? "active" : ""}" data-auth-mode="register" role="tab" aria-selected="${register}">Create account</button></div>
      ${message ? `<div class="form-message" tabindex="-1">${escapeHtml(message)}</div>` : ""}
      <form id="auth-form" class="form-stack" novalidate>
        ${register ? `<label>Display name<input name="displayName" value="${escapeHtml(values.displayName || "")}" autocomplete="name" minlength="2" maxlength="40" required></label><fieldset class="avatar-picker"><legend>Choose an avatar</legend>${Object.entries(avatars).map(([value, icon]) => `<label><input type="radio" name="avatar" value="${value}" ${savedAvatar === value ? "checked" : ""}><span>${icon}</span></label>`).join("")}</fieldset>` : ""}
        <label>Email<input name="email" value="${escapeHtml(values.email || "")}" type="email" autocomplete="email" required></label>
        <label>Password<span class="password-wrap"><input name="password" value="${escapeHtml(values.password || "")}" type="password" autocomplete="${register ? "new-password" : "current-password"}" minlength="10" required><button type="button" data-password-toggle aria-label="Show password">Show</button></span></label>
        ${register ? `<label>Confirm password<input name="confirmPassword" value="${escapeHtml(values.confirmPassword || "")}" type="password" autocomplete="new-password" minlength="10" required></label>` : ""}
        <button class="button primary" type="submit">${register ? "Begin my journey" : "Continue my journey"}</button>
      </form>
      <p class="privacy-note">◇ This is a personalization gate, not secure authentication. Anyone with access to this browser profile may inspect local data.</p>
    </div></div>
  </section>`;
}

// The header is shared by every authenticated screen.
export function headerTemplate(user, currentView) {
  const avatar = avatars[user.avatar?.value] || user.displayName.slice(0, 1).toUpperCase();
  return `<header class="site-header"><button class="wordmark" data-view="dashboard"><span>✦</span> Middle-earth Reading</button><nav aria-label="Main navigation"><button class="${currentView === "dashboard" ? "active" : ""}" data-view="dashboard">Reading</button><button class="${currentView === "history" ? "active" : ""}" data-view="history">History</button><button class="${currentView === "preferences" ? "active" : ""}" data-view="preferences">Preferences</button></nav><div class="profile"><span class="avatar" aria-hidden="true">${avatar}</span><span>${escapeHtml(user.displayName)}</span><button class="text-button" data-action="sign-out">Sign out</button></div></header>`;
}

// Three fixed slots preserve the past, present, and future reading order.
function slotsTemplate(draft) {
  const revealed = draft.status === "scanning";
  return `<div class="reading-slots">${positions.map((position, index) => {
    const selected = draft.selectedCards[index];
    const card = selected ? getCard(selected.cardId) : null;
    let cardContent = `<div class="empty-card"><span>✦</span><small>Awaiting a card</small></div>`;
    if (card && revealed) {
      cardContent = `<button class="revealed-card" data-enlarge-card="${card.id}" aria-label="View enlarged ${escapeHtml(card.name)} card">${cardFace(card)}<span>View larger</span></button>`;
    } else if (card) {
      cardContent = `<button class="selected-card-back" data-remove-card="${card.id}" ${draft.status !== "selecting" ? "disabled" : ""} aria-label="${draft.status === "selecting" ? `Remove selected face-down card from ${position.label}` : `Selected face-down card in ${position.label}`} ">${cardBack()}${draft.status === "selecting" ? "<span>Remove</span>" : ""}</button>`;
    }
    return `<article class="reading-slot"><p>${position.label}</p>${cardContent}</article>`;
  }).join("")}</div>`;
}

// Mobile uses a grid; desktop reveals the overlapping semicircular arc.
function deckTemplate(draft, preferences) {
  const selected = new Set(draft.selectedCards.map((item) => item.cardId));
  const cardsHtml = draft.deckOrder.map((cardId, index) => `<button class="deck-card ${selected.has(cardId) ? "chosen" : ""}" style="--angle:${-30 + (60 * index / 77)}deg;--x:${-520 + (1040 * index / 77)}px;--y:${Math.abs(index - 38.5) * .92}px;--z:${index}" data-select-card="${cardId}" data-deck-index="${index}" ${selected.has(cardId) || draft.status !== "selecting" ? "disabled" : ""} aria-label="Face-down card ${index + 1} of 78">${cardBack()}</button>`).join("");
  return `<section class="deck-area ${preferences.deckLayout === "grid" ? "force-grid" : ""}" aria-labelledby="deck-title"><div class="deck-title"><span>✦</span><h2 id="deck-title">The waiting deck</h2><span>✦</span></div><div class="arc-deck">${cardsHtml}</div><div class="grid-deck">${cardsHtml}</div><div class="deck-footer"><p>Each card can be chosen once.</p><button class="text-button" data-action="reset-draft">Shuffle / Start over</button></div></section>`;
}

// Dashboard renders selection, locked-topic, and scanning states.
export function dashboardTemplate(user, draft, preferences) {
  const scanning = draft.status === "scanning";
  return `${headerTemplate(user, "dashboard")}<section class="dashboard ${scanning ? "scanning" : ""}"><div class="page-heading"><div><p class="eyebrow">Your three-card journey</p><h1>${scanning ? "Reading the paths…" : "Choose three cards"}</h1><p>${scanning ? "Your chosen cards remain before you while the chronicle is composed." : "Trust your attention. Select one card for each place on the road."}</p></div><strong>${draft.selectedCards.length}<span> of 3</span></strong></div>${slotsTemplate(draft)}${draft.status === "topic_selection" ? `<div class="topic-reminder"><p>Your three cards are locked and ready.</p><button class="button primary" data-action="open-topic">Choose reading topic</button></div>` : ""}${scanning ? `<div class="scan-panel" role="status"><span>✦</span><p id="scan-status">Gathering the signs…</p><small>Your reading is created privately on this device</small></div>` : deckTemplate(draft, preferences)}</section>`;
}

// Topic choice is intentional and keyboard accessible.
export function topicModalTemplate() {
  return `<div class="modal-backdrop"><section class="topic-modal" role="dialog" aria-modal="true" aria-labelledby="topic-title"><button class="modal-close" data-action="close-topic" aria-label="Close topic selection">×</button><p class="eyebrow">The cards are chosen</p><h2 id="topic-title">Choose the path of your reading</h2><p>Your intention gives the three cards a lens. No topic is selected for you.</p><div class="topic-options"><button data-topic="love"><span>♡</span><strong>Love Reading</strong><small>Bonds, care, and honest connection</small></button><button data-topic="finance"><span>◇</span><strong>Finance Reading</strong><small>Work, resources, and grounded choices</small></button><button data-topic="general"><span>✦</span><strong>General Reading</strong><small>The wider road and what asks attention</small></button></div><button class="text-button" data-action="change-cards">Change cards</button></section></div>`;
}

// Enlarged card artwork helps users inspect fine illustration details.
export function cardPreviewTemplate(card) {
  return `<div class="modal-backdrop card-preview-backdrop"><section class="card-preview" role="dialog" aria-modal="true" aria-labelledby="preview-title"><button class="modal-close" data-action="close-card-preview" aria-label="Close enlarged card">×</button><p class="eyebrow">Enlarged card view</p><h2 id="preview-title">${escapeHtml(card.name)}</h2><img src="${card.imageSrc}" alt="${escapeHtml(card.imageAlt)}"><p>${escapeHtml(card.uprightMeaning)}</p></section></div>`;
}

// The completed reading keeps interpretation sections clear and scannable.
export function summaryTemplate(user, reading) {
  const text = reading.interpretation;
  return `${headerTemplate(user, "summary")}<section class="summary-page"><div class="section-heading"><p class="eyebrow">${topicLabels[reading.topic]} · ${formatDate(reading.completedAt)}</p><h1>${escapeHtml(text.title)}</h1><p>Tap any card to inspect the full artwork.</p></div><div class="summary-cards">${reading.cards.map((selected, index) => { const card = getCard(selected.cardId); return `<article><span>${positions[index].label}</span><button data-enlarge-card="${card.id}" aria-label="View enlarged ${escapeHtml(card.name)} card">${cardFace(card)}</button><strong>${escapeHtml(card.name)}</strong></article>`; }).join("")}</div><article class="reading-scroll"><section class="overview"><p class="eyebrow">The shape of your reading</p><h2>Overview</h2><p class="lead">${escapeHtml(text.overview)}</p></section><div class="insight-grid">${text.cardInsights.map((insight) => { const card = getCard(insight.cardId); return `<section><span>${escapeHtml(insight.heading)}</span><h2>${escapeHtml(card.name)}</h2>${insight.role ? `<p class="insight-role">${escapeHtml(insight.role)}</p>` : ""}${insight.symbolism ? `<p>${escapeHtml(insight.symbolism)}</p>` : ""}<p>${escapeHtml(insight.interpretation)}</p></section>`; }).join("")}</div>${text.patternAnalysis ? `<section class="pattern-analysis"><p class="eyebrow">What repeats across the spread</p><h2>Patterns and Emphasis</h2><p>${escapeHtml(text.patternAnalysis)}</p></section>` : ""}<section class="synthesis"><p class="eyebrow">The thread between them</p><h2>A Chronicle of the Three Roads</h2><p>${escapeHtml(text.synthesis)}</p></section>${text.guidance ? `<section class="guidance"><h2>Grounded next steps</h2><ol>${text.guidance.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol></section>` : ""}<section class="reflection"><h2>Questions for your journey</h2><ol>${text.reflections.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol></section><p class="disclaimer">${escapeHtml(text.disclaimer)}</p></article><div class="page-actions"><button class="button primary" data-action="new-reading">Start a new reading</button><button class="button secondary" data-view="dashboard">Back to dashboard</button><button class="text-button" data-view="history">View history</button><button class="text-button" data-action="copy-reading">Copy as text</button><button class="text-button" data-action="download-reading">Download JSON</button></div></section>`;
}

// History only receives readings belonging to the active account.
export function historyTemplate(user, readings) {
  return `${headerTemplate(user, "history")}<section class="content-page"><div class="section-heading"><p class="eyebrow">Your private archive</p><h1>Reading History</h1><p>Stored only in this browser, newest first.</p></div>${readings.length ? `<div class="history-list">${readings.map((reading) => `<article class="history-item"><button data-open-reading="${reading.id}"><span><time>${formatDate(reading.completedAt)}</time><em>${topicLabels[reading.topic]}</em></span><h2>${escapeHtml(reading.interpretation.title)}</h2><p>${reading.cards.map((item) => escapeHtml(getCard(item.cardId).name)).join(" · ")}</p></button><button class="delete" data-delete-reading="${reading.id}" aria-label="Delete this reading">×</button></article>`).join("")}</div><button class="text-button danger" data-action="clear-history">Clear all history</button>` : `<div class="empty-state"><span>✦</span><h2>No chronicles yet</h2><p>Your completed readings will appear here.</p><button class="button primary" data-view="dashboard">Begin a reading</button></div>`}</section>`;
}

// Preferences and privacy controls remain device-local.
export function preferencesTemplate(user, preferences) {
  return `${headerTemplate(user, "preferences")}<section class="content-page"><div class="section-heading"><p class="eyebrow">Make the ritual yours</p><h1>Preferences</h1><p>These settings apply only to this browser.</p></div><form id="preferences-form" class="settings-card"><label>Display name<input name="displayName" minlength="2" maxlength="40" value="${escapeHtml(user.displayName)}" required></label><label>Avatar<select name="avatar">${Object.entries(avatars).map(([value, icon]) => `<option value="${value}" ${user.avatar?.value === value ? "selected" : ""}>${icon} ${value}</option>`).join("")}</select></label><label>Motion<select name="motion"><option value="system" ${preferences.motion === "system" ? "selected" : ""}>Use system setting</option><option value="reduce" ${preferences.motion === "reduce" ? "selected" : ""}>Reduce motion</option><option value="full" ${preferences.motion === "full" ? "selected" : ""}>Full motion</option></select></label><label>Deck display<select name="deckLayout"><option value="auto" ${preferences.deckLayout === "auto" ? "selected" : ""}>Automatic</option><option value="arc" ${preferences.deckLayout === "arc" ? "selected" : ""}>Arc on desktop</option><option value="grid" ${preferences.deckLayout === "grid" ? "selected" : ""}>Always use grid</option></select></label><label class="check"><input type="checkbox" name="soundEnabled" ${preferences.soundEnabled ? "checked" : ""}> Enable gentle sounds <small>(off by default)</small></label><button class="button primary" type="submit">Save preferences</button></form><section class="data-card"><h2>Your local data</h2><p>Clearing site data, changing devices, or using some private modes can remove accounts and readings.</p><div><button class="button secondary" data-action="export-data">Export my local data</button><button class="text-button danger" data-action="delete-data">Delete my local data</button></div></section></section>`;
}

// A plain-text version supports copy without exposing HTML.
export function readingAsText(reading) {
  const lines = [reading.interpretation.title, formatDate(reading.completedAt), "", reading.interpretation.overview, ""];
  reading.interpretation.cardInsights.forEach((insight) => lines.push(`${insight.heading}: ${getCard(insight.cardId).name}`, insight.role || "", insight.symbolism || "", insight.interpretation, ""));
  if (reading.interpretation.patternAnalysis) lines.push("Patterns and emphasis", reading.interpretation.patternAnalysis, "");
  lines.push("Synthesis", reading.interpretation.synthesis, "");
  if (reading.interpretation.guidance) lines.push("Grounded next steps", ...reading.interpretation.guidance.map((item) => `- ${item}`), "");
  lines.push("Reflection prompts", ...reading.interpretation.reflections.map((item) => `- ${item}`), "", reading.interpretation.disclaimer);
  return lines.join("\n");
}
