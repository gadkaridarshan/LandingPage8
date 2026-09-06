// helix: server/contact-handler.example.js
// Reference Node.js handler for the Lumen contact form.
// This file documents the expected POST /api/contract request/response shape.
// It is *not* loaded by the static site — copy and adapt it for your backend.

/**
 * Wire it up however you like. Example with the built-in `http` module:
 *
 *   const http = require("http");
 *   const { handleContact } = require("./server/contact-handler.example.js");
 *
 *   http.createServer(async (req, res) => {
 *     if (req.method === "POST" && req.url === "/api/contact") {
 *       return handleContact(req, res);
 *     }
 *     res.statusCode = 404;
 *     res.end("Not found");
 *   }).listen(3000);
 *
 * Request body (JSON):
 *   {
 *     "name":       "Ada Lovelace",     // required, 2..120 chars
 *     "email":      "ada@example.com",  // required, valid email, <=254 chars
 *     "company":    "Lumen",            // optional, <=160 chars
 *     "message":    "10..4000 chars",   // required
 *     "submittedAt": "2024-01-01T00:00:00.000Z"  // client ISO timestamp
 *   }
 *
 * Response on success (HTTP 200):
 *   { "ok": true,  "message": "Thanks — we'll be in touch within one business day." }
 *
 * Response on validation error (HTTP 400):
 *   { "ok": false, "error": "Please provide a valid email address." }
 *
 * Response on server error (HTTP 500):
 *   { "ok": false, "error": "Something went wrong on our end. Please try again." }
 */

const http = require("http");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_BODY_BYTES = 16 * 1024; // 16 KB is plenty for a contact form.

function sendJson(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(payload);
}

function validate(payload) {
  if (!payload || typeof payload !== "object") {
    return "Request body must be JSON.";
  }
  const name = String(payload.name || "").trim();
  const email = String(payload.email || "").trim();
  const company = String(payload.company || "").trim();
  const message = String(payload.message || "").trim();

  if (!name || name.length < 2 || name.length > 120) {
    return "Please provide your full name.";
  }
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return "Please provide a valid email address.";
  }
  if (company.length > 160) {
    return "Company name is too long.";
  }
  if (!message || message.length < 10 || message.length > 4000) {
    return "Please share a message between 10 and 4000 characters.";
  }
  return null;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let received = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      received += chunk.length;
      if (received > MAX_BODY_BYTES) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (_err) {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

/**
 * Handle a POST /api/contact request.
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
async function handleContact(req, res) {
  // Only POST is allowed.
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { ok: false, error: "Method not allowed." });
  }

  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (err) {
    const msg = err && err.message === "Payload too large"
      ? "Message is too long."
      : "Malformed JSON payload.";
    return sendJson(res, 400, { ok: false, error: msg });
  }

  const validationError = validate(payload);
  if (validationError) {
    return sendJson(res, 400, { ok: false, error: validationError });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Replace this stub with your real delivery (email, CRM, queue, etc.).
  // ────────────────────────────────────────────────────────────────────────────
  try {
    // await deliverToInbox(payload);
    console.log("[contact-handler] received submission:", {
      name: payload.name,
      email: payload.email,
      company: payload.company,
      submittedAt: payload.submittedAt,
    });
  } catch (_err) {
    return sendJson(res, 500, {
      ok: false,
      error: "Something went wrong on our end. Please try again.",
    });
  }

  return sendJson(res, 200, {
    ok: true,
    message: "Thanks — we'll be in touch within one business day.",
  });
}

module.exports = { handleContact, validate };

// Allow running this file directly for a quick local smoke test:
if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  http
    .createServer((req, res) => {
      if (req.method === "POST" && req.url === "/api/contact") {
        return handleContact(req, res);
      }
      sendJson(res, 404, { ok: false, error: "Not found." });
    })
    .listen(port, () => {
      console.log(`[contact-handler] listening on http://localhost:${port}`);
    });
}