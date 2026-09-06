// helix: scripts/main.js
// Tiny page-level enhancements (footer year, smooth-scroll for in-page links).

function initFooterYear() {
  const yearEl = document.getElementById("footer-year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
}

function initSmoothScroll() {
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest('a[href^="#"]');
    if (!(link instanceof HTMLAnchorElement)) return;
    const id = link.getAttribute("href");
    if (!id || id === "#" || id.length < 2) return;
    const el = document.querySelector(id);
    if (!el) return;
    event.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initFooterYear();
      initSmoothScroll();
    });
  } else {
    initFooterYear();
    initSmoothScroll();
  }
}