# Lumen — Landing Page

A polished, single-page marketing site for **Lumen**, a modern SaaS product
that turns scattered work into clear, actionable flow. The page introduces the
product in a hero section, showcases capabilities in a features grid, and lets
visitors send inquiries through a contact form. The visual treatment is
professional — tasteful gradients, generous whitespace, accessible typography,
and accessible form controls — so the page reads as a finished product surface,
not a placeholder.

The frontend is fully static — plain HTML, CSS, and vanilla JavaScript served
over HTTP — so it can be hosted on any static-file host (GitHub Pages, Netlify,
Cloudflare Pages, S3 + CloudFront, `nginx`, etc.) or previewed locally without
a build step. There is no framework runtime, no bundler, and no client-side
dependency to install.

## Prerequisites

- **Node.js 18 or newer** — required to run `npm run preview` (which uses
  `npx --yes serve`) and the `npm run typecheck:js` script, which validates
  every JavaScript file with `node --check`. The `engines` field in
  `package.json` enforces this minimum.
- **npm 9+** — ships with Node.js 18; used to invoke `npx` and (optionally) to
  install `serve` as a dev dependency declared in `package.json`.
- **A modern browser** — Chrome, Firefox, Safari, or Edge — for local preview
  and contact-form interaction. The page uses modern CSS (custom properties,
  `clamp()`, grid) and standard ES2015+ JavaScript.
- **`npx`** — bundled with npm; used to fetch `serve` on demand if you skip
  the local install.
- *(Optional)* **A reachable JSON endpoint** that accepts `POST` requests with
  a JSON body if you want to exercise the contact form end-to-end. The
  reference handler in `server/contact-handler.example.js` documents the
  expected request/response shape and can be used as a starting point for a
  custom backend. No environment variables are required to serve the static
  site itself.

## Running locally

1. **Install the dev dependency** (optional — you can skip this and let `npx`
   fetch `serve` on demand the first time you run the preview):
   ```bash
   npm install
   ```
2. **Validate the JavaScript** so you know the scripts are syntactically sound
   before serving:
   ```bash
   npm run typecheck:js
   ```
   Expected output: no errors and a zero exit code from each `node --check`
   invocation covering `scripts/main.js`, `scripts/contact.js`, and
   `server/contact-handler.example.js`.
3. **Start the static server** from the repo root:
   ```bash
   npm run preview
   ```
   This runs `npx --yes serve .` and binds to a local port (the default is
   `http://localhost:3000`; pass `-- -l 5173` to pin the port):
   ```bash
   npm run preview -- -l 5173
   ```
4. **Verify success** by opening the printed URL in a browser. Confirm that:
   - The Lumen hero, features grid, and contact form all render with the
     expected typography, spacing, and gradient backgrounds.
   - The browser DevTools **Network** tab reports `200` for `/`,
     `/index.html`, `/styles.css`, `/styles/base.css`, `/styles/hero.css`,
     `/styles/features.css`, `/styles/contact.css`, `/scripts/main.js`, and
     `/scripts/contact.js`.
   - The contact form shows inline validation messages when fields are left
     blank or the email is malformed, and accepts a valid submission.
   - The "Skip to main content" link becomes visible on keyboard focus, and
     all interactive controls have visible focus rings.

## Project Structure