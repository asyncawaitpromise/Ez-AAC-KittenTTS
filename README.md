# astro-cf-pages

Static site starter: Astro 5 + React + Tailwind + DaisyUI + Lucide icons, deployed to Cloudflare Workers (static assets).

No server, no Docker, no registry — just `pnpm run deploy`. Worker name and custom domain live only in `.env.local` / GitHub Secrets and are provisioned automatically on deploy — nothing to edit in `wrangler.toml`, no dashboard step required.

## Stack

- [Astro 5](https://astro.build) — static site generator
- [React 19](https://react.dev) — interactive components via `client:load`
- [Tailwind CSS](https://tailwindcss.com) + [DaisyUI](https://daisyui.com) — styling
- [Lucide React](https://lucide.dev) — icons
- [Cloudflare Workers](https://developers.cloudflare.com/workers/static-assets/) — static asset hosting + branch previews

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
