# SmallPlaneValue 

Nuxt app for general-aviation aircraft valuations. Local development uses a Dockerized Supabase project — do not point `.env` at the hosted production database.

## Prerequisites

- Node.js 22+
- Docker running
- An [Anthropic API key](https://console.anthropic.com/)

The Supabase CLI is a project devDependency. You do not need a global `supabase` install.

## Local setup

```bash
npm install
cp .env.example .env
```

Add `ANTHROPIC_API_KEY` to `.env`. The Supabase URL and anon key in `.env.example` are the public local defaults.

Stripe env vars are **required at process start** (`nuxt dev` and the production server exit if they are missing). For local UI work, copy the placeholders from `.env.test`. Real Stripe test keys and Price IDs are only needed to click through hosted Checkout.

```bash
npm run db:start
npm run dev
```

App: http://localhost:3000  
Studio: http://127.0.0.1:54323  
Mailpit (local Auth emails / OTP): http://127.0.0.1:54324

Seeded N-numbers for lookup: `172SP`, `22T`, `182RG`, `58P`.

## Commands

| Script | What it does |
|---|---|
| `npm run dev` | Nuxt dev server |
| `npm run db:start` | Start local Supabase |
| `npm run db:stop` | Stop local Supabase |
| `npm run db:status` | Print local URLs and keys |
| `npm run db:reset` | Wipe the local DB, replay migrations, re-seed |
| `npm run db:push:staging` | Apply `supabase/migrations` to hosted staging (`wyggunstezdstrmblkhx`). Requires `npx supabase login` as an account on that project. |
| `npm run db:push:prod` | Apply migrations to hosted production (`ogfaqdmhqwlysavooroo`). Same login requirement. |
| `npm run db:config:sync` | Merge `config.shared.toml` + `config.local.toml` → `config.toml` (Docker). |
| `npm run db:config:dump -- staging` | Print the merged staging config (does not push). |
| `npm run db:config:push:staging` | Merge shared + `config.staging.toml` and `supabase config push` to staging. Review the CLI diff. |
| `npm run db:config:push:prod` | Same for production (`config.prod.toml`). |
| `npm run build` | Production Nitro build (required before E2E) |
| `npm run start:e2e` | `node --env-file=.env.test .output/server/index.mjs` on :3100 (used by Playwright) |
| `npm run test:e2e` | Playwright against the built app (needs `npm run build` and `npm run db:start`) |
| `npm run test:e2e:snapshots` | Visual + ARIA snapshot tests only |
| `npm run test:e2e:update-snapshots` | Rewrite snapshot baselines after an intentional UI change |
| `npm run test:e2e:review-snapshots` | Copy expected / actual / diff images into `test-results/snapshot-review/` |

Snapshot tests lock the current HTML UI so a Nuxt rewrite can match it. Baselines live in `tests/e2e/snapshots.spec.ts-snapshots/` and are generated on Linux Chromium — update them on Linux (or in CI) so they match GitHub Actions.

On a snapshot failure:

1. Open `playwright-report/index.html` (`npx playwright show-report`)
2. Or run `npm run test:e2e:review-snapshots` and compare the PNGs in `test-results/snapshot-review/` (`*-expected.png`, `*-actual.png`, `*-diff.png`)

`SNAPSHOT_REVIEW=1 npm run test:e2e:snapshots -- --grep "marketing chrome"` forces a known hero-text mismatch so you can see what a diff looks like.

`db:start` on a fresh machine pulls Docker images and can take a few minutes.

Hosted Auth settings are declared in git, not the dashboard:

- `supabase/config.shared.toml` — OTP, confirmations off, magic-link template (all envs)
- `supabase/config.local.toml` / `config.staging.toml` / `config.prod.toml` — Site URL, redirects, Resend SMTP
- `supabase/config.toml` — generated for Docker; do not edit

Set `RESEND_SMTP_PASSWORD` in the environment before `db:config:push:*`. Edit `admin_email` / production `site_url` in the overlay files if those values are wrong.
