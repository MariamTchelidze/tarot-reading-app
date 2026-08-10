export const STORAGE_KEY = "middleEarthReading:v1";

// Create the complete version-one state in one predictable place.
export function createEmptyState() {
  const now = new Date().toISOString();
  return { schemaVersion: 1, users: {}, session: null, preferencesByUser: {}, readingsByUser: {}, draftsByUser: {}, meta: { createdAt: now, updatedAt: now } };
}

// Check the basic persisted shape before trusting browser data.
function isValidState(value) {
  return value?.schemaVersion === 1 && typeof value.users === "object" && typeof value.readingsByUser === "object" && typeof value.draftsByUser === "object";
}

// Fall back to memory when localStorage is unavailable or malformed.
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { state: createEmptyState(), warning: "" };
    const parsed = JSON.parse(raw);
    if (!isValidState(parsed)) throw new Error("Invalid local data");
    return { state: parsed, warning: "" };
  } catch {
    return { state: createEmptyState(), warning: "Saved local data could not be read. A fresh in-memory chronicle was opened." };
  }
}

// Write one atomic state object and report quota or privacy-mode failures.
export function saveState(state) {
  const next = { ...state, meta: { ...state.meta, updatedAt: new Date().toISOString() } };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return { state: next, error: "" };
  } catch {
    return { state: next, error: "This browser could not save the latest change. Keep this tab open and export important readings." };
  }
}

// Remove only this application's storage key.
export function deleteLocalState() { localStorage.removeItem(STORAGE_KEY); }
export function exportableState(state) { return JSON.stringify(state, null, 2); }
