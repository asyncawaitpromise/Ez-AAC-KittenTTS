# Ez AAC · KittenTTS

An offline-first AAC (augmentative & alternative communication) board: tap
core-vocabulary tiles to build a sentence, hear it spoken instantly. All
speech synthesis runs **on-device** — [KittenTTS Mini
v0.8](https://huggingface.co/KittenML/kitten-tts-mini-0.8) (an 80M-parameter
StyleTTS 2 model) via [ONNX Runtime
Web](https://onnxruntime.ai/docs/tutorials/web/) (WASM), with in-browser
phonemization via [phonemizer.js](https://www.npmjs.com/package/phonemizer).
Nothing typed or spoken ever leaves the device — no server, no API key, no
network required after the first load.

Installs as a PWA, deployed to Cloudflare Workers (static assets).

## How the speech engine works

- On first launch, the user opts into a one-time ~80MB download of the
  [ONNX-exported model, voices, and config](https://huggingface.co/onnx-community/KittenTTS-Mini-v0.8-ONNX)
  from Hugging Face. It's cached in the browser's Cache Storage
  (`src/lib/tts/cache.js`) — from then on the board works fully offline.
- Inference (tokenizing → phonemizing → running the ONNX graph) happens in a
  Web Worker (`src/workers/tts.worker.js` → `src/lib/tts/engine.js`) so
  tapping a tile never blocks the UI.
- The tokenizer, `.npz` voice-embedding parser, and ONNX input/output
  contract in `src/lib/tts/` are ported from the reference browser build at
  [huggingworld/offline-kittentts-0.8-webgpu](https://huggingface.co/spaces/huggingworld/offline-kittentts-0.8-webgpu) —
  KittenTTS 0.8 ships in an "ONNX2" format most tooling doesn't yet support
  natively (see [sherpa-onnx#3196](https://github.com/k2-fsa/sherpa-onnx/issues/3196)),
  so this is the one known-working path in-browser.
- 8 built-in voices (Bella, Jasper, Luna, Bruno, Rosie, Hugo, Kiki, Leo) and
  an adjustable speaking rate, changeable from the settings panel.

The starter vocabulary in `src/lib/aac/vocabulary.js` uses the Fitzgerald Key
color convention (yellow = pronouns, green = verbs, blue = descriptors,
orange = nouns, pink = social, purple = questions) common to AAC systems like
Unity and LAMP — swap in your own board there.

## Stack

- [Astro 5](https://astro.build) — static site generator
- [React 19](https://react.dev) — interactive components via `client:load`
- [ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/) + [phonemizer](https://www.npmjs.com/package/phonemizer) — on-device TTS
- [Tailwind CSS](https://tailwindcss.com) + [DaisyUI](https://daisyui.com) — styling
- [Lucide React](https://lucide.dev) — icons
- [@vite-pwa/astro](https://vite-pwa-org.netlify.app/frameworks/astro) — installable, offline-capable PWA
- [Cloudflare Workers](https://developers.cloudflare.com/workers/static-assets/) — static asset hosting + branch previews

No server, no Docker, no registry — just `pnpm run deploy`. Worker name and custom domain live only in `.env.local` / GitHub Secrets and are provisioned automatically on deploy — nothing to edit in `wrangler.toml`, no dashboard step required.

## First-time setup

### 1. Clone and configure env

```bash
cp .env.example .env.local
# fill in CF_ACCOUNT_ID, CF_API_TOKEN, CF_WORKER_NAME
```

`CF_WORKER_NAME` isn't just a label — it's the identifier you deploy to and access the site through (`https://<name>.<account-subdomain>.workers.dev`, and `<name>-pr-<N>...` for previews). It's set once here; `scripts/deploy.sh` passes it to `wrangler deploy --name`, so it never needs to be repeated in `wrangler.toml`.

Get your API token at [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) → **Create Custom Token**.

Cloudflare's token editor scopes each permission row to a single resource type, so add the rows below ("+ Add more"):

| Row | Resources | Permission |
|---|---|---|
| 1 (required) | Account → your account | Workers Core → **Workers Scripts** → Edit |
| 2 (only if setting a custom domain) | Zone → your domain (or All zones) | DNS & Zones → **Zone** → Edit |
| 3 (only if setting a custom domain) | Zone → your domain (or All zones) | DNS & Zones → **DNS** → Edit |
| 4 (only if setting a custom domain) | Zone → your domain (or All zones) | **Workers Routes** → Edit |

Rows 2–4 gate three distinct parts of a custom-domain deploy (zone access, DNS record creation, route attachment) — all three are required together if you set `CF_CUSTOM_DOMAIN`; skip them if you're only deploying to the default `workers.dev` subdomain.

If you want a custom domain, just set `CF_CUSTOM_DOMAIN` below — nothing to edit in `wrangler.toml`. `scripts/deploy.sh` passes it to `wrangler deploy --domains`, which creates the DNS record and provisions the certificate automatically.

### 2. Validate your env

```bash
./scripts/scaffold.sh
```

Checks `.env.local` has the required vars before you go further.

### 3. Sync CI secrets to GitHub

```bash
./scripts/sync-secrets.sh
```

Pushes `CF_ACCOUNT_ID`, `CF_API_TOKEN`, `CF_WORKER_NAME`, `CF_CUSTOM_DOMAIN` to GitHub Secrets so CI can deploy.

### 4. Encrypt your env for the repo (optional but recommended)

```bash
./scripts/env-crypt.sh encrypt
git add .env.local.enc && git commit -m "chore: add encrypted env"
```

Future devs/machines: `./scripts/env-crypt.sh decrypt` to restore `.env.local`.

### 5. Deploy

```bash
pnpm run deploy
```

Builds and deploys to production in one step — this also handles the very first deploy.

## CI

| Event | Action |
|---|---|
| Push to `main`/`master` with `[deploy]` anywhere in the commit message | Build + deploy to production |
| Manual trigger (Actions tab → Deploy → Run workflow) | Build + deploy to production |
| PR labeled `preview` (or updated/reopened while labeled) | Build + deploy a per-PR preview Worker |
| PR closed | Delete that PR's preview Worker |

Deploys are opt-in per commit/merge so routine PRs don't ship automatically — put `[deploy]` in the commit message (or PR title, for merge/squash commits) when you actually want it live.

Branch preview URLs: `https://<worker-name>-pr-<number>.<account-subdomain>.workers.dev` (requires a `workers.dev` subdomain enabled on your account).

## Local dev

```bash
pnpm install
pnpm dev
```

## Scripts

| Script | Purpose |
|---|---|
| `scripts/scaffold.sh` | Validates `.env.local` before your first deploy |
| `scripts/deploy.sh` | Builds and deploys (used by `pnpm run deploy` and CI) |
| `scripts/sync-secrets.sh` | Sync `.env.local` → GitHub Secrets |
| `scripts/env-crypt.sh` | GPG encrypt/decrypt `.env.local` |
