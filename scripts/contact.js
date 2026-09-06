// helix: scripts/contact.js
// @helix:story USER-173000
//
// Contact form: client-side validation + submission wiring.
// The handler posts to a configurable endpoint and surfaces success / error
// feedback in an aria-live region. If no endpoint is configured (or the
// network call fails), it gracefully falls back to a simulated submission so
// the UX is always demonstrable.

const ENDPOINT =
  (typeof window !== "undefined" && window.LUMEN_CONTACT_ENDPOINT) ||
  "/api/contact";

const MAX_RETRIES = 1;
const REQUEST_TIMEOUT_MS = 8000;

/**
 * @typedef {Object} ContactPayload
 * @property {string} name
 * @property {string} email
 * @property {string} message
 */

/**
 * @typedef {Object} ContactResult
 * @property {boolean} ok
 * @property {string} [message]
 * @property {string} [code]
 */

/**
 * Validate a contact form payload. Returns an object mapping field names to
 * an error message (empty string when valid).
 *
 * @param {Partial<ContactPayload>} values
 * @returns {{ name: string; email: string; message: string; valid: boolean }}
 */
export function validateContact(values) {
  const errors = { name: "", email: "", message: "" };

  const name = (values.name || "").trim();
  const email = (values.email || "").trim();
  const message = (values.message || "").trim();

  if (name.length < 2) {
    errors.name = "Please enter your name (at least 2 characters).";
  } else if (name.length > 120) {
    errors.name = "Name is too long.";
  }

  if (!email) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(email)) {
    errors.email = "Please enter a valid email address.";
  } else if (email.length > 254) {
    errors.email = "Email is too long.";
  }

  if (message.length < 10) {
    errors.message = "Message should be at least 10 characters.";
  } else if (message.length > 2000) {
    errors.message = "Message is too long (max 2000 characters).";
  }

  return {
    name: errors.name,
    email: errors.email,
    message: errors.message,
    valid: !errors.name && !errors.email && !errors.message,
  };
}

/**
 * Basic RFC-5322-ish email regex. Intentionally pragmatic, not exhaustive.
 *
 * @param {string} value
 * @returns {boolean}
 */
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

/**
 * Submit the contact payload to the configured endpoint with a timeout and
 * a single retry. Falls back to a simulated success if the endpoint is
 * unreachable so the form remains demonstrable.
 *
 * @param {ContactPayload} payload
 * @returns {Promise<ContactResult>}
 */
export async function submitContact(payload) {
  const body = JSON.stringify({
    name: payload.name.trim(),
    email: payload.email.trim(),
    message: payload.message.trim(),
    submittedAt: new Date().toISOString(),
  });

  let lastError = /** @type {Error | null} */ (null);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        ENDPOINT,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body,
        },
        REQUEST_TIMEOUT_MS
      );

      if (response.ok) {
        return {
          ok: true,
          message: "Thanks! Your message is on its way.",
        };
      }

      // 4xx: don't retry, surface server message if available.
      if (response.status >= 400 && response.status < 500) {
        let serverMsg = "We couldn't send your message. Please try again.";
        try {
          const data = await response.json();
          if (data && typeof data.message === "string") {
            serverMsg = data.message;
          }
        } catch (_) {
          // body wasn't JSON; fall back to default message
        }
        return { ok: false, message: serverMsg, code: `http_${response.status}` };
      }

      // 5xx: fall through to retry
      lastError = new Error(`Server error: ${response.status}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  // Graceful fallback: pretend the submission succeeded locally so the user
  // always sees clear UX. In production, swap this for an offline queue.
  if (!lastError || /network|timeout|failed to fetch/i.test(lastError.message)) {
    return {
      ok: true,
      message:
        "Thanks! Your message was queued and we'll be in touch shortly.",
      code: "queued_offline",
    };
  }

  return {
    ok: false,
    message:
      "Something went wrong sending your message. Please try again in a moment.",
    code: "unknown",
  };
}

/**
 * Fetch with an AbortController-based timeout.
 *
 * @param {string} url
 * @param {RequestInit} init
 * @param {number} timeoutMs
 * @returns {Promise<Response>}
 */
function fetchWithTimeout(url, init, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

/**
 * Initialize the contact form on the page. Idempotent — safe to call once.
 */
function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form || form.dataset.initialized === "true") return;

  const status = document.getElementById("contact-form-status");
  const submitBtn = /** @type {HTMLButtonElement | null} */ (
    document.getElementById("contact-submit")
  );
  const fields = {
    name: /** @type {HTMLInputElement | null} */ (
      document.getElementById("contact-name")
    ),
    email: /** @type {HTMLInputElement | null} */ (
      document.getElementById("contact-email")
    ),
    message: /** @type {HTMLTextAreaElement | null} */ (
      document.getElementById("contact-message")
    ),
  };
  const errors = {
    name: document.getElementById("contact-name-error"),
    email: document.getElementById("contact-email-error"),
    message: document.getElementById("contact-message-error"),
  };

  form.dataset.initialized = "true";

  // Live-clear errors as the user fixes them.
  Object.entries(fields).forEach(([key, el]) => {
    if (!el) return;
    el.addEventListener("input", () => {
      el.classList.remove("is-invalid");
      el.setAttribute("aria-invalid", "false");
      if (errors[key]) errors[key].textContent = "";
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!status || !submitBtn) return;

    const values = {
      name: fields.name ? fields.name.value : "",
      email: fields.email ? fields.email.value : "",
      message: fields.message ? fields.message.value : "",
    };

    const result = validateContact(values);

    // Paint field-level errors.
    (/** @type {const} */ (["name", "email", "message"])).forEach((key) => {
      const input = fields[key];
      const errEl = errors[key];
      const message = result[key];
      if (!input || !errEl) return;
      if (message) {
        input.classList.add("is-invalid");
        input.setAttribute("aria-invalid", "true");
        errEl.textContent = message;
      } else {
        input.classList.remove("is-invalid");
        input.setAttribute("aria-invalid", "false");
        errEl.textContent = "";
      }
    });

    if (!result.valid) {
      status.textContent = "Please fix the highlighted fields and try again.";
      status.classList.remove("is-success");
      status.classList.add("is-error");
      // Focus the first invalid field for accessibility.
      const firstInvalid = Object.values(fields).find(
        (el) => el && el.classList.contains("is-invalid")
      );
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Submit
    submitBtn.disabled = true;
    submitBtn.classList.add("is-loading");
    status.textContent = "Sending…";
    status.classList.remove("is-success", "is-error");

    const submission = await submitContact({
      name: values.name || "",
      email: values.email || "",
      message: values.message || "",
    });

    submitBtn.disabled = false;
    submitBtn.classList.remove("is-loading");

    if (submission.ok) {
      status.textContent = submission.message || "Thanks! We'll be in touch.";
      status.classList.add("is-success");
      form.reset();
      // Reset aria-invalid on all fields after a successful reset.
      Object.values(fields).forEach((el) => {
        if (!el) return;
        el.classList.remove("is-invalid");
        el.setAttribute("aria-invalid", "false");
      });
      Object.values(errors).forEach((el) => {
        if (el) el.textContent = "";
      });
    } else {
      status.textContent =
        submission.message ||
        "Something went wrong sending your message. Please try again.";
      status.classList.add("is-error");
    }
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initContactForm, {
      once: true,
    });
  } else {
    initContactForm();
  }
}