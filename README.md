# Lumen — Landing Page

A polished, single-page marketing site for **Lumen**, a modern SaaS product.
The page introduces the product in a hero section, showcases capabilities in a
features grid, and lets visitors send inquiries through a contact form. The
visual treatment is professional — tasteful gradients, generous whitespace,
accessible typography, and accessible form controls — so the page reads as a
finished product surface, not a placeholder.

The frontend is fully static — plain HTML, CSS, and vanilla JavaScript served
over HTTP — so it can be hosted on any static-file host (GitHub Pages,
Netlify, Cloudflare Pages, S3 + CloudFront, `nginx`, etc.) or previewed
locally without a build step. There is no framework runtime, no bundler, and
no client-side dependency to install.

## Prerequisites

- **Node.js 18 or newer** — required to run `npm run preview` (which uses
  `npx --yes serve`) and the `npm run typecheck:js` script, which validates
  every JavaScript file with `node --check`. The `engines` field in
  `package.json` enforces this minimum.
- **npm 9+** — ships with Node.js 18; used to invoke `npx` and (optionally)
  to install `serve` as a dev dependency declared in `package.json`.
- **A modern browser** — Chrome, Firefox, Safari, or Edge — for local
  preview and contact-form interaction. The page uses modern CSS (custom
  properties, `clamp()`, CSS Grid, `aspect-ratio`) and ES2019+ JavaScript.
- **An HTTP origin** — the page must be served over `http://` or
  `https://` (not opened via `file://`) so that relative asset paths, the
  Google Fonts request, and the contact form's network submission behave
  correctly.
- **An optional POST endpoint** — `scripts/contact.js` posts inquiries to
  `/api/contact`. If you do not deploy the reference handler in
  `server/contact-handler.example.js`, the form gracefully falls back to a
  `mailto:` link so visitors can still reach you.

## Running locally

1. **Install dependencies.**

   ```bash
   npm install
   ```

   This installs `serve` (declared in `package.json` `devDependencies`) so
   `npm run preview` can launch it via `npx`.

2. **Run the JavaScript syntax checker (optional but recommended).**

   ```bash
   npm run typecheck:js
   ```

   This runs `node --check` against every file in `scripts/` and `server/`
   so syntax errors surface before you start the server.

3. **Start the preview server.**

   ```bash
   npm run preview
   ```

   This runs `serve --no-clipboard public`, which serves the `public/`
   directory on port `3000` by default.

4. **Verify the page loads correctly.**

   Open <http://localhost:3000/> in a modern browser. You should see:

   - The Lumen **hero** loads with the headline, subheadline, and primary
     CTA rendered in the Inter font stack.
   - The **features** grid displays its cards in three columns on desktop
     (one column on narrow viewports) with the polished gradient backdrop.
   - The **contact** form renders labelled inputs (name, email, message),
     accepts client-side validation, and posts to `/api/contact` when the
     backend is reachable (or opens a `mailto:` fallback otherwise).

   If all three sections render correctly, the local environment is healthy.

## Project Structure