# Lumen — Landing page

A polished, single-page marketing site for a modern SaaS product. It introduces
the product in a hero section, showcases capabilities in a features grid, and
lets visitors send inquiries through a contact form. The visual treatment is
professional — tasteful gradients, generous whitespace, accessible typography,
and accessible form controls — so the page reads as a finished product surface,
not a placeholder.

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
  request/response shape. No environment variables are required for the
  frontend to render.

## Project layout