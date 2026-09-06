`npm run typecheck:js` runs `node --check` against each file in `scripts/`
and `server/` so syntax errors surface before deployment.

## Production deployment

The site is 100% static, so any host that can serve files over HTTP works.
Pick the section below that matches your platform. Every option ships the
contents of `public/` as static assets and leaves `styles/`, `scripts/`, and
`server/` (the optional contact handler example) alongside it at the site root.

### Before you deploy — production checklist

1. **Build nothing.** There is no build step. Whatever is in `public/`,
   `styles/`, and `scripts/` is what gets served.
2. **Keep the directory layout intact.** `index.html` references assets via
   absolute paths (`/styles/base.css`, `/scripts/main.js`, …). Either serve
   the repository root so those paths resolve, or upload the full tree
   (`public/`, `styles/`, `scripts/`, `server/`) to your host's web root and
   configure the host to serve `public/index.html` as the directory index.
3. **Set correct MIME types.** The host must serve `.css` as `text/css`,
   `.js` as `application/javascript`, and `.html` as `text/html`. All major
   static hosts do this by default.
4. **Force HTTPS.** Browsers block the Google Fonts request and downgrade the
   contact form on plain HTTP. Use your host's TLS settings or put the site
   behind Cloudflare.
5. **Wire up the contact form** (optional). `scripts/contact.js` posts to
   `/api/contact` by default. See `server/contact-handler.example.js` for a
   reference implementation and deploy it as a serverless function (Cloudflare
   Worker, Netlify Function, Vercel Function, AWS Lambda behind API Gateway,
   etc.). If you skip this step, the form will fall back to a `mailto:` link
   and still work for visitors.
6. **Set caching headers.** Static assets in `styles/` and `scripts/` are
   safe to cache for a long time (e.g. `Cache-Control: public, max-age=31536000, immutable`).
   Serve `index.html` with a short cache (or `no-cache`) so updates roll out
   immediately.
7. **Verify after deploy.** Run the **Verification** checklist at the bottom
   of this section from a fresh browser profile.

### Option A — GitHub Pages

1. Push the repository to GitHub.
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the branch you want to publish (commonly `main`) and set the
   folder to `/` (repository root). Because `index.html` lives in
   `public/`, set the folder to `/public` instead — GitHub Pages will serve
   `public/index.html` as the site root.
5. Click **Save**. GitHub Pages will print the live URL
   (`https://<user>.github.io/<repo>/`).
6. (Optional) Add a custom domain: create a `CNAME` file in `public/`
   containing the bare domain, then point the domain's DNS to GitHub.

   ```bash
   echo "lumen.example.com" > public/CNAME
   git add public/CNAME
   git commit -m "Add custom domain for GitHub Pages"
   git push
   ```

### Option B — Netlify

1. Sign in to Netlify and choose **Add new site → Deploy manually** (or
   connect the Git repo for continuous deploys).
2. For a manual drop, drag the project folder onto the deploy box.
3. For a Git-connected deploy, set:
   - **Build command:** *(leave empty — no build step)*
   - **Publish directory:** `public`
4. Click **Deploy site**. Netlify assigns a `*.netlify.app` URL.
5. (Optional) Add a `netlify.toml` at the project root to lock in settings:

   ```toml
   [build]
     publish = "public"

   [[headers]]
     for = "/styles/*"
     [headers.values]
       Cache-Control = "public, max-age=31536000, immutable"

   [[headers]]
     for = "/scripts/*"
     [headers.values]
       Cache-Control = "public, max-age=31536000, immutable"

   [[headers]]
     for = "/*"
     [headers.values]
       X-Frame-Options = "DENY"
       X-Content-Type-Options = "nosniff"
       Referrer-Policy = "strict-origin-when-cross-origin"
   ```

6. (Optional) Add a serverless function for the contact form: drop a file at
   `netlify/functions/contact.js` that wraps
   `server/contact-handler.example.js`, and the form will POST to
   `/.netlify/functions/contact`. Update the `endpoint` in
   `scripts/contact.js` if you choose a different path.

### Option C — Cloudflare Pages

1. In the Cloudflare dashboard, open **Workers & Pages → Create → Pages →
   Connect to Git**.
2. Select the repository.
3. Set:
   - **Framework preset:** *None*
   - **Build command:** *(empty)*
   - **Build output directory:** `public`
4. Click **Save and Deploy**. Cloudflare Pages assigns a `*.pages.dev` URL.
5. (Optional) Add a **Custom domain** under the project's **Settings** tab.
6. (Optional) Add a Worker for `/api/contact` using
   `server/contact-handler.example.js` as the starting point.

### Option D — AWS S3 + CloudFront

1. Create an S3 bucket (e.g. `lumen-prod`) with **Block all public access**
   initially, then attach a bucket policy that allows public `s3:GetObject`
   for the objects you upload.
2. Enable **Static website hosting** on the bucket and set both the *Index
   document* and *Error document* to `index.html`.
3. Upload the site contents, preserving the directory layout. Either upload
   the whole repo root so paths like `/styles/base.css` resolve, or upload
   `public/`, `styles/`, `scripts/`, and `server/` to the bucket root.

   ```bash
   aws s3 sync ./public  s3://lumen-prod/ --delete --exclude "*.example.js"
   aws s3 sync ./styles  s3://lumen-prod/styles  --delete --cache-control "public, max-age=31536000, immutable"
   aws s3 sync ./scripts s3://lumen-prod/scripts --delete --cache-control "public, max-age=31536000, immutable"
   ```

4. Create a CloudFront distribution with the S3 bucket as the origin, set
   **Default root object** to `index.html`, and request an ACM certificate
   in `us-east-1` for your custom domain.
5. Add an alternate domain name to the distribution and update Route 53 (or
   your DNS provider) with an `ALIAS` record pointing at the distribution
   domain.
6. (Optional) Put a Lambda@Edge or API Gateway + Lambda in front of
   `/api/contact` using the handler in `server/contact-handler.example.js`.

### Option E — Any static host (nginx, Caddy, Apache, S3-compatible, …)

1. Copy the project to the server (or mount it from a deploy artifact).
2. Point the web root at the directory that contains `public/index.html`,
   and configure the host to serve `public/index.html` as the directory
   index (or symlink `public/` to the web root and ship the rest alongside).
3. Enable gzip or Brotli for `text/html`, `text/css`, and
   `application/javascript`.
4. Add long-lived `Cache-Control` headers for `/styles/*` and `/scripts/*`,
   and short or no caching for `index.html`.
5. (Optional) Reverse-proxy `/api/contact` to a Node service that wraps
   `server/contact-handler.example.js`.

A minimal nginx server block that serves the repo with `/api/contact`
proxied to a local Node handler: