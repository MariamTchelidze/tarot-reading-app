const PASSWORD_ITERATIONS = 210000;

// Convert cryptographic bytes to browser-storage-friendly text.
function toBase64(bytes) { return btoa(String.fromCharCode(...bytes)); }
function fromBase64(value) { return Uint8Array.from(atob(value), (character) => character.charCodeAt(0)); }

// Hash passwords with Web Crypto; raw passwords are never persisted.
async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: fromBase64(salt), iterations: PASSWORD_ITERATIONS }, key, 256);
  return toBase64(new Uint8Array(bits));
}

export function normalizeEmail(email) { return email.trim().toLowerCase(); }

export function defaultPreferences() {
  return { theme: "middle-earth", motion: "system", soundEnabled: false, deckLayout: "auto", enhancedGenerationEnabled: false, analyticsConsent: false, updatedAt: new Date().toISOString() };
}

// Validate registration and create a browser-only account.
export async function registerUser(state, values) {
  const displayName = values.displayName.trim();
  const emailNormalized = normalizeEmail(values.email);
  if (displayName.length < 2 || displayName.length > 40) throw new Error("Display name must be between 2 and 40 characters.");
  if (!/^\S+@\S+\.\S+$/.test(emailNormalized)) throw new Error("Enter a valid email address.");
  if (values.password.length < 10) throw new Error("Choose a password with at least 10 characters.");
  if (values.password !== values.confirmPassword) throw new Error("The passwords do not match.");
  if (Object.values(state.users).some((user) => user.emailNormalized === emailNormalized)) throw new Error("An account with this email already exists in this browser.");

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const passwordSalt = toBase64(crypto.getRandomValues(new Uint8Array(16)));
  const user = { id, emailNormalized, displayName, passwordHash: await hashPassword(values.password, passwordSalt), passwordSalt, passwordIterations: PASSWORD_ITERATIONS, passwordDigest: "SHA-256", avatar: { type: "preset", value: values.avatar || "leaf" }, createdAt: now, updatedAt: now, lastLoginAt: now };
  state.users[id] = user;
  state.session = { userId: id, issuedAt: now, lastActiveAt: now };
  state.preferencesByUser[id] = defaultPreferences();
  state.readingsByUser[id] = [];
  state.draftsByUser[id] = null;
  return user;
}

// Use one generic message so login never reveals whether an email exists.
export async function loginUser(state, email, password) {
  const emailNormalized = normalizeEmail(email);
  const user = Object.values(state.users).find((item) => item.emailNormalized === emailNormalized);
  if (!user || await hashPassword(password, user.passwordSalt) !== user.passwordHash) throw new Error("Email or password is incorrect.");
  const now = new Date().toISOString();
  user.lastLoginAt = now;
  state.session = { userId: user.id, issuedAt: now, lastActiveAt: now };
  return user;
}
