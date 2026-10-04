# FAA registry ingest

N-number lookup reads `public.aircraft`. Production and staging are filled by GitHub Actions (**Update FAA Aircraft Registry**), not by copying tables between projects.

The workflow downloads [ReleasableAircraft.zip](https://registry.faa.gov/database/ReleasableAircraft.zip) once, parses `MASTER.txt`, and upserts to every project in `SUPABASE_PROJECTS`. Tails are stored **without** a leading `N` so they match `/api/faa-lookup`.

Sunday 07:00 UTC uses `both` (every object in the JSON). The schedule only runs the workflow that is on the **default branch** (`main`). `workflow_dispatch` can run from `staging` and pick `both`, `staging`, or `production` by `name`.

`aircraft` must already exist (`npm run db:push:staging` / `db:push:prod`). An empty new project returns PostgREST `PGRST205`.

Production’s `aircraft` table was created before `0001` and already uses the names `/api/faa-lookup` reads (`cert_issue_date`, `airworth_date`, `zip_code`, and the reference fields). `0001` is `CREATE TABLE IF NOT EXISTS` with different names (`cert_date`, `airworthiness`, `zip`), so it never altered production. Staging, created empty from `0001`, got those other names. The importer writes the production names. `0009_aircraft_registry_columns.sql` adds the production columns on a database that does not have them yet.

If PostgREST reports a missing column (`PGRST204`), the importer drops that column for that project only and retries the batch. A project host that does not resolve is skipped with an error; update `SUPABASE_PROJECTS` when a project is deleted.

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
