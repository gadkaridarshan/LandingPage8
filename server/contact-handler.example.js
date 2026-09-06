/* helix: server/contact-handler.example.js @helix:story USER-173000 */
/**
 * Reference Node.js handler for the Lumen contact form.
 *
 * This file is NOT loaded by the static site — it documents the contract the
 * browser expects when `window.LUMEN_CONTACT_ENDPOINT` is configured. Deploy
 * this (or any equivalent) to a reachable URL that accepts JSON POSTs, and set:
    //
 *   <script>window.LUMEN_CONTACT_ENDPOINT = '/api/contact';</script>
 *
 * before /scripts/contact.js loads.
 *
 * The handler is written as a plain Node http module so it runs on any
 * Node 18+ host without extra dependencies. Wire it into Express, Vercel,
 * Netlify, Cloudflare Workers, etc. by adapting the `handle` function.
 */

'use strict';

var http = require('http');

/**
 * Maximum request body size in bytes (~16KB). Contact payloads are tiny.
 */
var MAX_BODY_BYTES = 16 * 1024;

/**
 * Loose email regex. The browser already validates, but we re-check on the
 * server before doing any work.
 */
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Normalize the incoming JSON body into a typed payload.
 * Returns { ok: true, value } or { ok: false, errors }.
 */
function parsePayload(rawBody) {
    if (!rawBody) {
        return { ok: false, errors: { _: 'Request body is empty.' } };
    }
    var data;
    try {
        data = JSON.parse(rawBody);
    } catch (err) {
        return { ok: false, errors: { _: 'Request body is not valid JSON.' } };
    }

    var name = (typeof data.name === 'string') ? data.name.trim() : '';
    var email = (typeof data.email === 'string') ? data.email.trim() : '';
    var message = (typeof data.message === 'string') ? data.message.trim() : '';

    var errors = {};
    if (name.length < 2 || name.length > 120) {
        errors.name = 'Name must be between 2 and 120 characters.';
    }
    if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
        errors.email = 'Email must be a valid address.';
    }
    if (message.length < 10 || message.length > 4000) {
        errors.message = 'Message must be between 10 and 4,000 characters.';
    }
    if (Object.keys(errors).length > 0) {
        return { ok: false, errors: errors };
    }

    return {
        ok: true,
        value: {
            name: name,
            email: email,
            message: message,
            submittedAt: typeof data.submittedAt === 'string' ? data.submittedAt : new Date().toISOString(),
            source: typeof data.source === 'string' ? data.source : 'unknown'
        }
    };
}

/**
 * Persist the message. Replace this with your CRM, email service, or queue.
 * The default implementation logs to stdout so you can verify the wiring.
 */
function deliver(payload, callback) {
    // eslint-disable-next-line no-console
    console.log('[contact-handler] received message', {
        name: payload.name,
        email: payload.email,
        bytes: payload.message.length,
        source: payload.source,
        at: payload.submittedAt
    });
    return callback(null);
}

/**
 * Send a JSON response.
 */
function sendJson(res, status, body) {
    var payload = JSON.stringify(body);
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload),
        'Cache-Control': 'no-store'
    });
    res.end(payload);
}

/**
 * CORS preflight. Allows the form to POST from any origin during dev.
 * Lock this down for production by echoing the request origin or a whitelist.
 */
function handleCors(req, res) {
    res.writeHead(204, {
        'Access-Control-Allow-Origin': req.headers.origin || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
        'Access-Control-Max-Age': '600'
    });
    res.end();
}

/**
 * Core request handler. Exported so the same logic can be mounted in any
 * framework — wrap with Express, attach to Vercel/Netlify, etc.
 */
function handle(req, res) {
    if (req.method === 'OPTIONS') {
        return handleCors(req, res);
    }
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST, OPTIONS');
        return sendJson(res, 405, { ok: false, message: 'Method not allowed.' });
    }

    var chunks = [];
    var received = 0;
    var aborted = false;

    req.on('data', function (chunk) {
        if (aborted) { return; }
        received += chunk.length;
        if (received > MAX_BODY_BYTES) {
            aborted = true;
            req.destroy();
            return;
        }
        chunks.push(chunk);
    });

    req.on('end', function () {
        if (aborted) {
            return sendJson(res, 413, { ok: false, message: 'Request body too large.' });
        }
        var raw = Buffer.concat(chunks).toString('utf8');
        var parsed = parsePayload(raw);
        if (!parsed.ok) {
            return sendJson(res, 400, {
                ok: false,
                message: 'Validation failed.',
                errors: parsed.errors
            });
        }
        deliver(parsed.value, function (err) {
            if (err) {
                return sendJson(res, 502, {
                    ok: false,
                    message: 'Could not deliver message. Please try again later.'
                });
            }
            return sendJson(res, 200, {
                ok: true,
                message: 'Thanks — your message has been received. We\u2019ll be in touch within one business day.'
            });
        });
    });

    req.on('error', function () {
        if (res.headersSent) { return; }
        sendJson(res, 500, { ok: false, message: 'Unexpected server error.' });
    });
}

// Stand up a tiny dev server when this file is run directly:
//   node server/contact-handler.example.js
if (require.main === module) {
    var PORT = process.env.PORT || 3001;
    var server = http.createServer(handle);
    server.listen(PORT, function () {
        // eslint-disable-next-line no-console
        console.log('[contact-handler] listening on http://localhost:' + PORT);
    });
}

module.exports = { handle: handle, parsePayload: parsePayload };