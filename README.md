# Middle-earth Tarot Reading

A mobile-first, local-only tarot application built with HTML, SCSS, and vanilla JavaScript.

## Start developing

```bash
npm install
npm run scss:watch
```

Open `index.html` through VS Code Live Server. SCSS partials are imported by
`assets/scss/main.scss`; JavaScript modules are imported by `scripts/main.js`.

Accounts, preferences, drafts, and reading history are stored under the single
browser key `middleEarthReading:v1`. No app data is sent to a server.
