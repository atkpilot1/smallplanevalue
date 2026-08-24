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
| `npm run start:e2e` | Nuxt on :3100 with the backend-mocks agent (used by Playwright) |
| `npm run test:e2e` | Playwright tests (needs `npm run db:start`; does not use :3000) |

`db:start` on a fresh machine pulls Docker images and can take a few minutes.
