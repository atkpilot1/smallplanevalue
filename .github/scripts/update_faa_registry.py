"""
FAA Aircraft Registry Updater
Downloads the FAA registry ZIP, parses MASTER.txt, uploads to Supabase.
Runs weekly via GitHub Actions.
"""

import os
import io
import re
import csv
import zipfile
import requests
import time
from datetime import datetime

SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_KEY = os.environ['SUPABASE_SERVICE_KEY']
FAA_ZIP_URL = os.environ.get('FAA_ZIP_URL', 'https://registry.faa.gov/database/ReleasableAircraft.zip')

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

STATUS_CODES = {
    'A': 'Valid', 'D': 'Dealer', 'E': 'Expired',
    'I': 'Invalid', 'M': 'Reserved', 'N': 'Non-citizen Corporations',
    'R': 'Revoked', 'S': 'Student', 'T': 'Triennial',
    'W': 'Writtenoff', 'X': 'Exported'
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


def get_confirm_token(response):
    for key, value in response.cookies.items():
        if key.startswith('download_warning'):
            return value

    text = response.text
    match = re.search(r'confirm=([0-9A-Za-z_-]+)', text)
    if match:
        return match.group(1)
    return None


def download_google_drive_file(file_id, session, headers):
    download_url = 'https://drive.google.com/uc?export=download'
    params = {'id': file_id}
    response = session.get(download_url, headers=headers, params=params, timeout=180, stream=True)
    token = get_confirm_token(response)
    if token:
        response = session.get(download_url, headers=headers, params={'id': file_id, 'confirm': token}, timeout=180, stream=True)

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
                                'seats': row[9].strip() if len(row) > 9 else ''
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
                                'model': row[2].strip()
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
                if not nnumber.startswith('N'):
                    nnumber = f'N{nnumber}'

                mfr_code = col('MFR MDL CODE')
                eng_code = col('ENG MFR MDL')
                ref = ref_data.get(mfr_code, {})
                eng = eng_data.get(eng_code, {})
                
                try:
                    year = int(col('YEAR MFR')) if col('YEAR MFR').isdigit() else None
                except Exception:
                    year = None

                try:
                    seats = int(ref.get('seats', '') or 0)
                    seats = seats if seats > 0 else None
                except Exception:
                    seats = None

                records.append({
                    'nnumber': nnumber,
                    'make': ref.get('make') or mfr_code,
                    'model': ref.get('model', ''),
                    'year': year,
                    'serial_number': col('SERIAL NUMBER'),
                    'engine_make': eng.get('make', ''),
                    'engine_model': eng.get('model', ''),
                    'seats': seats,
                    'category': col('TYPE REGISTRANT'),
                    'aircraft_type': AIRCRAFT_TYPES.get(col('TYPE AIRCRAFT'), col('TYPE AIRCRAFT')),
                    'engine_type': ENGINE_TYPES.get(col('TYPE ENGINE'), ''),
                    'registrant_name': col('NAME'),
                    'street': col('STREET'),
                    'city': col('CITY'),
                    'state': col('STATE'),
                    'zip': col('ZIP CODE'),
                    'status': STATUS_CODES.get(col('STATUS CODE'), col('STATUS CODE') or 'Valid'),
                    'cert_date': col('CERT ISSUE DATE'),
                    'expiry_date': col('EXPIRATION DATE'),
                    'airworthiness': col('CERTIFICATION'),
                })
                
                if i % 50000 == 0 and i > 0:
                    print(f"  Parsed {i:,} records...")
    
    print(f"Total records: {len(records):,}")
    return records

def upsert_to_supabase(records):
    print("Uploading to Supabase...")
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
    }
    
    batch_size = 2000
    total = len(records)
    success = 0
    errors = 0
    
    for i in range(0, total, batch_size):
        batch = records[i:i+batch_size]
        for attempt in range(3):
            try:
                resp = requests.post(
                    f'{SUPABASE_URL}/rest/v1/aircraft',
                    headers=headers,
                    json=batch,
                    timeout=60
                )
                if resp.status_code in (200, 201):
                    success += len(batch)
                    print(f"  Batch {i//batch_size + 1}: {len(batch)} records uploaded ({success:,}/{total:,})")
                    break
                elif attempt < 2:
                    time.sleep(1)
                else:
                    errors += len(batch)
                    print(f"  Batch error: {resp.status_code} - {resp.text[:200]}")
            except Exception as e:
                if attempt < 2:
                    time.sleep(1)
                else:
                    errors += len(batch)
                    print(f"  Batch exception: {str(e)[:100]}")
    
    print(f"Done: {success:,} uploaded, {errors} errors")
    return success

def main():
    start = datetime.now()
    print(f"FAA Registry Update started at {start.strftime('%Y-%m-%d %H:%M:%S')}")
    zip_content = download_faa_zip()
    records = parse_master_csv(zip_content)
    if records:
        upsert_to_supabase(records)
    elapsed = (datetime.now() - start).seconds
    print(f"Completed in {elapsed}s")

if __name__ == '__main__':
    main()
