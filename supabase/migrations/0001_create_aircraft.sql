-- Create the FAA aircraft registry table used by the SmallPlaneValue application.
CREATE TABLE IF NOT EXISTS aircraft (
  nnumber TEXT PRIMARY KEY,
  make TEXT,
  model TEXT,
  year INTEGER,
  serial_number TEXT,
  engine_make TEXT,
  engine_model TEXT,
  seats INTEGER,
  category TEXT,
  aircraft_type TEXT,
  engine_type TEXT,
  registrant_name TEXT,
  street TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  status TEXT,
  cert_date TEXT,
  expiry_date TEXT,
  airworthiness TEXT
);

CREATE INDEX IF NOT EXISTS aircraft_nnumber_idx ON aircraft (nnumber);
