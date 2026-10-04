"""
FAA Aircraft Registry Updater
Downloads the FAA registry ZIP, parses MASTER.txt, uploads to Supabase.
Runs weekly via GitHub Actions.
"""

import os
import io
import json
import re
import csv
import socket
import zipfile
import requests
import time
from datetime import datetime
from urllib.parse import urlparse

FAA_ZIP_URL = os.environ.get('FAA_ZIP_URL', 'https://registry.faa.gov/database/ReleasableAircraft.zip')


def load_projects():
    raw = os.environ.get('SUPABASE_PROJECTS', '').strip()
    if raw:
        try:
            data = json.loads(raw)
        except json.JSONDecodeError as err:
            raise SystemExit(f'SUPABASE_PROJECTS is not valid JSON: {err}') from err
        if not isinstance(data, list) or not data:
            raise SystemExit('SUPABASE_PROJECTS must be a non-empty JSON array')
        projects = []
        for i, item in enumerate(data):
            if not isinstance(item, dict):
                raise SystemExit(f'SUPABASE_PROJECTS[{i}] must be an object')
            name = str(item.get('name') or '').strip()
            url = str(item.get('url') or '').strip().rstrip('/')
            key = str(item.get('service_key') or '').strip()
            if not name or not url or not key:
                raise SystemExit(f'SUPABASE_PROJECTS[{i}] needs name, url, and service_key')
            projects.append({'name': name, 'url': url, 'service_key': key})
        return projects

    url = (os.environ.get('SUPABASE_URL') or '').strip().rstrip('/')
    key = (os.environ.get('SUPABASE_SERVICE_KEY') or '').strip()
    if url and key:
        return [{'name': 'default', 'url': url, 'service_key': key}]
    raise SystemExit('Set SUPABASE_PROJECTS or SUPABASE_URL + SUPABASE_SERVICE_KEY')


def selected_projects():
    projects = load_projects()
    target = (os.environ.get('FAA_SYNC_TARGET') or 'both').strip().lower()
    if target in ('', 'all', 'both', 'auto'):
        return projects
    matched = [p for p in projects if p['name'].lower() == target]
    if not matched:
        names = ', '.join(p['name'] for p in projects)
        raise SystemExit(f'No project named {target!r} in SUPABASE_PROJECTS (have: {names})')
    return matched

AIRCRAFT_TYPES = {
    '1': 'Glider', '2': 'Balloon', '3': 'Blimp/Dirigible',
    '4': 'Fixed wing single engine', '5': 'Fixed wing multi engine',
    '6': 'Rotorcraft', '7': 'Weight-shift-control',
    '8': 'Powered Parachute', '9': 'Gyroplane',
    'H': 'Hybrid Lift', 'O': 'Other'
}

ENGINE_TYPES = {
    '0': 'None', '1': 'Reciprocating', '2': 'Turbo-prop',
    '3': 'Turbo-shaft', '4': 'Turbo-jet', '5': 'Turbo-fan',
    '6': 'Ramjet', '7': '2 Cycle', '8': '4 Cycle',
    '9': 'Unknown', '10': 'Electric', '11': 'Rotary'
}

# Labels already stored on production. V must stay "Valid": the lookup treats
# any other status as a warning. Numeric codes are the FAA cancellation states.
STATUS_CODES = {
    'V': 'Valid',
    'T': 'Valid',
    'M': 'Manufacturer',
    'R': 'Registration pending',
    'N': 'Non-citizen, no report',
    'D': 'Expired Dealer',
    'W': 'Ineffective/Invalid',
    'A': 'Triennial notice mailed',
    'E': 'Revoked',
    'S': 'Second triennial mailed',
    'X': 'Enforcement letter',
    'Z': 'Permanent reserved',
    '1': 'Triennial undeliverable',
    '2': 'N-number assigned, not registered',
    '3': 'N-number assigned, not type certificated',
    '4': 'N-number assigned as import',
    '5': 'Reserved',
    '6': 'Administratively canceled',
    '7': 'Sale reported',
    '8': 'Second triennial, no response',
    '9': 'Certificate revoked',
    '10': 'Assigned, pending cancellation',
    '11': 'Amateur, pending cancellation',
    '12': 'Import, pending cancellation',
    '13': 'Registration expired',
    '14': 'First re-registration notice',
    '15': 'Second re-registration notice',
    '16': 'Expired, pending cancellation',
    '17': 'Sale reported, pending cancellation',
    '18': 'Sale reported, canceled',
    '19': 'Registration pending, pending cancellation',
    '20': 'Registration pending, canceled',
    '21': 'Revoked, pending cancellation',
    '22': 'Revoked, canceled',
    '23': 'Expired dealer, pending cancellation',
    '24': 'Third re-registration notice',
    '25': 'First renewal notice',
    '26': 'Second renewal notice',
    '27': 'Registration expired',
    '28': 'Third renewal notice',
    '29': 'Expired, pending cancellation',
}

WEIGHT_CLASSES = {
    '1': 'CLASS 1',
    '2': 'CLASS 2',
    '3': 'CLASS 3',
    '4': 'CLASS 4',
}

HEADERS = {
    'N-NUMBER': 0, 'SERIAL NUMBER': 1, 'MFR MDL CODE': 2, 'ENG MFR MDL': 3,
    'YEAR MFR': 4, 'TYPE REGISTRANT': 5, 'NAME': 6,
    'STREET': 7, 'STREET2': 8, 'CITY': 9, 'STATE': 10,
    'ZIP CODE': 11, 'REGION': 12, 'COUNTY': 13, 'COUNTRY': 14,
    'LAST ACTION DATE': 15, 'CERT ISSUE DATE': 16, 'CERTIFICATION': 17,
    'TYPE AIRCRAFT': 18, 'TYPE ENGINE': 19, 'STATUS CODE': 20,
    'MODE S CODE': 21, 'FRACT OWNER': 22, 'AIR WORTH DATE': 23,
    'OTHER NAMES(1)': 24, 'OTHER NAMES(2)': 25, 'OTHER NAMES(3)': 26,
    'OTHER NAMES(4)': 27, 'OTHER NAMES(5)': 28, 'EXPIRATION DATE': 29,
    'UNIQUE ID': 30, 'KIT MFR': 31, 'KIT MODEL': 32, 'MODE S CODE HEX': 33,
}

FAA_LOCAL_PATH = os.environ.get('FAA_LOCAL_PATH')

def load_local_zip():
    if not FAA_LOCAL_PATH:
        return None
    local_path = FAA_LOCAL_PATH
    if os.path.isdir(local_path):
        local_path = os.path.join(local_path, 'ReleasableAircraft.zip')
    if not os.path.exists(local_path):
        print(f"Local FAA path not found: {local_path}")
        return None
    print(f"Loading FAA registry from local file: {local_path}")
    with open(local_path, 'rb') as f:
        return f.read()


def get_google_drive_file_id(url):
    match = re.search(r'/d/([a-zA-Z0-9_-]+)', url)
    if match:
        return match.group(1)
    match = re.search(r'id=([a-zA-Z0-9_-]+)', url)
    if match:
        return match.group(1)
    return None


def download_google_drive_file(file_id, session, headers):
    # First try the standard download URL
    download_url = 'https://drive.google.com/uc?export=download'
    params = {'id': file_id}
    response = session.get(download_url, headers=headers, params=params, timeout=180, stream=True)

    # Check if we got a virus scan warning page
    if 'Virus scan warning' in response.text:
        # Use the direct download URL that bypasses the warning
        download_url = 'https://drive.usercontent.google.com/download'
        params = {'id': file_id, 'export': 'download', 'confirm': 't'}
        response = session.get(download_url, headers=headers, params=params, timeout=180, stream=True)

    content_type = response.headers.get('content-type', '')
    if 'text/html' in content_type:
        text = response.text
        if 'accounts.google.com/ServiceLogin' in text or 'sign in' in text.lower():
            raise RuntimeError('Google Drive file access requires public sharing. Set the file to "Anyone with the link can view".')
        if 'Google Drive' in text and 'virus' in text.lower():
            raise RuntimeError('Google Drive download requires confirmation or is blocked')
        raise RuntimeError('Google Drive download did not return a ZIP file')

    print(f"Status: {response.status_code}")
    response.raise_for_status()

    chunks = []
    total = 0
    for chunk in response.iter_content(chunk_size=1024*1024):
        if chunk:
            chunks.append(chunk)
            total += len(chunk)
            if total % (5*1024*1024) == 0:
                print(f"  Downloaded {total/1024/1024:.0f} MB...")

    content = b''.join(chunks)
    print(f"Downloaded {len(content)/1024/1024:.1f} MB")
    return content


def download_faa_zip():
    local_zip = load_local_zip()
    if local_zip is not None:
        return local_zip

    print(f"Downloading FAA registry...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
        'Accept': 'application/zip,application/octet-stream,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
    }

    session = requests.Session()
    if 'drive.google.com' in FAA_ZIP_URL:
        file_id = get_google_drive_file_id(FAA_ZIP_URL)
        if not file_id:
            raise ValueError('FAA_ZIP_URL is not a valid Google Drive file URL')
        return download_google_drive_file(file_id, session, headers)

    # First visit the main page to get cookies
    try:
        session.get('https://registry.faa.gov/aircraftinquiry/', headers=headers, timeout=30)
        time.sleep(2)
    except Exception:
        pass

    # Now download the zip
    resp = session.get(FAA_ZIP_URL, headers=headers, timeout=180, stream=True)
    print(f"Status: {resp.status_code}")
    resp.raise_for_status()

    chunks = []
    total = 0
    for chunk in resp.iter_content(chunk_size=1024*1024):
        if chunk:
            chunks.append(chunk)
            total += len(chunk)
            if total % (5*1024*1024) == 0:
                print(f"  Downloaded {total/1024/1024:.0f} MB...")

    content = b''.join(chunks)
    print(f"Downloaded {len(content)/1024/1024:.1f} MB")
    return content

def parse_master_csv(zip_content):
    print("Parsing MASTER.txt...")
    records = []
    
    with zipfile.ZipFile(io.BytesIO(zip_content)) as z:
        print(f"Files in zip: {z.namelist()}")
        
        ref_data = {}
        for fname in ['ACFTREF.txt', 'AcftRef.txt', 'acftref.txt', 'ReleasableAircraft/ACFTREF.txt', 'ReleasableAircraft/AcftRef.txt', 'ReleasableAircraft/acftref.txt']:
            if fname in z.namelist():
                with z.open(fname) as f:
                    reader = csv.reader(io.TextIOWrapper(f, encoding='latin-1'))
                    next(reader)
                    for row in reader:
                        if len(row) > 3:
                            code = row[0].strip()
                            ref_data[code] = {
                                'make': row[1].strip(),
                                'model': row[2].strip(),
                                # ACFTREF.csv: 7 engines, 8 seats, 9 weight, 10 speed.
                                'engines': row[7].strip() if len(row) > 7 else '',
                                'seats': row[8].strip() if len(row) > 8 else '',
                                'weight': row[9].strip() if len(row) > 9 else '',
                                'speed': row[10].strip() if len(row) > 10 else '',
                            }
                print(f"Loaded {len(ref_data)} aircraft references")
                break
        
        eng_data = {}
        for fname in ['ENGINE.txt', 'Engine.txt', 'engine.txt', 'ReleasableAircraft/ENGINE.txt', 'ReleasableAircraft/Engine.txt', 'ReleasableAircraft/engine.txt']:
            if fname in z.namelist():
                with z.open(fname) as f:
                    reader = csv.reader(io.TextIOWrapper(f, encoding='latin-1'))
                    next(reader)
                    for row in reader:
                        if len(row) > 2:
                            code = row[0].strip()
                            eng_data[code] = {
                                'make': row[1].strip(),
                                'model': row[2].strip(),
                                'horsepower': row[4].strip() if len(row) > 4 else '',
                            }
                print(f"Loaded {len(eng_data)} engine references")
                break

        master_file = None
        for fname in ['MASTER.txt', 'Master.txt', 'master.txt', 'ReleasableAircraft/MASTER.txt', 'ReleasableAircraft/Master.txt', 'ReleasableAircraft/master.txt']:
            if fname in z.namelist():
                master_file = fname
                break
        
        if not master_file:
            print(f"ERROR: Could not find MASTER.txt. Files: {z.namelist()}")
            return []

        with z.open(master_file) as f:
            reader = csv.reader(io.TextIOWrapper(f, encoding='latin-1'))
            next(reader)
            
            for i, row in enumerate(reader):
                if len(row) < 20:
                    continue
                
                def col(name):
                    idx = HEADERS.get(name, -1)
                    if idx < 0 or idx >= len(row): return ''
                    return row[idx].strip()
                
                nnumber = col('N-NUMBER').strip().upper()
                if not nnumber:
                    continue
                # /api/faa-lookup strips a leading N before querying.
                if nnumber.startswith('N'):
                    nnumber = nnumber[1:]

                mfr_code = col('MFR MDL CODE')
                eng_code = col('ENG MFR MDL')
                ref = ref_data.get(mfr_code, {})
                eng = eng_data.get(eng_code, {})
                
                def opt_int(value, zero_is_none=True):
                    digits = (value or '').strip()
                    if not digits.isdigit():
                        return None
                    number = int(digits)
                    if zero_is_none and number == 0:
                        return None
                    return number

                def blank(value):
                    text = (value or '').strip()
                    return text or None

                status_code = col('STATUS CODE')
                raw_weight = (ref.get('weight') or '').strip()
                records.append({
                    'nnumber': nnumber,
                    'make': ref.get('make') or mfr_code,
                    'model': ref.get('model', ''),
                    'year': opt_int(col('YEAR MFR')),
                    'serial_number': col('SERIAL NUMBER'),
                    'engine_make': eng.get('make', ''),
                    'engine_model': eng.get('model', ''),
                    'horsepower': blank(eng.get('horsepower', '')),
                    'seats': opt_int(ref.get('seats', '')),
                    'speed': opt_int(ref.get('speed', '')),
                    'num_engines': opt_int(ref.get('engines', ''), zero_is_none=False),
                    'weight_class': WEIGHT_CLASSES.get(raw_weight, raw_weight or None),
                    'aircraft_type': AIRCRAFT_TYPES.get(col('TYPE AIRCRAFT'), col('TYPE AIRCRAFT')),
                    'engine_type': ENGINE_TYPES.get(col('TYPE ENGINE'), ''),
                    'registrant_name': col('NAME'),
                    'city': col('CITY'),
                    'state': col('STATE'),
                    'zip_code': blank(col('ZIP CODE')),
                    'status': STATUS_CODES.get(status_code, status_code or 'Valid'),
                    'status_code': blank(status_code),
                    'cert_issue_date': blank(col('CERT ISSUE DATE')),
                    'airworth_date': blank(col('AIR WORTH DATE')),
                    'expiry_date': blank(col('EXPIRATION DATE')),
                    'mode_s_code': blank(col('MODE S CODE')),
                    'mode_s_hex': blank(col('MODE S CODE HEX')),
                    'kit_mfr': blank(col('KIT MFR')),
                    'kit_model': blank(col('KIT MODEL')),
                    'fract_owner': col('FRACT OWNER').upper() == 'Y',
                    'updated_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'),
                })
                
                if i % 50000 == 0 and i > 0:
                    print(f"  Parsed {i:,} records...")
    
    print(f"Total records: {len(records):,}")
    return records

def missing_column_name(body):
    """PostgREST PGRST204: Could not find the 'zip_code' column of 'aircraft'."""
    match = re.search(r"Could not find the '([^']+)' column", body or '')
    return match.group(1) if match else None


def rows_without(records, omitted):
    if not omitted:
        return records
    return [{k: v for k, v in row.items() if k not in omitted} for row in records]


def host_resolves(url, name):
    host = urlparse(url).hostname
    if not host:
        print(f"{name} URL has no host")
        return False
    try:
        socket.getaddrinfo(host, 443)
    except socket.gaierror as err:
        print(
            f"{name} host {host} does not resolve ({err}). "
            "The Supabase project may have been deleted. Update SUPABASE_PROJECTS."
        )
        return False
    return True


def upsert_to_supabase(records, url, key, name):
    print(f"Uploading to {name} ({url})...")
    if not host_resolves(url, name):
        print(f"Done {name}: 0 uploaded, {len(records)} errors")
        return False

    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
    }

    batch_size = 2000
    total = len(records)
    success = 0
    errors = 0
    # Per project. Do not mutate `records`; the next project may have the column.
    omitted = set()

    for i in range(0, total, batch_size):
        attempt = 0
        while attempt < 3:
            batch = rows_without(records[i:i + batch_size], omitted)
            try:
                resp = requests.post(
                    f'{url}/rest/v1/aircraft',
                    headers=headers,
                    json=batch,
                    timeout=60
                )
                if resp.status_code in (200, 201):
                    success += len(batch)
                    print(f"  Batch {i // batch_size + 1}: {len(batch)} records uploaded ({success:,}/{total:,})")
                    break
                column = missing_column_name(resp.text)
                if column and column not in omitted:
                    print(f"  {name} aircraft has no {column!r} column; omitting it and retrying")
                    omitted.add(column)
                    continue
                attempt += 1
                if attempt < 3:
                    time.sleep(1)
                else:
                    errors += len(batch)
                    print(f"  Batch error: {resp.status_code} - {resp.text[:300]}")
            except Exception as e:
                attempt += 1
                if attempt < 3:
                    time.sleep(1)
                else:
                    errors += len(batch)
                    print(f"  Batch exception: {e}")

    if omitted:
        print(f"  Omitted columns not in {name}.aircraft: {', '.join(sorted(omitted))}")
    print(f"Done {name}: {success:,} uploaded, {errors} errors")
    return errors == 0 and success > 0

def main():
    start = datetime.now()
    projects = selected_projects()
    print(f"FAA Registry Update started at {start.strftime('%Y-%m-%d %H:%M:%S')}")
    print('Targets: ' + ', '.join(p['name'] for p in projects))
    zip_content = download_faa_zip()
    records = parse_master_csv(zip_content)
    if not records:
        raise SystemExit('No FAA records parsed')
    failed = []
    for project in projects:
        ok = upsert_to_supabase(
            records, project['url'], project['service_key'], project['name']
        )
        if not ok:
            failed.append(project['name'])
    elapsed = (datetime.now() - start).seconds
    print(f"Completed in {elapsed}s")
    if failed:
        raise SystemExit('Upload failed for: ' + ', '.join(failed))

if __name__ == '__main__':
    main()
