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

```bash
npm run db:start
npm run dev
```

App: http://localhost:3000  
Studio: http://127.0.0.1:54323

Seeded N-numbers for lookup: `172SP`, `22T`, `182RG`, `58P`.

## Commands

| Script | What it does |
|---|---|
| `npm run dev` | Nuxt dev server |
| `npm run db:start` | Start local Supabase |
| `npm run db:stop` | Stop local Supabase |
| `npm run db:status` | Print local URLs and keys |
| `npm run db:reset` | Wipe the local DB, replay migrations, re-seed |
| `npm run build` | Production Nitro build (required before E2E) |
| `npm run start:e2e` | `node .output/server/index.mjs` on :3100 (used by Playwright) |
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
