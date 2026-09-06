## NPM scripts

| Script              | What it does                                                                 |
| ------------------- | ---------------------------------------------------------------------------- |
| `npm run preview`   | Serves `public/` on `http://localhost:3000` via `npx --yes serve`.            |
| `npm run typecheck:js` | Runs `node --check` against every file under `scripts/` and `server/`.    |

## Accessibility & browser support

- Semantic landmarks (`<header role="banner">`, `<main>`, `<nav>`, `<footer>`)
  and a skip-to-content link for keyboard users.
- Form controls are labelled, focusable, and announce error states via
  `aria-live="polite"` regions.
- Color contrast meets WCAG AA across the hero, features, folders, and
  contact sections.
- Layouts are responsive from ~320px up to 1440px+; tested in the latest
  Chrome, Firefox, Safari, and Edge.

## License

MIT — see the repository's `LICENSE` file if present, or treat the project
as MIT-licensed by default.

---

### Quick answer

To deploy **Lumen** to production: pick any static host (GitHub Pages,
Netlify, Cloudflare Pages, S3 + CloudFront, or `nginx`), set the **publish
directory** to `public`, leave the **build command** empty (there is no build
step), enable HTTPS, wire `/api/contact` to a serverless function based on
`server/contact-handler.example.js` if you want the form to deliver to your
inbox, then run the eight-step **Verification** checklist from a private
browser window before announcing the URL.