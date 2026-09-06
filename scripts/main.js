/* helix: scripts/main.js */
/* Lightweight progressive enhancements for the Lumen landing page. */

(function () {
    "use strict";

    function initFooterYear() {
        var yearEl = document.getElementById("footer-year");
        if (!yearEl) return;
        var now = new Date();
        var year = now.getFullYear();
        // If the markup already has a sensible static year, only override when it
        // looks like a placeholder ("2024", "2025", etc.) — keep editorial control.
        if (!/^\d{4}$/.test(yearEl.textContent || "")) {
            yearEl.textContent = String(year);
            return;
        }
        var parsed = Number.parseInt(yearEl.textContent, 10);
        if (!Number.isFinite(parsed) || parsed < 2024) {
            yearEl.textContent = String(year);
        }
    }

    function init() {
        initFooterYear();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();