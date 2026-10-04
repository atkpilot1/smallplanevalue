"""One database read against staging so a free Supabase project stays active.

Supabase pauses a free project that does not get a few database requests
each day for a week. Auth health checks do not count. This asks PostgREST
for a single aircraft row, which runs a query in Postgres.
"""

import json
import os
import urllib.error
import urllib.request

def staging_project():
    raw = os.environ.get('SUPABASE_PROJECTS', '').strip()
    if not raw:
        raise SystemExit('SUPABASE_PROJECTS is not set')
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as err:
        raise SystemExit(f'SUPABASE_PROJECTS is not valid JSON: {err}') from err
    if not isinstance(data, list):
        raise SystemExit('SUPABASE_PROJECTS must be a JSON array')
    for item in data:
        if isinstance(item, dict) and str(item.get('name') or '').strip().lower() == 'staging':
            url = str(item.get('url') or '').strip().rstrip('/')
            key = str(item.get('service_key') or '').strip()
            if not url or not key:
                raise SystemExit('staging project needs url and service_key')
            return url, key
    raise SystemExit('No project named staging in SUPABASE_PROJECTS')


def main():
    url, key = staging_project()
    request = urllib.request.Request(
        f'{url}/rest/v1/aircraft?select=nnumber&limit=1',
        headers={
            'apikey': key,
            'Authorization': f'Bearer {key}',
            'Accept': 'application/json',
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            response.read()
            print(f'staging database responded {response.status}')
    except urllib.error.HTTPError as err:
        detail = err.read().decode('utf-8', 'replace')[:200]
        raise SystemExit(f'staging database returned {err.code}: {detail}') from err
    except urllib.error.URLError as err:
        raise SystemExit(f'staging database did not respond: {err.reason}') from err


if __name__ == '__main__':
    main()
