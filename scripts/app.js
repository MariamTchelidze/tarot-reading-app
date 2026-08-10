import { getCard } from "./data/cards.js";
import { registerUser, loginUser, defaultPreferences } from "./services/auth.js";
import { createDraft, selectCard, removeCard, unlockDraft } from "./services/reading.js";
import { completeReading } from "./services/interpretation.js";
import { loadState, saveState, deleteLocalState, exportableState, STORAGE_KEY } from "./services/storage.js";
import { createFocusTrap, downloadFile } from "./utils/dom.js";
import { authTemplate, dashboardTemplate, topicModalTemplate, cardPreviewTemplate, summaryTemplate, historyTemplate, preferencesTemplate, readingAsText } from "./views/templates.js";

export class TarotApp {
  constructor(root) {
    this.root = root;
    const loaded = loadState();
    this.state = loaded.state;
    this.notice = loaded.warning;
    this.authMode = "login";
    // Form values live only in memory so validation errors do not clear inputs.
    this.authValues = {
      login: { email: "", password: "" },
      register: { displayName: "", email: "", password: "", confirmPassword: "", avatar: "leaf" },
    };
    this.view = "dashboard";
    this.currentReadingId = null;
    this.releaseFocusTrap = null;
    this.generationToken = null;
  }

  // Add shared event listeners once, then restore the saved view.
  start() {
    this.root.addEventListener("click", (event) => this.handleClick(event));
    this.root.addEventListener("submit", (event) => this.handleSubmit(event));
    this.root.addEventListener("error", (event) => this.handleImageError(event), true);
    window.addEventListener("storage", (event) => this.handleStorageChange(event));
    this.render();
    const draft = this.getDraft();
    if (draft?.status === "scanning") this.generateReading(draft);
  }

  getUser() { return this.state.session ? this.state.users[this.state.session.userId] || null : null; }
  getDraft() { const user = this.getUser(); return user ? this.state.draftsByUser[user.id] || null : null; }
  getPreferences() { const user = this.getUser(); return user ? this.state.preferencesByUser[user.id] || defaultPreferences() : defaultPreferences(); }
  getReadings() { const user = this.getUser(); return user ? this.state.readingsByUser[user.id] || [] : []; }

  // Save after each domain transition and retain a useful browser error.
  persist(message = "") {
    const result = saveState(this.state);
    this.state = result.state;
    this.notice = result.error || message;
  }

  // Render only the active view; the app remains a single HTML page.
  render() {
    this.releaseFocusTrap?.();
    this.releaseFocusTrap = null;
    const user = this.getUser();
    if (!user) {
      this.root.innerHTML = `${authTemplate(this.authMode, this.notice, this.authValues[this.authMode])}<div id="live-region" class="sr-only" aria-live="polite"></div>`;
      this.root.querySelector(".form-message")?.focus();
      return;
    }

    document.documentElement.dataset.motion = this.getPreferences().motion;
    let page = "";
    if (this.view === "history") page = historyTemplate(user, this.getReadings());
    else if (this.view === "preferences") page = preferencesTemplate(user, this.getPreferences());
    else if (this.view === "summary") {
      const reading = this.getReadings().find((item) => item.id === this.currentReadingId);
      if (reading) page = summaryTemplate(user, reading);
      else this.view = "dashboard";
    }

    if (!page) {
      let draft = this.getDraft();
      if (!draft) { draft = createDraft(user.id); this.state.draftsByUser[user.id] = draft; this.persist(); }
      page = dashboardTemplate(user, draft, this.getPreferences());
    }

    this.root.innerHTML = `${page}<div id="live-region" class="sr-only" aria-live="polite"></div>`;
    const draft = this.getDraft();
    if (this.view === "dashboard" && draft?.status === "topic_selection") this.openTopicModal();
    if (this.notice) { const message = this.notice; this.notice = ""; this.announce(message); }
  }

  // Route each data attribute to one small action.
  handleClick(event) {
    const target = event.target.closest("button");
    if (!target) return;
    if (target.dataset.authMode) {
      this.captureAuthForm();
      this.authMode = target.dataset.authMode;
      this.notice = "";
      this.render();
      return;
    }
    if (target.matches("[data-password-toggle]")) {
      const input = target.closest("label").querySelector("input");
      const showing = input.type === "text";
      input.type = showing ? "password" : "text";
      target.textContent = showing ? "Show" : "Hide";
      target.setAttribute("aria-label", showing ? "Show password" : "Hide password");
      return;
    }
    if (target.dataset.view) { this.view = target.dataset.view; this.currentReadingId = null; this.render(); return; }
    if (target.dataset.selectCard) return this.chooseCard(target);
    if (target.dataset.removeCard) return this.unchooseCard(target.dataset.removeCard);
    if (target.dataset.enlargeCard) return this.openCardPreview(target.dataset.enlargeCard);
    if (target.dataset.topic) return this.chooseTopic(target.dataset.topic);
    if (target.dataset.openReading) return this.openReading(target.dataset.openReading);
    if (target.dataset.deleteReading) return this.deleteReading(target.dataset.deleteReading);

    const actions = {
      "sign-out": () => this.signOut(), "reset-draft": () => this.resetDraft(), "open-topic": () => this.openTopicModal(),
      "close-topic": () => this.closeTopicModal(), "close-card-preview": () => this.closeCardPreview(), "change-cards": () => this.changeCards(), "new-reading": () => this.startNewReading(),
      "clear-history": () => this.clearHistory(), "copy-reading": () => this.copyReading(), "download-reading": () => this.downloadReading(),
      "export-data": () => this.exportData(), "delete-data": () => this.deleteData(),
    };
    actions[target.dataset.action]?.();
  }

  async handleSubmit(event) {
    event.preventDefault();
    if (event.target.id === "auth-form") await this.submitAuth(event.target);
    if (event.target.id === "preferences-form") this.savePreferences(event.target);
  }

  // Hide a broken image so its styled fallback remains visible.
  handleImageError(event) { if (event.target.matches(".card-face img, .card-back img")) event.target.hidden = true; }

  async submitAuth(form) {
    form.querySelector("button[type='submit']").disabled = true;
    const values = Object.fromEntries(new FormData(form));
    // Save values before validation so a re-render can restore every field.
    this.authValues[this.authMode] = { ...this.authValues[this.authMode], ...values };
    try {
      if (this.authMode === "register") await registerUser(this.state, values);
      else await loginUser(this.state, values.email || "", values.password || "");
      this.notice = "";
      this.view = "dashboard";
      // Clear passwords from memory as soon as authentication succeeds.
      this.authValues.login = { email: "", password: "" };
      this.authValues.register = { displayName: "", email: "", password: "", confirmPassword: "", avatar: "leaf" };
      this.persist();
    } catch (error) { this.notice = error.message || "Something went wrong. Please try again."; }
    this.render();
  }

  // Preserve the visible form when the user switches between auth tabs.
  captureAuthForm() {
    const form = this.root.querySelector("#auth-form");
    if (!form) return;
    const values = Object.fromEntries(new FormData(form));
    this.authValues[this.authMode] = { ...this.authValues[this.authMode], ...values };
  }

  signOut() { this.state.session = null; this.currentReadingId = null; this.view = "dashboard"; this.persist("You signed out. Your local readings remain on this device."); this.render(); }

  chooseCard(button) {
    const draft = this.getDraft();
    if (!draft || draft.status !== "selecting") { this.announce("Three cards are already selected."); return; }
    if (!selectCard(draft, button.dataset.selectCard, Number(button.dataset.deckIndex))) return;
    const selected = draft.selectedCards.at(-1);
    const card = getCard(selected.cardId);
    this.persist();
    this.render();
    this.announce(`${card.name} selected for ${selected.position}. ${draft.selectedCards.length} of 3 cards selected.`);
  }

  unchooseCard(cardId) {
    const draft = this.getDraft();
    if (!draft || !removeCard(draft, cardId)) return;
    this.persist(`${getCard(cardId).name} returned to the deck.`);
    this.render();
  }

  resetDraft() {
    const user = this.getUser();
    const draft = this.getDraft();
    if (!user || (draft?.selectedCards.length && !confirm("Shuffle and clear the selected cards?"))) return;
    this.state.draftsByUser[user.id] = createDraft(user.id);
    this.persist("The deck was shuffled for a new journey.");
    this.render();
  }

  openTopicModal() {
    if (this.root.querySelector(".modal-backdrop")) return;
    this.root.insertAdjacentHTML("beforeend", topicModalTemplate());
    this.releaseFocusTrap = createFocusTrap(this.root.querySelector(".topic-modal"), () => this.closeTopicModal());
  }

  closeTopicModal() { this.releaseFocusTrap?.(); this.releaseFocusTrap = null; this.root.querySelector(".modal-backdrop")?.remove(); this.announce("Topic selection closed. Your three cards remain locked."); }
  changeCards() { const draft = this.getDraft(); if (!draft) return; unlockDraft(draft); this.persist("Your cards are unlocked and can be changed."); this.render(); }

  // Let users inspect detailed card artwork without leaving the reading.
  openCardPreview(cardId) {
    const card = getCard(cardId);
    if (!card || this.root.querySelector(".modal-backdrop")) return;
    this.root.insertAdjacentHTML("beforeend", cardPreviewTemplate(card));
    this.releaseFocusTrap = createFocusTrap(this.root.querySelector(".card-preview"), () => this.closeCardPreview());
  }

  closeCardPreview() {
    this.releaseFocusTrap?.();
    this.releaseFocusTrap = null;
    this.root.querySelector(".card-preview-backdrop")?.remove();
  }

  chooseTopic(topic) {
    const draft = this.getDraft();
    if (!draft || draft.status !== "topic_selection" || draft.selectedCards.length !== 3) return;
    draft.topic = topic;
    draft.status = "scanning";
    draft.generationRequestId = crypto.randomUUID();
    draft.updatedAt = new Date().toISOString();
    this.persist();
    this.render();
    this.generateReading(draft);
  }

  // Show a truthful indeterminate sequence for at least 1.2 seconds.
  generateReading(draft) {
    if (this.generationToken === draft.generationRequestId) return;
    this.generationToken = draft.generationRequestId || crypto.randomUUID();
    draft.generationRequestId = this.generationToken;
    const statuses = ["Gathering the signs…", "Tracing the three paths…", "Composing your chronicle…"];
    let index = 0;
    const statusTimer = window.setInterval(() => { index = Math.min(index + 1, 2); const status = document.querySelector("#scan-status"); if (status) status.textContent = statuses[index]; }, 650);
    window.setTimeout(() => {
      window.clearInterval(statusTimer);
      const user = this.getUser();
      const activeDraft = this.getDraft();
      if (!user || !activeDraft || activeDraft.id !== draft.id || activeDraft.status !== "scanning") return;
      const reading = completeReading(activeDraft);
      const readings = this.state.readingsByUser[user.id] || [];
      if (!readings.some((item) => item.id === reading.id)) readings.unshift(reading);
      this.state.readingsByUser[user.id] = readings;
      this.state.draftsByUser[user.id] = null;
      this.currentReadingId = reading.id;
      this.view = "summary";
      this.generationToken = null;
      this.persist("Your chronicle is ready and saved locally.");
      this.render();
    }, 2100);
  }

  startNewReading() { const user = this.getUser(); if (!user) return; this.state.draftsByUser[user.id] = createDraft(user.id); this.currentReadingId = null; this.view = "dashboard"; this.persist(); this.render(); }
  openReading(id) { this.currentReadingId = id; this.view = "summary"; this.render(); }

  deleteReading(id) {
    const user = this.getUser();
    if (!user || !confirm("Delete this reading from local history?")) return;
    this.state.readingsByUser[user.id] = this.getReadings().filter((item) => item.id !== id);
    this.persist("The reading was removed from this device.");
    this.render();
  }

  clearHistory() {
    const user = this.getUser();
    if (!user || !confirm(`Clear all reading history for ${user.displayName}? This cannot be undone.`)) return;
    this.state.readingsByUser[user.id] = [];
    this.persist("All reading history for this account was removed.");
    this.render();
  }

  currentReading() { return this.getReadings().find((item) => item.id === this.currentReadingId); }
  async copyReading() { const reading = this.currentReading(); if (!reading) return; try { await navigator.clipboard.writeText(readingAsText(reading)); this.announce("Reading copied as text."); } catch { this.announce("The browser could not copy this reading. Download it instead."); } }
  downloadReading() { const reading = this.currentReading(); if (reading) downloadFile(`reading-${reading.id}.json`, JSON.stringify(reading, null, 2)); }

  savePreferences(form) {
    const user = this.getUser();
    const values = new FormData(form);
    const displayName = String(values.get("displayName") || "").trim();
    if (!user || displayName.length < 2 || displayName.length > 40) { this.announce("Display name must be between 2 and 40 characters."); return; }
    user.displayName = displayName;
    user.avatar = { type: "preset", value: values.get("avatar") };
    this.state.preferencesByUser[user.id] = { ...this.getPreferences(), motion: values.get("motion"), deckLayout: values.get("deckLayout"), soundEnabled: values.has("soundEnabled"), updatedAt: new Date().toISOString() };
    this.persist("Preferences saved on this device.");
    this.render();
  }

  exportData() { downloadFile("middle-earth-reading-data.json", exportableState(this.state)); this.announce("Your local data export is ready."); }
  deleteData() { if (!confirm("Delete every account, preference, draft, and reading from this browser?")) return; deleteLocalState(); this.state = loadState().state; this.authMode = "register"; this.notice = "All app data was removed from this browser."; this.render(); }

  // Announcements work for screen readers and sighted users.
  announce(message) {
    const live = this.root.querySelector("#live-region");
    if (live) live.textContent = message;
    let toast = this.root.querySelector(".toast");
    if (!toast) { toast = document.createElement("div"); toast.className = "toast"; toast.setAttribute("aria-hidden", "true"); this.root.append(toast); }
    toast.textContent = message;
    toast.classList.remove("visible");
    requestAnimationFrame(() => toast.classList.add("visible"));
    window.setTimeout(() => toast?.classList.remove("visible"), 3200);
  }

  // Keep login and history changes in sync across browser tabs.
  handleStorageChange(event) { if (event.key !== STORAGE_KEY) return; this.state = loadState().state; if (!this.getUser()) this.notice = "Local account data changed in another tab."; this.render(); }
}
