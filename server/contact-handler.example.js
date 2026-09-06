/* helix: server/contact-handler.example.js @helix:story USER-173000 */
/* Reference Node.js (>=18) backend handler for the Lumen contact form.
 *
 * Drop this into a Node 18+ project as-is, or use it as a template for the
 * real backend. It implements the exact request/response shape that
 * `scripts/contact.js` expects.
 *
 * Run locally:
 *     node server/contact-handler.example.js
 *
 * Expected request:
 *     POST /api/contact
 *     Content-Type: application/json
 *     {
 *         "name":    "Ada Lovelace",
 *         "email":   "ada@yourcompany.com",
 *         "message": "Tell us a bit about your team and what you're hoping Lumen can help with.",
 *         "consent": true
 *     }
 *
 * Success response (HTTP 200):
 *     { "ok": true, "message": "Thanks — we'll be in touch shortly." }
 *
 * Validation failure (HTTP 400):
 *     { "ok": false, "error": "Please provide a valid email address.", "field": "email" }
 *
 * Server error (HTTP 500):
 *     { "ok": false, "error": "Something went wrong on our end." }
 */

const http = require("node:http");
const { URL } = require("node:url");

const PORT = Number.parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "127.0.0.1";
const ENDPOINT = "/api/contact";
const MAX_BODY_BYTES = 16 * 1024; // 16 KB — generous for a contact message

// --- Helpers ---------------------------------------------------------------

function sendJson(res, status, payload) {
    const body = JSON.stringify(payload);
    res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": Buffer.byteLength(body),
        "Cache-Control": "no-store",
    });
    res.end(body);
}

function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let received = 0;
        req.on("data", (chunk) => {
            received += chunk.length;
            if (received > MAX_BODY_BYTES) {
                reject(Object.assign(new Error("Payload too large"), { status: 413 }));
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
                reject(Object.assign(new Error("Invalid JSON body"), { status: 400 }));
            }
        });
        req.on("error", reject);
    });
}

// --- Validation ------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(payload) {
    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    const email = typeof payload.email === "string" ? payload.email.trim() : "";
    const message = typeof payload.message === "string" ? payload.message.trim() : "";
    const consent = payload.consent === true;

    if (name.length < 2 || name.length > 120) {
        return { field: "name", error: "Please enter your name (2–120 characters)." };
    }
    if (email.length === 0 || email.length > 254 || !EMAIL_RE.test(email)) {
        return { field: "email", error: "Please provide a valid email address." };
    }
    if (message.length < 10 || message.length > 4000) {
        return { field: "message", error: "Message must be 10–4000 characters." };
    }
    if (!consent) {
        return { field: "consent", error: "Consent is required to contact you." };
    }

    return {
        ok: true,
        data: { name, email, message, consent },
    };
}

// --- Delivery --------------------------------------------------------------

/**
 * Replace this stub with your real delivery mechanism:
 *   - Send to an email service (SES, Postmark, Resend, etc.)
 *   - Forward to Slack / a CRM webhook
 *   - Persist to a database
 *
 * The stub just logs and resolves, so you can exercise the endpoint.
 */
async function deliver(_submission) {
    // eslint-disable-next-line no-console
    console.log("[contact-handler] received submission:", {
        at: new Date().toISOString(),
        // Do not log the raw message in production unless you intend to.
        name: _submission.name,
        email: _submission.email,
        messageLength: _submission.message.length,
    });
}

// --- Server ----------------------------------------------------------------

const server = http.createServer(async (req, res) => {
    if (req.method === "OPTIONS") {
        res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Accept",
        });
        res.end();
        return;
    }

    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    if (req.method !== "POST" || url.pathname !== ENDPOINT) {
        sendJson(res, 404, { ok: false, error: "Not found" });
        return;
    }

    const contentType = (req.headers["content-type"] || "").toLowerCase();
    if (!contentType.includes("application/json")) {
        sendJson(res, 415, {
            ok: false,
            error: "Content-Type must be application/json.",
        });
        return;
    }

    try {
        const payload = await readJsonBody(req);
        const result = validate(payload);
        if (result.ok !== true) {
            sendJson(res, 400, {
                ok: false,
                error: result.error,
                field: result.field,
            });
            return;
        }

        await deliver(result.data);

        sendJson(res, 200, {
            ok: true,
            message: "Thanks — we'll be in touch shortly.",
        });
    } catch (err) {
        const status = err && err.status ? err.status : 500;
        sendJson(res, status, {
            ok: false,
            error:
                status === 413
                    ? "Your message is too long. Please shorten it and try again."
                    : status === 400
                      ? "We couldn't read your message. Please refresh and try again."
                      : "Something went wrong on our end.",
        });
    }
});

server.listen(PORT, HOST, () => {
    // eslint-disable-next-line no-console
    console.log(`[contact-handler] listening on http://${HOST}:${PORT}${ENDPOINT}`);
});