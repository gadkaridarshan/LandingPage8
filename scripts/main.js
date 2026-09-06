/* helix: scripts/main.js */
(function () {
    'use strict';

    // Footer year stamp.
    var yearEl = document.getElementById('footer-year');
    if (yearEl) {
        yearEl.textContent = String(new Date().getFullYear());
    }

    // Smooth in-page anchor scrolling that respects reduced motion.
    var prefersReduced = typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.addEventListener('click', function (event) {
        var anchor = event.target && event.target.closest && event.target.closest('a[href^="#"]');
        if (!anchor) { return; }
        var href = anchor.getAttribute('href');
        if (!href || href === '#') { return; }
        var target = document.getElementById(href.slice(1));
        if (!target) { return; }
        event.preventDefault();
        target.scrollIntoView({
            behavior: prefersReduced ? 'auto' : 'smooth',
            block: 'start'
        });
        if (typeof target.focus === 'function') {
            try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
        }
    });
})();