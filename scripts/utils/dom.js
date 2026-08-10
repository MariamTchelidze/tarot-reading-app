// Escape user-controlled text before it enters an HTML template.
export function escapeHtml(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

// Format saved ISO dates in a friendly, consistent way.
export function formatDate(isoDate) {
  return new Intl.DateTimeFormat("en", { dateStyle: "long", timeStyle: "short" }).format(new Date(isoDate));
}

// Download data locally without uploading it anywhere.
export function downloadFile(filename, content, type = "application/json") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// Keep keyboard focus inside a modal and restore it when the modal closes.
export function createFocusTrap(dialog, onEscape) {
  const previousFocus = document.activeElement;
  const selector = "button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])";
  function handleKeydown(event) {
    if (event.key === "Escape") { event.preventDefault(); onEscape(); return; }
    if (event.key !== "Tab") return;
    const controls = [...dialog.querySelectorAll(selector)];
    if (!controls.length) return;
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  dialog.addEventListener("keydown", handleKeydown);
  dialog.querySelector(selector)?.focus();
  return () => { dialog.removeEventListener("keydown", handleKeydown); previousFocus?.focus?.(); };
}
