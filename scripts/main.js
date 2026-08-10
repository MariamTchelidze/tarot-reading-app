import { TarotApp } from "./app.js";

// This is the only JavaScript entry point used by index.html.
const root = document.querySelector("#app");
if (root) new TarotApp(root).start();
