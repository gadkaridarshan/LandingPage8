<!-- helix: README.md -->
# Lumen — LandingPage8

A polished, single-page marketing site for a modern SaaS product called **Lumen**.
The page introduces the product in a hero section with a headline, supporting
sub-copy, and a primary call-to-action; showcases capabilities in a responsive
features grid of icon-led cards; and lets visitors send inquiries through a
fully validated contact form. Submissions are POSTed as JSON to a configurable
endpoint (default `/api/contact`); a reference Node.js backend handler is
included at [`server/contact-handler.example.js`](./server/contact-handler.example.js)
to document the expected request and response shape.

The frontend is fully static — plain HTML, CSS, and vanilla JavaScript served
over HTTP — so it can be hosted on any static-file host or previewed locally
without a build step.

## Prerequisites

- **Node.js 18 or newer** — required to run `npx --yes serve` and the
  `typecheck:js` script, which validates the bundled JavaScript with
  `node --check`.
- **npm 9+** — ships with Node.js 18; used to invoke `npx` and (optionally) to
  install `serve` locally.
- **A modern browser** — Chrome, Firefox, Safari, or Edge — for local preview
  and form interaction.
- **`npx`** — bundled with npm; used to fetch `serve` on demand if you skip the
  local install.
- *(Optional)* **A reachable JSON endpoint** that accepts `POST` requests if
  you want to exercise the contact form end-to-end. The reference handler in
  `server/contact-handler.example.js` documents the expected
  request/response shape. No environment variables are required to run the
  static site; to override the submission target at runtime, set
  `window.LUMEN_CONTACT_ENDPOINT` before `scripts/main.js` loads.

## Running locally

1. **Install the local dev dependency** (only `serve` is needed; `npx` will
   fetch it on demand, but installing once avoids the prompt):

   ```bash
   npm install --no-save serve
   ```

2. **Start the static site** on port 4173:

   ```bash
   npm start
   ```

   This runs `npx --yes serve -l 4173 .`, serving the workspace root so that
   `public/index.html` is available at the root URL.

3. **Verify it worked** by opening <http://localhost:4173/> in your browser.
   You should see the Lumen landing page with the hero, features grid, and
   contact form. As an alternative smoke test from a terminal:

   ```bash
   curl -sSf http://localhost:4173/ | head -n 5
   ```

   You should see the start of the `index.html` document (`<!doctype html>…`).

4. **(Optional) Syntax-check the JavaScript** that ships with the page:

   ```bash
   npm run typecheck:js
   ```

   This runs `node --check` against `scripts/contact.js`, `scripts/main.js`,
   and `server/contact-handler.example.js`, failing fast on any parse error.

## Project Structure