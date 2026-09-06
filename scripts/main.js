### Key files at a glance

| Path                                  | Purpose                                                                 |
| ------------------------------------- | ----------------------------------------------------------------------- |
| `public/index.html`                   | The single page: header, hero, features grid, contact form, footer.     |
| `styles/base.css`                     | Design tokens (colors, spacing, type scale), resets, and shared layout. |
| `styles/hero.css`                     | Hero headline, subheadline, CTA, and gradient background.               |
| `styles/features.css`                 | Responsive features grid (1/2/3 columns) and feature card visuals.      |
| `styles/contact.css`                  | Contact form layout, field states, and accessible error messaging.      |
| `scripts/main.js`                     | Boots the page and wires up shared behavior.                            |
| `scripts/contact.js`                  | Validates inputs and POSTs the contact form to a JSON endpoint.         |
| `server/contact-handler.example.js`   | Reference Node handler for the contact POST endpoint.                   |
| `package.json`                        | `preview` and `typecheck:js` npm scripts, `engines`, devDependencies.    |

## Deployment

The site is fully static — every file under `public/`, `scripts/`, and
`styles/` is served verbatim, and there is no build step.

1. **Point any static host at the repo root.** The entry point is
   `public/index.html`, and all asset paths in the markup are root-relative
   (e.g. `/styles/base.css`, `/scripts/main.js`), so the host must serve the
   project from a domain root or rewrite requests accordingly.
2. **Ensure MIME types are correct.** `serve`, GitHub Pages, Netlify, and
   Cloudflare Pages all serve `.html`, `.css`, and `.js` with the right types
   out of the box; if you front the site with a custom server, map those
   extensions to `text/html`, `text/css`, and `application/javascript`.
3. **(Optional) Wire the contact form to a backend.** The reference handler
   in `server/contact-handler.example.js` documents the request/response
   contract and can be deployed as a serverless function (Vercel, Netlify
   Functions, Cloudflare Workers) or mounted on any Node-based server. If
   no endpoint is configured, `scripts/contact.js` falls back to a simulated
   "queued" response so the static site is fully demoable on its own.
4. **Verify the deploy.** Load the deployed URL, confirm all asset requests
   return `200`, and submit the contact form to exercise the validation and
   success paths.

## What was built

Deliverables from this board:

- **Hero section** — top-of-page hero region with headline, supporting
  subheadline, primary and secondary CTAs, and a decorative visual card.
  Modern Inter typography, accessible sizing, polished gradient background,
  and a responsive layout that adapts cleanly to mobile.
- **Features section** — a responsive grid of six feature cards (1 column on
  mobile, 2 on tablet, 3 on desktop) covering the unified work graph,
  signal-over-noise digests, enterprise-grade security, AI-assisted
  planning, integrations, and real-time analytics. Each card has an
  accessible icon, title, and short description; consistent professional
  typography and a polished gradient background are used across the page.
- **Contact form** — a labeled, accessible form (name, email, message) with
  client-side validation, inline `aria-live` error messages, a honeypot for
  basic bot filtering, and a `fetch()` POST to a configurable endpoint. A
  reference Node handler in `server/contact-handler.example.js` documents
  the server contract (rate limiting, input length caps, JSON responses,
  CORS) and can be run standalone or mounted as a serverless function.
- **Shared page chrome** — site header with brand and primary nav,
  accessible skip-to-main-content link, footer with dynamic year stamp, and
  smooth in-page anchor scrolling that respects `prefers-reduced-motion`.
- **Static-host ready** — fully static frontend with an `npm run preview`
  command for local serving, an `npm run typecheck:js` command that
  validates every script with `node --check`, and clear deployment notes
  for hosting on GitHub Pages, Netlify, Cloudflare Pages, S3 + CloudFront,
  or `nginx`.