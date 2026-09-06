// helix: server/contact-handler.example.js
// Reference implementation of the POST /api/contact endpoint that the
// frontend posts to. Drop this into your backend of choice (Node/Express,
// Cloudflare Worker, etc.) and adapt persistence + transport as needed.
//
// Endpoint:  POST /api/contact
// Content-Type: application/json
//
// Request body:
//   {
//     "name": "Ada Lovelace",          // 2..120
//     "email": "ada@example.com",     // RFC 5322-ish
//     "message": "Tell us about …",   // 10..2000
//     "submittedAt": "2026-01-01T00:00:00.000Z"  // ISO timestamp
//   }
//
// Success response: 200 OK
//   { "ok": true, "message": "Thanks! Your message is on its way." }
//
// Validation failure: 400 Bad Request
//   { "ok": false, "message": "Validation failed", "errors": { "email": "Invalid" } }
//
// Rate-limited: 429 Too Many Requests
//   { "ok": false, "message": "Too many requests. Try again later." }
//
// Server error: 500 Internal Server Error
//   { "ok": false, "message": "Unexpected error. Please try again." }

const MAX_NAME = 120;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 2000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Validate a contact payload server-side. Mirrors the client-side rules in
 * scripts/contact.js.
 *
 * @param {unknown} payload
 * @returns {{ ok: boolean; value?: {
 *   name: string; email: string; message: string; submittedAt: string;
 * }; errors?: Record<string, string> }}
 */
export function validateContactPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return { ok: false, errors: { _root: "Invalid payload" } };
  }
  const p = /** @type {Record<string, unknown>} */ (payload);
  const errors = /** @type {Record<string, string>} */ ({});

  const name = typeof p.name === "string" ? p.name.trim() : "";
  const email = typeof p.email === "string" ? p.email.trim() : "";
  const message = typeof p.message === "string" ? p.message.trim() : "";

  if (name.length < 2) errors.name = "Name is too short.";
  else if (name.length > MAX_NAME) errors.name = "Name is too long.";

  if (!email) errors.email = "Email is required.";
  else if (!EMAIL_RE.test(email)) errors.email = "Invalid email.";
  else if (email.length > MAX_EMAIL) errors.email = "Email is too long.";

  if (message.length < 10) errors.message = "Message is too short.";
  else if (message.length > MAX_MESSAGE) errors.message = "Message is too long.";

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      name,
      email,
      message,
      submittedAt:
        typeof p.submittedAt === "string"
          ? p.submittedAt
          : new Date().toISOString(),
    },
  };
}

/**
 * Tiny in-memory rate limiter (sliding-window per IP). Replace with a
 * real Redis-backed limiter in production.
 *
 * @param {string} ip
 * @param {Map<string, number[]>} store
 * @param {number} limit
 * @param {number} windowMs
 * @returns {boolean}
 */
export function rateLimit(ip, store, limit, windowMs) {
  const now = Date.now();
  const hits = (store.get(ip) || []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    store.set(ip, hits);
    return false;
  }
  hits.push(now);
  store.set(ip, hits);
  return true;
}

/**
 * Reference Express-style handler. Replace `sendJson` / `getClientIp` /
 * * `persistMessage` with your transport-specific helpers.
 *
 * @param {{ body: string; headers: Record<string, string>; ip: string }} req
 * @param {{
 *   status: (code: number) => { json: (body: unknown) => void };
 *   json: (body: unknown) => void;
 * }} res
 */
export function handleContactRequest(req, res) {
  let payload;
  try {
    payload = JSON.parse(req.body);
  } catch (_) {
    res.status(400).json({ ok: false, message: "Invalid JSON body." });
    return;
  }

  const validation = validateContactPayload(payload);
  if (!validation.ok) {
    res
      .status(400)
      .json({ ok: false, message: "Validation failed", errors: validation.errors });
    return;
  }

  /** @type {Map<string, number[]>} */
  const ipHits = (globalThis.__contactRateStore ||= new Map());
  const ip = req.ip || "unknown";
  if (!rateLimit(ip, ipHits, 5, 60_000)) {
    res
      .status(429)
      .json({ ok: false, message: "Too many requests. Try again later." });
    return;
  }

  // Hand off to whatever your persistence layer is (email, CRM, queue).
  // persistMessage(validation.value).catch(console.error);

  res
    .status(200)
    .json({ ok: true, message: "Thanks! Your message is on its way." });
}