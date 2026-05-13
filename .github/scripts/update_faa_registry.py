"""
FAA Aircraft Registry Updater
Downloads the FAA registry ZIP, parses MASTER.txt, uploads to Supabase.
Runs weekly via GitHub Actions.
"""

import os
import io
import csv
import zipfile
import requests
import json
from datetime import datetime

SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_KEY = os.environ['SUPABASE_SERVICE_KEY']  # Service key for writes
FAA_ZIP_URL = 'https://registry.faa.gov/database/ReleasableAircraft.zip'

# FAA MASTER.txt column positions (fixed-width CSV)
# Full column reference: https://registry.faa.gov/database/ReleasableAircraft.zip (README.txt)
HEADERS = {
    'N-NUMBER':     0,
    'MFR MDL CODE': 1,
    'ENG MFR MDL':  2,
    'YEAR MFR':     3,
    'TYPE REGISTRANT': 4,
    'NAME':         5,
    'STREET':       6,
    'STREET2':      7,
    'CITY':         8,
    'STATE':        9,
    'ZIP CODE':     10,
    'REGION':       11,
    'COUNTY':       12,
    'COUNTRY':      13,
    'LAST ACTION DATE': 14,
    'CERT ISSUE DATE': 15,
    'CERTIFICATION': 16,
    'TYPE AIRCRAFT': 17,
    'TYPE ENGINE':  18,
    'STATUS CODE':  19,
    'MODE S CODE':  20,
    'FRACT OWNER':  21,
    'AIR WORTH DATE': 22,
    'OTHER NAMES(1)': 23,
    'OTHER NAMES(2)': 24,
    'OTHER NAMES(3)': 25,
    'OTHER NAMES(4)': 26,
    'OTHER NAMES(5)': 27,
    'EXPIRATION DATE': 28,
    'UNIQUE ID':    29,
    'KIT MFR':      30,
    'KIT MODEL':    31,
    'MODE S CODE HEX': 32,
}

# Aircraft type codes
AIRCRAFT_TYPES = {
    '1': 'Glider', '2': 'Balloon', '3': 'Blimp/Dirigible',
    '4': 'Fixed wing single engine', '5': 'Fixed wing multi engine',
    '6': 'Rotorcraft', '7': 'Weight-shift-control',
    '8': 'Powered Parachute', '9': 'Gyroplane',
    'H': 'Hybrid Lift', 'O': 'Other'
}

# Engine type codes
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

def download_faa_zip():
    print(f"Downloading FAA registry from {FAA_ZIP_URL}...")
    resp = requests.get(FAA_ZIP_URL, timeout=120, stream=True)
    resp.raise_for_status()
    content = resp.content
    print(f"Downloaded {len(content)/1024/1024:.1f} MB")
    return content

def parse_master_csv(zip_content):
    print("Parsing MASTER.txt...")
    records = []
    
    with zipfile.ZipFile(io.BytesIO(zip_content)) as z:
        # Also load aircraft reference for make/model names
        ref_data = {}
        if 'ACFTREF.txt' in z.namelist():
            with z.open('ACFTREF.txt') as f:
                reader = csv.reader(io.TextIOWrapper(f, encoding='latin-1'))
                next(reader)  # skip header
                for row in reader:
                    if len(row) > 3:
                        code = row[0].strip()
                        ref_data[code] = {
                            'make': row[1].strip(),
                            'model': row[2].strip(),
                            'seats': row[9].strip() if len(row) > 9 else ''
                        }
        
        # Also load engine reference
        eng_data = {}
        if 'ENGINE.txt' in z.namelist():
            with z.open('ENGINE.txt') as f:
                reader = csv.reader(io.TextIOWrapper(f, encoding='latin-1'))
                next(reader)
                for row in reader:
                    if len(row) > 2:
                        code = row[0].strip()
                        eng_data[code] = {
                            'make': row[1].strip(),
                            'model': row[2].strip()
                        }

        with z.open('MASTER.txt') as f:
            reader = csv.reader(io.TextIOWrapper(f, encoding='latin-1'))
            next(reader)  # skip header
            
            for i, row in enumerate(reader):
                if len(row) < 20:
                    continue
                
                def col(name):
                    idx = HEADERS.get(name, -1)
                    if idx < 0 or idx >= len(row):
                        return ''
                    return row[idx].strip()
                
                nnumber = col('N-NUMBER').strip()
                if not nnumber:
                    continue

                mfr_code = col('MFR MDL CODE')
                eng_code = col('ENG MFR MDL')
                
                ref = ref_data.get(mfr_code, {})
                eng = eng_data.get(eng_code, {})
                
                type_aircraft = AIRCRAFT_TYPES.get(col('TYPE AIRCRAFT'), col('TYPE AIRCRAFT'))
                status = STATUS_CODES.get(col('STATUS CODE'), col('STATUS CODE') or 'Valid')
                
                try:
                    year = int(col('YEAR MFR')) if col('YEAR MFR').isdigit() else None
                except:
                    year = None

                try:
                    seats = int(ref.get('seats', '') or 0) or None
                except:
                    seats = None

                record = {
                    'nnumber': nnumber,
                    'make': ref.get('make') or mfr_code,
                    'model': ref.get('model', ''),
                    'year': year,
                    'serial_number': '',  # Not in MASTER.txt directly
                    'engine_make': eng.get('make', ''),
                    'engine_model': eng.get('model', ''),
                    'seats': seats,
                    'category': '',
                    'aircraft_type': type_aircraft,
                    'engine_type': ENGINE_TYPES.get(col('TYPE ENGINE'), ''),
                    'registrant_name': col('NAME'),
                    'street': col('STREET'),
                    'city': col('CITY'),
                    'state': col('STATE'),
                    'zip': col('ZIP CODE'),
                    'status': status,
                    'cert_date': col('CERT ISSUE DATE'),
                    'expiry_date': col('EXPIRATION DATE'),
                    'airworthiness': col('CERTIFICATION'),
                }
                records.append(record)
                
                if i % 50000 == 0:
                    print(f"  Parsed {i:,} records...")
    
    print(f"Total records parsed: {len(records):,}")
    return records

def upsert_to_supabase(records):
    """Upsert records to Supabase in batches of 500"""
    print("Uploading to Supabase...")
    
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
    }
    
    batch_size = 500
    total = len(records)
    success = 0
    
    for i in range(0, total, batch_size):
        batch = records[i:i+batch_size]
        resp = requests.post(
            f'{SUPABASE_URL}/rest/v1/aircraft',
            headers=headers,
            json=batch,
            timeout=30
        )
        
        if resp.status_code in (200, 201):
            success += len(batch)
        else:
            print(f"  Batch {i//batch_size} error: {resp.status_code} — {resp.text[:200]}")
        
        if (i // batch_size) % 100 == 0:
            print(f"  Uploaded {success:,}/{total:,} records...")
    
    print(f"Upload complete: {success:,} records")
    return success

def main():
    start = datetime.now()
    print(f"FAA Registry Update started at {start.strftime('%Y-%m-%d %H:%M:%S')}")
    
    zip_content = download_faa_zip()
    records = parse_master_csv(zip_content)
    upserted = upsert_to_supabase(records)
    
    elapsed = (datetime.now() - start).seconds
    print(f"\nDone! {upserted:,} records in {elapsed}s")

if __name__ == '__main__':
    main()
