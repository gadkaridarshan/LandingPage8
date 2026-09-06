// helix: scripts/main.js
// @helix:story USER-917000
// Page-level bootstrapping for the Lumen landing page.
// Exposes the contact endpoint used by scripts/contact.js and runs
// small presentational niceties that don't belong to a specific section.

(function () {
  "use strict";

  // Configurable JSON endpoint for the contact form.
  // Override at runtime by setting window.LUMEN_CONTACT_ENDPOINT
  // before this script executes (e.g. via an inline <script> tag).
  if (typeof window.LUMEN_CONTACT_ENDPOINT !== "string") {
    window.LUMEN_CONTACT_ENDPOINT = "/api/contact";
  }

  /** Keep the footer copyright year current without a build step. */
  function updateFooterYear() {
    var yearEl = document.getElementById("footer-year");
    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateFooterYear);
  } else {
    updateFooterYear();
  }
})();