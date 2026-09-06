# Lumen — Landing Page

A polished, single-page marketing site for **Lumen**, a modern SaaS product. It
introduces the product in a hero section, showcases capabilities in a features
grid, and lets visitors send inquiries through a contact form. The visual
treatment is professional — tasteful gradients, generous whitespace, accessible
typography, and accessible form controls — so the page reads as a finished
product surface, not a placeholder.

The frontend is fully static — plain HTML, CSS, and vanilla JavaScript served
over HTTP — so it can be hosted on any static-file host or previewed locally
without a build step.

---

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
  request/response shape. No environment variables are required to serve the
  static site itself.

---

## Quick Start (local preview)

```bash
# 1. Install the static file server (optional — `npx serve` works without it)
npm install --save-dev serve

# 2. Serve the project from the repo root
npx serve . -l 5173

# 3. Open the site
open http://localhost:5173/public/
```

Expected success check: the browser loads the Lumen landing page, the hero,
features grid, and contact form are visible, and the page reports no
404s in the browser DevTools **Network** tab for `base.css`, `hero.css`,
`features.css`, or `contact.css`.

---

## Production Deployment

The Lumen landing page is a fully static site — there is no build step, no
server-side rendering, and no runtime dependencies to install. Every file in
`public/` and `styles/` is served verbatim, and `scripts/main.js` /
`scripts/contact.js` are loaded directly by the browser. This means the
project ships cleanly to **any** static host that can serve files over HTTPS.

Below is a production-grade deployment workflow that covers build hygiene,
asset integrity, hosting options, the contact-form endpoint, environment
configuration, custom domains, monitoring, and rollback.

### 1. Prerequisites for production

Confirm the following on the deployment machine or CI runner:

- **Node.js 18+** and **npm 9+** are installed (`node --version`,
  `npm --version`).
- **Git** is installed and you have push access to the deployment target
  (GitHub, Netlify, Vercel, Cloudflare Pages, an S3 bucket, or your own
  server).
- **(Optional)** The **AWS CLI**, **Netlify CLI**, or **Vercel CLI** if you
  plan to deploy from the command line rather than via Git integration.
- **(Optional)** A **contact-form endpoint** URL — see
  [§ 5. Configure the contact form endpoint](#5-configure-the-contact-form-endpoint).
- A **TLS certificate** will be terminated by your host (Netlify, Vercel,
  Cloudflare, S3+CloudFront, nginx, Caddy, etc. all handle this for you).

### 2. Prepare a clean, deployable artifact

```bash
# 1. Clone the repository
git clone <your-repo-url> lumen-landing
cd lumen-landing

# 2. Check out the tag or commit you want to release
git checkout main
git pull
# Optional: pin to a release tag
# git checkout v1.0.0

# 3. Validate every JavaScript file parses
npm run typecheck:js

# 4. Optional: remove dev-only artifacts before uploading
# (the repo is already deployment-ready — nothing to strip)
```

Expected success check: `node --check` exits 0 on every script under
`scripts/` and no diagnostics are reported in VS Code for any file in
`public/`, `scripts/`, or `styles/`.

### 3. Choose a hosting target and deploy

Pick **one** of the following flows. All of them serve the site at
`https://<your-host>/` and require no build step.

#### Option A — Netlify (recommended for fastest setup)

```bash
# 1. Install the Netlify CLI
npm install --global netlify-cli

# 2. Authenticate
netlify login

# 3. Initialize the site (one-time)
netlify init
# When prompted:
#   - "Create & configure a new site" -> Yes
#   - Team: select your team
#   - Build command: leave blank
#   - Publish directory: . (repo root, since public/, styles/, scripts/
#     are referenced via absolute paths)

# 4. Deploy to a preview URL
netlify deploy

# 5. Promote the preview to production
netlify deploy --prod
```

Expected success check: `netlify deploy --prod` prints
`Website URL: https://<site-name>.netlify.app` and that URL returns HTTP 200
with the Lumen hero copy in the HTML.

#### Option B — Vercel

```bash
# 1. Install the Vercel CLI
npm install --global vercel

# 2. Authenticate
vercel login

# 3. Deploy (the CLI auto-detects the static project)
vercel --prod
```

When prompted, accept the defaults. Vercel will detect that there is no
build step and serve the repo root as a static site.

#### Option C — Cloudflare Pages

```bash
# 1. Install wrangler
npm install --global wrangler

# 2. Authenticate
wrangler login

# 3. Create the project (one-time)
wrangler pages project create lumen-landing --production-branch main

# 4. Deploy
wrangler pages deploy . --project-name lumen-landing
```

Expected success check: `wrangler pages deploy` prints
`Deployment complete! Visit: https://<hash>.lumen-landing.pages.dev`.

#### Option D — AWS S3 + CloudFront

```bash
# 1. Configure AWS credentials
aws configure
# Provide Access Key, Secret, default region (e.g. us-east-1), output json

# 2. Create the bucket (skip if it does)
aws s3api create-bucket \
  --bucket lumen-landing.example.com \
  --region us-east-1

# 3. Allow public read of static objects
aws s3api put-bucket-policy --bucket lumen-landing.example.com --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::lumen-landing.example.com/*"
  }]
}'

# 4. Sync the repo to the bucket
aws s3 sync . s3://lumen-landing.example.com/ \
  --exclude ".git/*" \
  --exclude "node_modules/*" \
  --exclude ".vscode/*" \
  --exclude ".helix/*" \
  --exclude "package*.json" \
  --exclude "README.md" \
  --exclude "Helix*.md" \
  --delete

# 5. (Optional) Invalidate CloudFront so changes go live immediately
aws cloudfront create-invalidation \
  --distribution-id <YOUR_DISTRIBUTION_ID> \
  --paths "/*"
```

Expected success check:
`curl -I https://lumen-landing.example.com/` returns `HTTP/2 200` and a
`content-type: text/html` header, and the page renders the hero, features, and
contact sections.

#### Option E — Any plain web server (nginx, Caddy, Apache)

```bash
# Example: copy the repo to a server and serve with nginx
rsync -avz --exclude '.git' --exclude 'node_modules' \
  ./ user@lumen.example.com:/var/www/lumen/

# On the server, an nginx server block:
# server {
#   listen 443 ssl http2;
#   server_name lumen.example.com;
#   root /var/www/lumen;
#   index public/index.html;
#   location / { try_files $uri $uri/ /public/index.html; }
# }
sudo nginx -t && sudo systemctl reload nginx
```

Expected success check: `https://lumen.example.com/` loads the landing page
with no mixed-content warnings in the browser console.

### 4. Verify the deployment

Run the following checks after every production deploy:

```bash
# 1. The site responds with HTTP 200
curl -I https://lumen.example.com/

# 2. The HTML references the expected stylesheet and script assets
curl -s https://lumen.example.com/ \
  | grep -E '/(styles|scripts)/' \
  | sort -u

# 3. Each linked asset returns 200 (no 404s)
for path in \
  /styles/base.css \
  /styles/hero.css \
  /styles/features.css \
  /styles/contact.css \
  /styles.css \
  /scripts/main.js \
  /scripts/contact.js; do
  echo -n "$path -> "
  curl -o /dev/null -s -w "%{http_code}\n" "https://lumen.example.com$path"
done

# 4. Confirm the Inter web font loads
curl -I "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
```

Expected success check: every line of the loop above prints `200`, the
landing page renders without layout shifts, and the browser DevTools
**Network** tab shows zero failed requests.

### 5. Configure the contact form endpoint

The contact form (`public/index.html` + `scripts/contact.js`) posts a JSON
payload to a configurable endpoint. By default it points at a relative
`/api/contact` path. In production you must point it at a reachable URL that
accepts `POST application/json`.

**5.1. Wire it up (frontend):**

Open `scripts/contact.js` and update the endpoint constant near the top of
the file:

```javascript
// helix: scripts/contact.js
const CONTACT_ENDPOINT = 'https://api.lumen.example.com/contact';
```

You can also point at a serverless function you own (Netlify Function,
Cloudflare Worker, Vercel API route, Lambda Function URL, etc.). See the
reference implementation in `server/contact-handler.example.js` for the
expected request and response shape.

**5.2. Deploy a handler (server example using Netlify Functions):**

Create `netlify/functions/contact.js`:

```javascript
// helix: netlify/functions/contact.js
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }
  const { name, email, message } = payload;
  if (!name || !email || !message) {
    return {
      statusCode: 422,
      body: JSON.stringify({ error: 'Missing required field', fields: { name, email, message } }),
    };
  }
  // TODO: forward to your CRM, email provider, or queue (SES, SendGrid, Postmark, etc.)
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ok: true }),
  };
};
```

Then set the frontend endpoint to `/api/contact` (Netlify will route any
path under `/.netlify/functions/<name>` automatically):

```javascript
// helix: scripts/contact.js
const CONTACT_ENDPOINT = '/.netlify/functions/contact';
```

**5.3. Verify the form end-to-end:**

```bash
curl -X POST https://lumen.example.com/api/contact \
  -H 'content-type: application/json' \
  -d '{"name":"Ada","email":"ada@example.com","message":"Hello from curl"}'
```

Expected success check: the response is `200 OK` with body
`{"ok":true}`. Open the live site, submit the contact form, and confirm the
success message appears in the UI.

### 6. Custom domain & HTTPS

- **Netlify / Vercel / Cloudflare Pages** — add the domain in the dashboard,
  then point your DNS `CNAME` (or `ALIAS`/`A`) at the host's target. TLS is
  provisioned automatically within a few minutes.
- **S3 + CloudFront** — request or import a cert in **AWS Certificate
  Manager** for the custom domain, attach it to the CloudFront distribution,
  and add an **A (alias)** record from the apex to the distribution.
- **nginx / Caddy** — terminate TLS locally (e.g. `certbot --nginx -d
  lumen.example.com`) or front the server with Cloudflare.

Expected success check:
`https://lumen.example.com/` loads with a valid certificate, the browser
address bar shows a padlock, and `https://www.ssllabs.com/ssltest/` reports
grade **A** or better.

### 7. Performance & SEO checklist

Before announcing the launch, verify the following on the production URL:

- Lighthouse (Chrome DevTools → Lighthouse) — Performance ≥ 95,
  Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95.
- `meta description` is present (`<meta name="description" ...>` in
  `public/index.html`).
- `<title>` is descriptive ("Lumen — Turn scattered work into clear flow").
- All `<img>` (if any) have descriptive `alt` attributes; decorative SVGs
  use `aria-hidden="true"`.
- The skip link `<a class="skip-link" href="#main">` jumps to `<main id="main">`
  when activated.
- Every form input has an associated `<label>` (already true for the contact
  form).
- HTTP/2 or HTTP/3 is enabled (automatic on Netlify / Vercel / Cloudflare /
  CloudFront).
- The Google Fonts stylesheet uses `display=swap` (already configured in
  `public/index.html`).

### 8. Monitoring & rollback

- **Uptime monitoring** — point a service such as
  [UptimeRobot](https://uptimerobot.com), [Better Uptime](https://betteruptime.com),
  or [Pingdom](https://www.pingdom.com) at `https://lumen.example.com/` with
  a 1-minute check.
- **Error tracking** — add a `<script>` snippet for
  [Sentry](https://sentry.io) or a similar tool before `</body>` in
  `public/index.html` if you need front-end error visibility.
- **Rollback** — every option above is stateless and reversible:
  - **Netlify:** `netlify rollback` (or click **Publish deploy** on a prior
    deploy in the dashboard).
  - **Vercel:** `vercel rollback` (or use the **Promote to Production**
    button on a previous deployment).
  - **Cloudflare Pages:** rollback from the **Deployments** tab in the
    dashboard.
  - **S3:** `aws s3 sync <previous-tar> s3://lumen-landing.example.com/ --delete`
    from a known-good backup, then invalidate CloudFront.
  - **nginx:** redeploy the previous artifact to `/var/www/lumen` and reload.

### 9. Going live — final checklist

```text
[ ] `npm run typecheck:js` passes locally
[ ] Production deploy succeeded (URL responds 200)
[ ] All stylesheet and script assets return 200 (no 404s)
[ ] Contact form submits and returns 200 from the handler
[ ] Custom domain + HTTPS verified (padlock in the browser)
[ ] Lighthouse scores ≥ 95 across Performance, Accessibility,
    Best Practices, SEO
[ ] Uptime monitor is active and paged to the on-call channel
[ ] Rollback procedure tested on a staging environment
```

---

## Scripts

```bash
# Validate every JavaScript file with `node --check`
npm run typecheck:js

# Serve the site locally on http://localhost:5173
npm run start   # if defined, otherwise: npx serve . -l 5173
```

---

## Project structure

```text
.
├── public/
│   ├── index.html        # Single-page markup (hero, features, contact)
│   └── styles.css        # Compiled/legacy hero styles (kept for back-compat)
├── styles/
│   ├── base.css          # Reset + tokens
│   ├── hero.css          # Hero section
│   ├── features.css      # Features grid
│   └── contact.css       # Contact form
├── scripts/
│   ├── main.js           # Page-level interactions (nav, smooth-scroll)
│   └── contact.js        # Contact-form validation + POST
├── server/
│   └── contact-handler.example.js  # Reference backend for the form
├── package.json
└── README.md
```

---

## License

MIT — see `LICENSE` if present, otherwise treat as MIT-licensed open source.