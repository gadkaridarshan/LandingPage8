// helix: scripts/main.js
// Minimal landing-page bootstrap: footer year + smooth in-page navigation.

(function () {
    "use strict";

    function setYear() {
        var yearEl = document.getElementById("year");
        if (yearEl) {
            yearEl.textContent = String(new Date().getFullYear());
        }
    }

    function bindSmoothAnchors() {
        var anchors = document.querySelectorAll('a[href^="#"]');
        Array.prototype.forEach.call(anchors, function (anchor) {
            anchor.addEventListener("click", function (event) {
                var href = anchor.getAttribute("href");
                if (!href || href === "#") return;
                var target = document.querySelector(href);
                if (!target) return;
                event.preventDefault();
                target.scrollIntoView({ behavior: "smooth", block: "start" });
                if (typeof target.focus === "function") {
                    target.setAttribute("tabindex", "-1");
                    target.focus({ preventScroll: true });
                }
            });
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            setYear();
            bindSmoothAnchors();
        });
    } else {
        setYear();
        bindSmoothAnchors();
    }
})();