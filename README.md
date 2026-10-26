# Chamika rj — final Vercel portfolio

Exported 26 October 2026 from source commit `8765d82cf05498decba43242b01528cc99cf6509`.

This package contains the full current portfolio: interactive 3D city/robot (WebGL and geometry-based compatibility renderer), dark/light themes, latest YouTube feed/player, About/Education horizontal journey, academic classification, work experience, draggable tools ticker, verified Google Form messages, background music with vertical volume slider/ring and wheel adjustment, final hero motion/glow, responsive styling and assets.

## Deploy the included ready-built version

Copy the CONTENTS of this folder into your existing portfolio GitHub repository root. Keep your repository's `.git` directory and your local `.env` file. Do not upload the ZIP itself or `node_modules`. Commit on your Vercel production branch (usually `main`) and push.

Use your EXISTING Vercel project to retain your custom domain and environment variables:

| Setting | Value |
| --- | --- |
| Framework Preset | Other |
| Root Directory | Folder containing this README and vercel.json (normally repository root) |
| Install Command | Empty/disabled (configured in vercel.json) |
| Build Command | Empty/disabled (configured in vercel.json) |
| Output Directory | public |
| Node.js | 24.x |

The JS bundles and API functions are already built and included. No build or dependency installation is needed for deployment. `vercel.json` carries these settings; remove any old dashboard command override that conflicts with them.

Vercel's Git integration automatically deploys pushes to the production branch. See the deployment's status under Deployments; use the production URL only after Ready. A push to another branch normally creates a preview instead.

## Environment variables

Keep existing `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` values in Vercel Project Settings → Environment Variables for Production. This ZIP intentionally contains no secret values. The public key is injected by `/api/index` at runtime, and the secret is used only by `/api/message`. If values change, redeploy. Ensure Cloudflare Turnstile's allowed hostnames include your Vercel/custom domain.

The contact form sends to the existing Google Form after server-side verification. Live submission was not performed during export testing. Local preview without keys shows verification unavailable; this is expected.

YouTube refreshes through `/api/youtube`, with a five-minute server cache, client refresh while visible and a snapshot fallback. Public uploads may take time to appear in YouTube's feed.

Background music starts at 12%; browsers may require a click/key press to allow audible autoplay. The icon toggles playback. Hover (or tap on mobile) opens a vertical volume slider. Scrolling the page dismisses it; wheel movement over the icon adjusts volume instead of scrolling the page.

## Local preview (Node.js 24)

Copy `.env.example` to `.env` and enter keys locally only if you need verification. Then:

```bash
npm start
```

Open http://localhost:3000. The packaged assets run without `npm install`.

## Edit source and rebuild (only for later code edits)

- `src/portfolio-markup.ts`: site content/layout
- `public/styles.css`, `public/*.js`: theme and browser interactions
- `src/components/hero-city/`: full 3D source
- `src/app/api/`: original current server routes
- `src/lib/academic-record.json`: academic snapshot
- `scripts/build.mjs`: produces public/city bundles, api/message.js, api/youtube.js and lib/homepage.html

```bash
npm install
npm run build
npm test
```

Commit BOTH source and regenerated `public/city`, `api` and `lib/homepage.html` files. Vercel deploys these built files as supplied; it does not rebuild on the server. If editing only a plain file in `public`, no rebuild is needed.

## Validation

Built client and server bundles successfully. Automated checks cover final homepage content/assets, runtime public-key injection and contact origin/method rejection. Local browser QA confirmed the real compatibility 3D scene, scene pause, music controls and final navigation. WebGL rendering depends on the viewing device; the cloud test browser used the compatibility renderer. No real contact submission was sent and no deployment to your external Vercel account was made.

References: https://vercel.com/docs/git and https://vercel.com/docs/functions/runtimes/node-js
