# Product Requirements Document: Middle-earth Reading

| Document field   | Value                              |
| ---------------- | ---------------------------------- |
| Product          | Middle-earth Tarot Reading         |
| Product type     | Responsive web application         |
| Status           | Build-ready v1 specification       |
| Primary platform | Modern desktop and mobile browsers |
| Product owner    | TBD                                |
| Last updated     | 2026-08-10                         |

## 1. Executive Summary

Middle-earth Reading is a personalized, Lord of the Rings-inspired tarot experience. After registering or signing in, a user selects exactly three cards from an immersive arc-shaped deck of 78 custom cards, chooses a reading topic—Love, Finance, or General—and receives a cohesive English interpretation framed as a journey through Middle-earth.

The product emphasizes atmosphere, clarity, and immediacy. Its visual language uses deep forest greens, rich golds, parchment whites, midnight blues, elegant serif typography, subtle motion, and restrained storybook effects. The application is local-first: user accounts, session state, preferences, in-progress selections, and reading history are stored exclusively in the browser's `localStorage` for v1.

### 1.1 Product vision

Create a private, memorable tarot ritual that feels like consulting an ancient Middle-earth chronicle while remaining understandable, responsive, and easy to use.

### 1.2 Product goals

1. Let a first-time user register and begin a reading in under two minutes.
2. Make selecting three cards from a 78-card arc feel tactile, deliberate, and accessible.
3. Generate an interpretation that is specific to the selected cards and topic rather than generic filler.
4. Preserve the user's session, unfinished reading, preferences, and completed reading history across refreshes and browser restarts.
5. Deliver a polished responsive experience without requiring a database in v1.

### 1.3 Success metrics

Because v1 is local-first, analytics must be opt-in and must not contain card questions, reading text, credentials, or other personal content.

| Metric                                                    |               Initial target |
| --------------------------------------------------------- | ---------------------------: |
| Registration completion rate                              |                        ≥ 80% |
| Started-to-completed reading conversion                   |                        ≥ 70% |
| Median time from dashboard entry to three cards selected  |                30–90 seconds |
| Interpretation generation success rate                    | ≥ 99% with fallback included |
| Unhandled client error rate                               |           < 0.5% of sessions |
| WCAG automated critical violations                        |              0 on core views |
| Returning users who view history or start another reading |                        ≥ 25% |

### 1.4 Non-goals for v1

- Cloud account synchronization or cross-device history.
- Social feeds, public sharing, comments, or multiplayer readings.
- Payments, subscriptions, or marketplace functionality.
- Medical, legal, investment, or crisis advice.
- More than one active local session per browser profile.
- User-uploaded card decks or custom reading spreads.

### 1.5 Audience and primary jobs

**Curious newcomer:** Wants an approachable reading and needs clear interaction guidance.

**Tarot enthusiast:** Expects card-specific symbolism, a coherent three-card narrative, and saved history.

**LOTR enthusiast:** Values world-inspired language and visual immersion but should not need tarot expertise.

### 1.6 Product principles

- **A ritual, not a slot machine:** Motion is considered and calm; it must never feel like gambling.
- **Specific but responsible:** Interpretations should connect card meanings, positions, and topic while avoiding claims of certainty.
- **Private by default:** Sensitive reading content remains in the user's browser unless the user knowingly invokes an external generation service.
- **Atmosphere supports usability:** Decorative effects never obscure labels, focus states, contrast, or navigation.

### 1.7 IP and content readiness requirement

Before public release, the product owner must confirm rights to use the LOTR name, characters, locations, quotations, visual likenesses, and all 79 supplied assets. If rights are not secured, the release must use an original high-fantasy identity and original lore rather than protected names or imagery. This is a launch gate, not an optional polish item.

## 2. Scope and Functional Requirements

### 2.1 Authentication

The app has two top-level states:

- **Unauthenticated:** The user sees Login/Register only.
- **Authenticated:** The user sees the persistent profile header and can access the dashboard, reading flow, summary, preferences, and history.

#### Registration requirements

- Fields: display name, email, password, confirm password, optional avatar choice.
- Normalize email with `trim().toLowerCase()` before uniqueness checks.
- Display name: 2–40 visible characters.
- Email: syntactically valid and unique within this browser profile.
- Password: minimum 10 characters; encourage a mix of character types without arbitrary maximums below 64 characters.
- Confirm password must match.
- On success, create the account, create an authenticated session, initialize preferences, and route to the dashboard.

#### Login requirements

- Fields: email and password.
- Show one generic invalid-credentials error; do not reveal whether an email exists.
- On success, store the active user's ID and session timestamps and route to the dashboard or recoverable in-progress reading.
- A refresh or browser restart retains the active session until explicit sign-out or local data removal.

#### Sign-out requirements

- Clear active session data and ephemeral UI state.
- Retain local accounts, preferences, and reading history.
- Return to Login/Register.

> **Security boundary:** A browser-only account system is a personalization gate, not strong authentication. Anyone with access to the browser profile or developer tools may inspect or change local data. Passwords must never be stored in plaintext; use Web Crypto PBKDF2 with a unique random salt per account and a documented iteration count. Even with hashing, this architecture is unsuitable for protecting high-value or regulated data.

### 2.2 Authenticated header

The header appears on every authenticated route and includes:

- Product wordmark/home link.
- User avatar with accessible alt text.
- Display name on medium and large screens.
- Reading History navigation.
- Preferences navigation or menu item.
- Dynamic authentication control: `Sign Out` when authenticated; `Login` only on unauthenticated shell variants.

On small screens, secondary controls may collapse into an accessible menu. Sign Out must remain at most two interactions away.

### 2.3 Reading dashboard

The main dashboard contains:

- A short instruction/status line, such as `Choose three cards for your journey.`
- Three ordered card holders at the top: **The Path Behind**, **The Present Road**, and **The Road Ahead**. These labels provide interpretive structure while remaining compatible with every topic.
- A reset/new-selection action.
- A responsive deck selector containing all 78 face-down cards arranged in a stylized semicircular arc on wide screens.
- A visible selection counter: `0 of 3`, `1 of 3`, etc.
- An accessible non-arc alternative (grid/list) on narrow screens and for reduced-motion or assistive modes.

### 2.4 Card selection mechanics

- At the start of a reading, all 78 cards are available and face down, using the supplied general card-back asset.
- The deck order is shuffled once per new draft using `crypto.getRandomValues`; the order is persisted with the draft so refresh does not reshuffle it.
- Selecting a card animates it from the deck to the next available holder, reveals its face, and marks its deck position unavailable.
- Selection order determines reading position.
- A user can unselect a chosen card before the third card is locked. Removing the middle card compacts the later selection left so positions always reflect selection order.
- Exactly three unique card IDs are required.
- Once the third card's placement animation completes, selection becomes locked and the Topic Selection modal opens automatically.
- Clicking additional deck cards while locked does nothing and announces `Three cards already selected.` to screen readers.
- Closing the topic modal returns to the locked three-card state; the user can choose `Change cards` to unlock and edit the selection.

### 2.5 Topic selection modal

The modal must:

- Open automatically after three cards are locked.
- Include a heading and brief explanation.
- Present three equally prominent options: **Love Reading**, **Finance Reading**, and **General Reading**.
- Include `Change cards` and close controls.
- Trap keyboard focus, set initial focus to the heading or first option, close on `Escape`, restore focus to the triggering context, and prevent background interaction.
- Avoid preselecting a topic; the selection must be intentional.

Topic choice transitions the draft to `scanning` and begins interpretation generation.

### 2.6 Scan/loading experience

- Show all three revealed cards throughout generation.
- Display an atmospheric but truthful progress sequence, for example:
  1. `Gathering the signs…`
  2. `Tracing the three paths…`
  3. `Composing your chronicle…`
- Use a determinate indicator only if actual progress is measurable; otherwise use an indeterminate indicator and rotating status copy.
- Minimum visible duration: 1.2 seconds to avoid a visual flash.
- Recommended timeout: 15 seconds for remote generation, followed by retry/fallback options.
- Respect `prefers-reduced-motion` by replacing scanning sweeps and card motion with fades or static state changes.

### 2.7 Summary generation and content contract

Every interpretation must be in English and include:

- Reading topic and creation date.
- The three cards in positional order, with card name and concise role-specific meaning.
- A cohesive synthesis connecting all three cards rather than three unrelated definitions.
- A subtle Middle-earth narrative backdrop.
- Two or three reflective prompts or practical, non-prescriptive next steps.
- A disclaimer: the reading is for reflection and entertainment, not professional advice or a prediction of guaranteed outcomes.

Tone must be warm, grounded, imaginative, and non-deterministic. Avoid invented Tolkien quotations and avoid mimicking a living author's prose too closely. Finance readings must not tell a user to buy, sell, borrow, or make a specific investment. Love readings must not assert another person's hidden thoughts or consent. General readings must not make medical, legal, or safety claims.

#### Generation architecture decision

The persistence rule and AI requirement are compatible if persistence and generation are separated:

- **Required local mode:** A deterministic on-device interpretation engine composes text from reviewed card metadata, position templates, topic lenses, and synthesis rules. It requires no network and is the privacy-preserving fallback.
- **Optional enhanced mode:** A stateless server-side generation proxy may call an AI model. No API key may be shipped to the browser. The proxy receives only the three card IDs/names, positions, topic, locale, and a random request ID; it must not persist prompts or outputs in application storage. The completed output is saved to `localStorage` by the client.

If the product requirement is interpreted as strictly zero-backend, only local mode ships. A production API secret cannot be safely embedded in frontend code.

#### Generation output shape

The generator returns validated structured data, not raw HTML:

```ts
type Interpretation = {
  title: string;
  overview: string;
  cardInsights: Array<{
    cardId: string;
    position: "past" | "present" | "future";
    heading: string;
    interpretation: string;
  }>;
  synthesis: string;
  reflections: string[];
  disclaimer: string;
  generator: "local-v1" | "remote-v1";
  promptVersion?: string;
};
```

All strings are rendered as text. Never inject model output with `innerHTML`.

### 2.8 Summary view

The completed view includes:

- Topic, date, and interpretation title.
- The three card images and position labels.
- Overview, per-card insights, synthesis, reflection prompts, and disclaimer.
- `Start a New Reading` primary action.
- `Back to Dashboard` and `View History` secondary actions.
- Optional `Copy as Text` and `Download as JSON` actions. Sharing is excluded by default because readings may be sensitive.

A successful interpretation is saved automatically. A reading cannot be saved twice; use the reading ID as the idempotency key.

### 2.9 Reading history and preferences

Although not a separate visual requirement, history and preferences are required because the requested state must persist.

**History:** Reverse-chronological list filtered to the active user. Each row shows date, topic, and three card names. Users can open or individually delete a reading after confirmation. `Clear all history` requires an explicit confirmation that names the scope.

**Preferences:** Avatar, display name, reduced-motion override (`system`, `reduce`, `full`), sound (`off` by default), deck display (`arc`, `grid`, `auto`), and enhanced generation consent when available.

## 3. User Flows and Wireframe Descriptions

### 3.1 New user flow

`Open app → Register tab → Validate form → Create local account/session → Dashboard → Select 3 cards → Topic modal → Select topic → Scan/generate → Summary auto-saved → Start another reading or view history`

### 3.2 Returning user flow

`Open app → Restore valid local session → If recoverable draft exists, resume it; otherwise show Dashboard → Continue reading`

If no session exists, the app opens Login. A user can switch to Register without losing typed values in the current tab unless they leave the auth screen.

### 3.3 Login/Register wireframe

```text
┌─────────────────────────────────────────────────────────────────────┐
│ LEFT: atmospheric brand panel        │ RIGHT: parchment form panel │
│                                      │                              │
│ Welcome to                           │ [ Sign In ] [ Create Account]│
│ Middle-earth Reading                 │ Email                        │
│                                      │ [__________________________] │
│ A short invitation to begin          │ Password                     │
│ a three-card journey.                │ [__________________________] │
│                                      │ [ Continue                  ]│
│ restrained landscape / map texture   │ Local privacy explanation    │
└─────────────────────────────────────────────────────────────────────┘
```

- Desktop: 55/45 or 60/40 split, full viewport height, form width capped at approximately 480 px.
- Mobile: stacked layout; compact brand panel above the form. Never force a horizontal split below 768 px.
- Form errors appear beside their fields and in a focusable summary after submission.

### 3.4 Dashboard and arc selector wireframe

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Wordmark        History                         Avatar  Name Sign Out│
├─────────────────────────────────────────────────────────────────────┤
│ Choose three cards for your journey.                     2 of 3     │
│                                                                     │
│   [The Path Behind]    [The Present Road]    [The Road Ahead]       │
│       CARD FACE             CARD FACE             EMPTY             │
│                                                                     │
│                  face-down cards in a layered arc                   │
│        / / / / / / / / / / / / / / / / / / / / / / /             │
│                  [Shuffle / Start Over]                             │
└─────────────────────────────────────────────────────────────────────┘
```

The arc is a perspective effect, not a literal display of 78 full-width cards. Cards overlap with enough exposed area to remain individually targetable. Hover/focus raises a card, increases separation locally, and shows a gold focus ring. On touch devices, first tap selects directly; there is no hover-only information.

### 3.5 Topic modal wireframe

```text
             ┌──────────────────────────────────────┐
             │ Choose the path of your reading   ×  │
             │                                      │
             │ [ Love ]  [ Finance ]  [ General ]   │
             │                                      │
             │ Change cards                         │
             └──────────────────────────────────────┘
```

### 3.6 Scan and summary wireframes

```text
SCAN                                  SUMMARY
┌──────────────────────────────┐      ┌───────────────────────────────┐
│ [Card 1] [Card 2] [Card 3]   │      │ Love Reading · date           │
│                              │      │ [Card 1] [Card 2] [Card 3]    │
│ Gathering the signs…         │      │ Overview                      │
│       indeterminate rune     │      │ Card insights                 │
│                              │      │ Synthesis + reflections       │
│ [Cancel]                     │      │ [Start New] [View History]    │
└──────────────────────────────┘      └───────────────────────────────┘
```

Cancel returns to the locked selection and topic choice without writing a completed history entry.

## 4. Visual and Interaction Design Requirements

### 4.1 Design tokens

Final tokens should be verified against actual assets; suggested starting values are:

| Token         | Suggested value | Usage                         |
| ------------- | --------------- | ----------------------------- |
| Forest 900    | `#10251D`       | Main background               |
| Forest 700    | `#1D3A2D`       | Panels and elevated surfaces  |
| Gold 500      | `#C5A24A`       | Primary accent, borders       |
| Gold 300      | `#E0C878`       | Focus/hover accent            |
| Parchment 100 | `#F2E7CD`       | Primary text/light surfaces   |
| Parchment 300 | `#D9C9A6`       | Secondary text                |
| Midnight 950  | `#07111F`       | Deep overlays and modal scrim |
| Danger 400    | `#D8796F`       | Error states                  |

- Headings: an elegant, licensed serif family with robust Latin coverage.
- Body/UI: a highly legible serif or humanist sans serif. Do not use novelty fantasy fonts for form inputs or paragraphs.
- Use faint parchment grain, map lines, stars, embers, or leaf filigree as nonessential decoration.
- Minimum body text: 16 px; line height: 1.5 or greater.
- Minimum interactive target: 44 × 44 CSS px.

### 4.2 Asset contract

Create a manifest for all 78 cards rather than deriving meanings from filenames:

```ts
type TarotCard = {
  id: string;
  index: number; // 0–77, unique
  name: string;
  arcana: "major" | "minor";
  suit?: string;
  rank?: string;
  imageSrc: string;
  imageAlt: string;
  keywords: string[];
  uprightMeaning: string;
  topicMeanings: {
    love: string;
    finance: string;
    general: string;
  };
};
```

V1 readings use upright meanings only unless 78 reversed-card interpretations and a visible reversal treatment are supplied and approved. Every asset must be optimized (prefer AVIF/WebP where practical), have stable dimensions, and be preloaded only when needed. The single general background asset is used for all face-down cards.

## 5. Technical Architecture

### 5.1 Recommended stack

| Layer           | Recommendation                                                                     |
| --------------- | ---------------------------------------------------------------------------------- |
| Framework       | React 19 + TypeScript + Vite                                                       |
| Routing         | React Router                                                                       |
| State           | Zustand with a persistence adapter, or reducer/context for small scope             |
| Forms           | React Hook Form + Zod                                                              |
| Styling         | CSS Modules or Tailwind with centralized design tokens                             |
| Motion          | CSS transforms; optional Framer Motion with reduced-motion support                 |
| Testing         | Vitest, React Testing Library, Playwright, axe-core                                |
| Error reporting | Opt-in, redacted client telemetry only                                             |
| Hosting         | Static hosting/CDN; optional stateless serverless endpoint for enhanced generation |

Vue 3, Pinia, Vue Router, and equivalent testing tools are an acceptable alternative, but the team must choose one framework before implementation and not mix component models.

### 5.2 Application layers

```text
UI components
    ↓
Reading/Auth domain services
    ↓
State store + schema validation
    ↓
Versioned localStorage repository

Interpretation service
    ├── Local reviewed composition engine (required)
    └── Stateless AI proxy (optional, consent-gated)
```

Business rules—three unique cards, allowed status transitions, user ownership, output validation—belong in domain services, not presentation components.

### 5.3 State machine

The reading flow is modeled explicitly:

```text
idle → selecting → topic_selection → scanning → completed
          ↑              │              │
          └─ change ─────┘              ├─ generation_error → scanning (retry)
                                        └─ cancel → topic_selection
```

Invalid transitions are rejected and logged locally in development. Persist after every valid domain transition, not on animation frames.

## 6. localStorage Data Design

### 6.1 Storage strategy

Use one versioned root key to support atomic validation and migration:

`middleEarthReading:v1`

```ts
type PersistedAppStateV1 = {
  schemaVersion: 1;
  users: Record<string, LocalUser>;
  session: LocalSession | null;
  preferencesByUser: Record<string, UserPreferences>;
  readingsByUser: Record<string, Reading[]>;
  draftsByUser: Record<string, ReadingDraft | null>;
  meta: {
    createdAt: string;
    updatedAt: string;
    lastMigrationAt?: string;
  };
};
```

All dates are ISO 8601 UTC strings. IDs are UUIDs from `crypto.randomUUID()`.

### 6.2 User model

```ts
type LocalUser = {
  id: string;
  emailNormalized: string;
  displayName: string;
  passwordHash: string; // encoded PBKDF2 result
  passwordSalt: string; // cryptographically random, encoded
  passwordIterations: number;
  passwordDigest: "SHA-256";
  avatar: {
    type: "preset" | "initials";
    value: string;
  };
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
};

type LocalSession = {
  userId: string;
  issuedAt: string;
  lastActiveAt: string;
};
```

Do not store raw passwords, password hints, security answers, or remote API keys.

### 6.3 Preferences model

```ts
type UserPreferences = {
  theme: "middle-earth";
  motion: "system" | "reduce" | "full";
  soundEnabled: boolean;
  deckLayout: "auto" | "arc" | "grid";
  enhancedGenerationEnabled: boolean;
  analyticsConsent: boolean;
  updatedAt: string;
};
```

### 6.4 Draft and reading models

```ts
type ReadingTopic = "love" | "finance" | "general";
type ReadingStatus = "selecting" | "topic_selection" | "scanning" | "generation_error";

type SelectedCard = {
  cardId: string;
  deckIndex: number;
  position: "past" | "present" | "future";
  selectedAt: string;
};

type ReadingDraft = {
  id: string;
  userId: string;
  status: ReadingStatus;
  deckOrder: string[]; // exactly 78 unique card IDs
  selectedCards: SelectedCard[]; // 0–3 unique cards
  topic: ReadingTopic | null;
  startedAt: string;
  updatedAt: string;
  generationRequestId?: string;
  generationError?: {
    code: string;
    occurredAt: string;
  };
};

type Reading = {
  id: string;
  userId: string;
  topic: ReadingTopic;
  cards: [SelectedCard, SelectedCard, SelectedCard];
  interpretation: Interpretation;
  startedAt: string;
  completedAt: string;
  contentVersion: string;
};
```

### 6.5 Persistence behavior

- Parse through a Zod schema at startup; never trust stored JSON.
- Write through a repository service that catches quota and serialization errors.
- Use a single `storage` event listener to reconcile sign-in/sign-out and history changes across tabs.
- Apply last-write-wins based on `updatedAt` for benign multi-tab changes. If two tabs edit the same draft, keep the most recently updated draft and show a nonblocking notice in the older tab.
- Maintain migration functions such as `migrateV1ToV2`; never silently discard an older valid schema.
- Provide `Export my local data` and `Delete my local data` controls. Deletion signs the user out and removes only this app's storage key.
- Do not use `localStorage.clear()` because it can delete unrelated site data.

### 6.6 Capacity and privacy constraints

`localStorage` capacity varies by browser and may be unavailable in private/restricted contexts. Store image URLs, never image binary data. Before saving a reading, estimate serialized size and catch `QuotaExceededError`. If capacity is reached, keep the current summary in memory, offer a JSON export, and let the user delete older readings.

The UI must explain that clearing site data, using another device/browser profile, or some private-browsing modes can remove accounts and history. Avoid claiming encryption or secure privacy that the architecture does not provide.

## 7. Frontend Component Breakdown

### 7.1 Application shell

- `App`: bootstraps storage, migrations, routes, and global error boundary.
- `AuthGuard`: routes authenticated/unauthenticated states.
- `AuthenticatedLayout`: persistent header plus page outlet.
- `AppHeader`: wordmark, navigation, profile menu, auth toggle.
- `GlobalErrorBoundary`: recoverable fallback and redacted diagnostic ID.
- `ToastRegion`: accessible status messages using `aria-live`.

### 7.2 Authentication

- `AuthPage`: responsive dual-column composition.
- `BrandPanel`: welcome copy and atmospheric visuals.
- `AuthPanel`: tab state and privacy explanation.
- `LoginForm`: validation and login action.
- `RegisterForm`: account validation, avatar choice, and registration action.
- `PasswordField`: visibility toggle with accessible labeling.

### 7.3 Reading selection

- `ReadingDashboard`: orchestrates draft state and reading state machine.
- `SelectionStatus`: instruction and count.
- `CardSlots`: ordered group of three holders.
- `CardSlot`: empty/filled/revealed states and remove action.
- `DeckSelector`: chooses `ArcDeck` or `GridDeck` based on preference/capability.
- `ArcDeck`: calculates overlapping transform positions from a stable deck order.
- `GridDeck`: accessible responsive fallback containing the same 78 cards.
- `DeckCard`: keyboard/touch target with selected/disabled state.
- `StartOverButton`: confirmed reset when any card is selected.

### 7.4 Topic and generation

- `TopicModal`: accessible dialog and topic choices.
- `ScanView`: card display, status sequence, cancel/retry behavior.
- `GenerationError`: plain-language error, retry, and local fallback.
- `InterpretationView`: safe structured renderer.
- `CardInsight`: one positional card explanation.
- `ReflectionPrompts`: list of reflective prompts.
- `ReadingDisclaimer`: consistent safety copy.

### 7.5 History and preferences

- `ReadingHistoryPage`, `ReadingHistoryItem`, `DeleteReadingDialog`.
- `PreferencesPage`, `AvatarPicker`, `MotionPreference`, `PrivacyControls`, `DataExport`, `DeleteLocalDataDialog`.

### 7.6 Services and utilities

- `localStorageRepository`: validated read/write, quota handling, and migrations.
- `authService`: normalized lookup, Web Crypto hashing, and session lifecycle.
- `readingService`: shuffle, selection constraints, state transitions, and save idempotency.
- `interpretationService`: local/remote generation strategy and output validation.
- `cardCatalog`: immutable 78-card manifest and catalog validation.
- `assetLoader`: progressive image loading and preload priorities.

## 8. Responsive and Accessibility Requirements

- Target WCAG 2.2 AA for the complete core flow.
- Entire reading flow must work with keyboard alone.
- Deck cards use buttons or equivalent semantic controls with labels such as `Face-down card 17 of 78`; after reveal, announce the card name and position.
- Do not rely on color, hover, orientation, or animation alone to communicate state.
- Maintain at least 4.5:1 contrast for normal text and 3:1 for large text and meaningful UI boundaries.
- The modal uses correct dialog semantics, labeled title, focus trap, and focus restoration.
- Announce selection count, revealed card, generation start, generation failure, and completion through a polite live region.
- Card images require meaningful alt text in summary; decorative textures use empty alt text.
- Arc geometry must not change DOM reading order. DOM order follows deck order.
- At widths below approximately 768 px, default to a scrollable grid, horizontal fan, or paginated deck tray rather than shrinking all 78 cards into unusable targets.
- Support current and previous major versions of Chrome, Edge, Firefox, and Safari. Test iOS Safari and Android Chrome explicitly.

## 9. Edge Cases and Error Handling

| Scenario                                           | Required behavior                                                                                                                                                           |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Refresh with 0–2 cards selected                    | Restore deck order, selected cards, positions, and selection count.                                                                                                         |
| Refresh with 3 cards before topic choice           | Restore locked cards and reopen the topic modal after render.                                                                                                               |
| Refresh during scanning                            | Restore draft; do not assume the old request completed. Resume with a new idempotent request or show `Continue generation`.                                                 |
| Refresh after generation but before navigation     | If the completed reading was saved, route to it; do not create a duplicate.                                                                                                 |
| User unselects a card                              | Allowed only before lock or after `Change cards`; compact positions and return the card to its original deck index.                                                         |
| User rapidly clicks several cards                  | Process selection transitions atomically; never exceed three or duplicate a card.                                                                                           |
| User double-clicks topic                           | Disable topic actions after first accepted choice; use one request ID.                                                                                                      |
| Card image fails                                   | Show a styled placeholder with the card name; reading remains functional.                                                                                                   |
| Card-back asset fails                              | Show a CSS-rendered face-down card with an accessible label.                                                                                                                |
| localStorage JSON is malformed                     | Preserve a diagnostic-free backup string in memory only, reset to safe defaults, and explain that local data could not be read. Offer import/export recovery only if valid. |
| localStorage unavailable                           | Allow an ephemeral in-memory session with a persistent warning that data will be lost on close.                                                                             |
| Storage quota exceeded                             | Keep current result visible, do not claim it was saved, and offer export/history cleanup.                                                                                   |
| Remote AI offline/times out                        | Offer retry and immediate local interpretation fallback. Preserve chosen cards/topic.                                                                                       |
| Remote output fails schema/safety checks           | Discard it and use the local generator; log only a redacted error code.                                                                                                     |
| User signs out mid-reading                         | Persist draft under that user's ID, clear session, and restore it on next login.                                                                                            |
| Account deleted or app data cleared in another tab | Sign out affected tabs and return to auth with a clear notice.                                                                                                              |
| Two accounts share an email with case differences  | Prevent registration after normalized comparison.                                                                                                                           |
| Browser back during modal/scan                     | Close modal or return to locked selection predictably; never lose selected cards silently.                                                                                  |
| User starts a new reading from summary             | Create a new draft ID and shuffle; retain previous reading in history.                                                                                                      |
| Fewer/more than 78 catalog entries                 | Fail build/CI catalog validation; in production show a maintenance error rather than a partial deck.                                                                        |
| Reduced-motion enabled                             | Disable card-flight, parallax, shimmer, and scanning sweeps.                                                                                                                |

### 9.1 Error copy principles

- State what happened, what was preserved, and what the user can do next.
- Avoid codes in primary copy; include a short diagnostic code only in details.
- Never blame the user or imply a reading has mystical significance because of a technical failure.

## 10. Security, Privacy, and Responsible Content

- Enforce a strict Content Security Policy; disallow inline script where practical.
- Sanitize and schema-validate all imported JSON and remote interpretation responses.
- Keep AI credentials and privileged configuration off the client.
- Do not transmit email, display name, password material, reading history, or free-form personal questions to an interpretation service.
- Use HTTPS for all deployed assets and endpoints.
- Rate-limit the optional generation proxy by anonymous abuse-resistant signals; do not turn local accounts into server identities.
- Add dependency scanning, lockfile review, and secret scanning to CI.
- Provide clear local-data disclosure during registration and in preferences.
- If analytics is added, require opt-in consent and use coarse events only, such as `reading_started`, `three_cards_selected`, `topic_selected`, and `reading_completed`. Do not attach card IDs or topics unless separately justified and disclosed.

## 11. Non-Functional Requirements

### 11.1 Performance

- Lighthouse targets on a representative mobile device: Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 95.
- Largest Contentful Paint ≤ 2.5 seconds at the 75th percentile on a good 4G profile.
- Cumulative Layout Shift ≤ 0.1.
- Interaction to Next Paint ≤ 200 ms for ordinary UI actions.
- Auth page should not download all 78 face images.
- On dashboard, load card back and above-the-fold UI first; progressively load selected face images and cache catalog assets.
- Arc hover/selection animation should remain near 60 fps on supported desktop hardware by animating `transform` and `opacity`, not layout properties.

### 11.2 Reliability

- No completed reading is lost on an ordinary refresh after successful local save.
- All persistence writes are error-checked; the UI never reports saved before confirmation.
- Generation uses a fallback so a network failure does not block completion.
- Catalog and schema validation run during CI and application startup.

### 11.3 Maintainability

- TypeScript strict mode enabled.
- Domain services have no dependency on React components.
- Version card content, interpretation templates, prompts, and persisted schemas independently.
- No hard-coded card array inside a visual component.

## 12. Acceptance Criteria

### 12.1 Authentication

- A user can register, refresh, and remain signed in.
- A registered user can sign out and sign back in with the same local credentials.
- Duplicate normalized emails are rejected.
- Inspecting localStorage reveals no plaintext password or API key.

### 12.2 Reading flow

- The dashboard displays three empty ordered holders and 78 unique face-down cards.
- A user can select no more and no fewer than three cards before continuing.
- Each selected card is unique, appears in selection order, and is visually revealed.
- The topic modal opens automatically after the third placement completes.
- The three exact topic choices are available and keyboard operable.
- Choosing a topic produces a visible scan state and then a structured English interpretation tailored to the three cards and topic.
- The completed reading is saved once and appears in the correct user's history.

### 12.3 Recovery

- Refresh is verified at each reading state: selecting, topic selection, scanning, error, and completed.
- A generation timeout can recover through retry or local fallback without reselecting cards.
- A quota failure keeps the generated reading visible and offers a recovery action.

### 12.4 Design and accessibility

- Desktop auth uses a wide dual-column layout with the exact phrase `Welcome to Middle-earth Reading` on the left and auth forms on the right.
- Authenticated routes consistently show avatar and Sign Out control.
- Desktop deck uses a recognizable semicircular arc; narrow layouts provide usable 44 px targets.
- The entire happy path passes keyboard, screen-reader smoke, reduced-motion, contrast, and 200% zoom tests.

## 13. Testing Strategy

### 13.1 Unit tests

- Email normalization and credential verification.
- PBKDF2 hash/verify contract with fixed test vectors.
- Fisher–Yates shuffle completeness and uniqueness.
- Reading state transitions and three-card limit.
- Position compaction after unselection.
- Local interpretation determinism for a seeded input.
- Storage parsing, quota errors, and every migration.

### 13.2 Integration tests

- Register/login/sign-out/session restore.
- Draft persistence after each valid transition.
- Topic modal focus management.
- Remote generation success, timeout, invalid output, retry, and local fallback.
- History ownership across multiple local accounts.
- Multi-tab session and draft conflict handling.

### 13.3 End-to-end tests

- New user completes each of the three topic types.
- Returning user resumes after refresh at every flow state.
- Keyboard-only reading completion.
- Mobile viewport grid selection.
- Broken image and offline generation scenarios.
- Data export and local-data deletion.

### 13.4 Visual QA

Capture baseline screenshots at desktop, tablet, and mobile breakpoints for auth, empty dashboard, partial selection, modal, scan, summary, history, and error states. Review with real supplied assets for cropping, contrast, overlap, and text length.

## 14. Delivery Plan and Launch Gates

### Phase 1: Foundation

- Asset audit and 78-card manifest.
- Design tokens and responsive app shell.
- Versioned storage repository, migrations, auth, and session restoration.

### Phase 2: Core reading experience

- Draft state machine, slots, arc/grid deck, selection mechanics, and topic modal.
- Local interpretation engine and structured summary.
- History and preferences.

### Phase 3: Hardening

- Optional stateless AI proxy and local fallback.
- Accessibility, performance, multi-tab behavior, error states, and full test suite.
- Asset optimization and responsive visual QA.

### Launch gates

- IP/license approval for name, lore, and all visual assets.
- Card catalog has exactly 78 valid unique entries.
- No plaintext credentials or client-side AI secret.
- Core flow passes supported-browser and accessibility checks.
- Refresh recovery passes at every persisted state.
- Local fallback completes a reading with the network disabled.
- Privacy disclosure and entertainment/professional-advice disclaimer are approved.

## 15. Open Decisions Requiring Product Approval

1. Confirm commercial or noncommercial rights for LOTR branding and the 79 provided assets.
2. Decide whether v1 is strictly offline/local generation or includes the optional stateless AI proxy.
3. Approve the card-to-LOTR mapping, card meanings, and content voice guide.
4. Confirm whether history deletion, data export, and account deletion ship in the first public release; this PRD treats them as required for responsible local-data management.
5. Decide whether readings support upright cards only; this PRD assumes upright-only for v1.
