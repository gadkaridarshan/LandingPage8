// helix: scripts/contact.js
// @helix:story USER-779000
// Client-side validation + submission for the Lumen contact form.
// Posts JSON to window.LUMEN_CONTACT_ENDPOINT (default: "/api/contact").
// Expected response shape:
//   { "ok": true,  "message": "Thanks — we'll be in touch." }
//   { "ok": false, "error":   "Email domain blocked." }
(function () {
  "use strict";

  var DEFAULT_ENDPOINT = "/api/contact";

  /** Light DOM helpers — kept local to this file. */
  function $(sel, root) { return (root || document).querySelector(sel); }

  /** RFC-light email regex. Intentionally permissive — the server is authoritative. */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /** Field definitions — id, name, validators, and error messages. */
  var FIELDS = [
    {
      id: "contact-name",
      name: "name",
      label: "Full name",
      required: true,
      validate: function (value) {
        var v = String(value || "").trim();
        if (!v) return "Please enter your full name.";
        if (v.length < 2) return "Please enter your full name.";
        if (v.length > 120) return "Name is too long (max 120 characters).";
        return "";
      },
    },
    {
      id: "contact-email",
      name: "email",
      label: "Work email",
      required: true,
      validate: function (value) {
        var v = String(value || "").trim();
        if (!v) return "Please enter your work email.";
        if (v.length > 254) return "Email is too long.";
        if (!EMAIL_RE.test(v)) return "Please enter a valid email address.";
        return "";
      },
    },
    {
      id: "contact-company",
      name: "company",
      label: "Company",
      required: false,
      validate: function (value) {
        var v = String(value || "").trim();
        if (v.length > 160) return "Company name is too long (max 160 characters).";
        return "";
      },
    },
    {
      id: "contact-message",
      name: "message",
      label: "Message",
      required: true,
      validate: function (value) {
        var v = String(value || "").trim();
        if (!v) return "Please tell us a little about what you're working on.";
        if (v.length < 10) return "Please add a bit more detail (at least 10 characters).";
        if (v.length > 4000) return "Message is too long (max 4000 characters).";
        return "";
      },
    },
  ];

  /**
   * Reads the endpoint from window.LUMEN_CONTACT_ENDPOINT, falling back to the
   * module default. Validates that it is a same-origin absolute or root-relative
   * URL — we never POST credentials cross-origin.
   */
  function resolveEndpoint() {
    var raw = (typeof window !== "undefined" && window.LUMEN_CONTACT_ENDPOINT) || DEFAULT_ENDPOINT;
    if (typeof raw !== "string") return DEFAULT_ENDPOINT;
    var trimmed = raw.trim();
    if (!trimmed) return DEFAULT_ENDPOINT;
    try {
      var url = new URL(trimmed, window.location.origin);
      if (url.origin !== window.location.origin) return DEFAULT_ENDPOINT;
      return url.pathname + url.search + url.hash;
    } catch (_e) {
      // Allow root-relative paths like "/api/contact".
      if (trimmed.charAt(0) !== "/") return DEFAULT_ENDPOINT;
      return trimmed;
    }
  }

  /**
   * Validate a single field, updating the DOM with its error message and
   * aria-invalid state. Returns true when the field is valid.
   */
  function validateField(def, value) {
    var input = document.getElementById(def.id);
    var errorEl = document.getElementById(def.id + "-error");
    if (!input) return true;

    var message = def.validate(value);
    if (errorEl) errorEl.textContent = message;

    var fieldWrapper = input.closest(".field");
    if (fieldWrapper) fieldWrapper.classList.toggle("field--invalid", Boolean(message));

    input.setAttribute("aria-invalid", message ? "true" : "false");
    return !message;
  }

  /** Read the current value for a field. */
  function readField(def) {
    var el = document.getElementById(def.id);
    return el ? el.value : "";
  }

  /** Update the live status region used by screen readers and visible feedback. */
  function setStatus(form, message, state) {
    var status = form.querySelector(".contact-form__status");
    if (!status) return;
    status.textContent = message || "";
    if (state) status.setAttribute("data-state", state);
    else status.removeAttribute("data-state");
  }

  /** Show a field-level error in the status region as a fallback. */
  function setStatusError(form, message) {
    setStatus(form, message, "error");
  }

  /** Submit handler — validates, posts JSON, and renders the response. */
  function onSubmit(event) {
    event.preventDefault();
    var form = event.currentTarget;

    // Validate every field; focus the first invalid one.
    var firstInvalid = null;
    for (var i = 0; i < FIELDS.length; i++) {
      var def = FIELDS[i];
      var ok = validateField(def, readField(def));
      if (!ok && !firstInvalid) firstInvalid = document.getElementById(def.id);
    }
    if (firstInvalid) {
      setStatusError(form, "Please fix the highlighted fields and try again.");
      firstInvalid.focus();
      return;
    }

    // Build the payload.
    var payload = {};
    for (var j = 0; j < FIELDS.length; j++) {
      var f = FIELDS[j];
      var raw = readField(f);
      payload[f.name] = typeof raw === "string" ? raw.trim() : "";
    }
    payload.submittedAt = new Date().toISOString();

    // Submit.
    var submit = form.querySelector(".contact-form__submit");
    var endpoint = resolveEndpoint();
    form.classList.add("contact-form--loading");
    if (submit) submit.disabled = true;
    setStatus(form, "Sending…", null);

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        return res.text().then(function (text) {
          var data = null;
          if (text) {
            try { data = JSON.parse(text); } catch (_e) { /* leave data null */ }
          }
          return { ok: res.ok, status: res.status, data: data, raw: text };
        });
      })
      .then(function (result) {
        if (result.ok && result.data && result.data.ok !== false) {
          setStatus(
            form,
            (result.data && result.data.message) || "Thanks — we'll be in touch within one business day.",
            "success"
          );
          form.reset();
          // Clear any lingering field errors.
          for (var k = 0; k < FIELDS.length; k++) {
            var fld = FIELDS[k];
            var errEl = document.getElementById(fld.id + "-error");
            if (errEl) errEl.textContent = "";
            var wrap = document.getElementById(fld.id);
            if (wrap && wrap.closest(".field")) wrap.closest(".field").classList.remove("field--invalid");
          }
        } else {
          var serverMsg = (result.data && (result.data.error || result.data.message)) || "";
          setStatusError(
            form,
            serverMsg || "Something went wrong sending your message. Please try again."
          );
        }
      })
      .catch(function () {
        setStatusError(
          form,
          "We couldn't reach the server. Please check your connection and try again."
        );
      })
      .then(function () {
        form.classList.remove("contact-form--loading");
        if (submit) submit.disabled = false;
      });
  }

  /** Live re-validation on blur so users see errors clear as they edit. */
  function bindLiveValidation(form) {
    for (var i = 0; i < FIELDS.length; i++) {
      (function (def) {
        var input = document.getElementById(def.id);
        if (!input) return;
        input.addEventListener("blur", function () {
          if (input.value !== "" || def.required) {
            validateField(def, input.value);
          }
        });
        input.addEventListener("input", function () {
          var wrap = input.closest(".field");
          if (wrap && wrap.classList.contains("field--invalid")) {
            validateField(def, input.value);
          }
        });
      })(FIELDS[i]);
    }
  }

  function init() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    bindLiveValidation(form);
    form.addEventListener("submit", onSubmit);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();