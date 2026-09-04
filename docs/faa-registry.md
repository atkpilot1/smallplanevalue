# FAA registry ingest

N-number lookup reads `public.aircraft`. Production and staging are filled by GitHub Actions (**Update FAA Aircraft Registry**), not by copying tables between projects.

The workflow downloads [ReleasableAircraft.zip](https://registry.faa.gov/database/ReleasableAircraft.zip) once, parses `MASTER.txt`, and upserts to every project in `SUPABASE_PROJECTS`. Tails are stored **without** a leading `N` so they match `/api/faa-lookup`.

Sunday 07:00 UTC uses `both` (every object in the JSON). The schedule only runs the workflow that is on the **default branch** (`main`). `workflow_dispatch` can run from `staging` and pick `both`, `staging`, or `production` by `name`.

`aircraft` must already exist (`npm run db:push:staging` / `db:push:prod`). An empty new project returns PostgREST `PGRST205`.

## GitHub repository secrets

| Secret | Required | Purpose |
|---|---|---|
| `SUPABASE_PROJECTS` | Yes | JSON array of hosted projects (see below) |
| `FAA_ZIP_URL` | No | Override download URL. Defaults to the public FAA zip |

Do not use GitHub Environments for this. Repo secrets only.

### `SUPABASE_PROJECTS`

JSON array. Each object needs `name`, `url`, and `service_key`. `name` must be `staging` or `production` so the Actions dropdown matches.

```json
[
  {
    "name": "staging",
    "url": "https://wyggunstezdstrmblkhx.supabase.co",
    "service_key": "SERVICE_ROLE_JWT"
  },
  {
    "name": "production",
    "url": "https://ogfaqdmhqwlysavooroo.supabase.co",
    "service_key": "SERVICE_ROLE_JWT"
  }
]
```

`service_key` is that project’s **`service_role`** key (`eyJ…`) from Settings → API. One key per project. Do not use `anon`, the publishable key, the JWT signing secret, or `sb_secret_…` (the importer still sends `Authorization: Bearer`, which rejects non-JWT secret keys).

Locally you can set the same JSON, or a single `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` pair. See `.env.example`.
