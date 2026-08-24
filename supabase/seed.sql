-- Small local FAA-registry sample. N-numbers are stored without the leading N
-- so they match /api/faa-lookup (it strips N before querying).
insert into public.aircraft (
  nnumber, make, model, year, serial_number,
  engine_make, engine_model, seats, category, aircraft_type, engine_type,
  registrant_name, street, city, state, zip, status, cert_date, expiry_date, airworthiness
) values
  ('172SP', 'CESSNA', '172S', 2005, '172S10000',
   'LYCOMING', 'IO-360-L2A', 4, '5', 'Fixed wing single engine', 'Reciprocating',
   'LOCAL DEV', '1 Hangar Rd', 'AUSTIN', 'TX', '78701', 'Valid', '20050615', '20280630', 'Standard'),
  ('22T', 'CIRRUS', 'SR22T', 2018, '1470',
   'CONTINENTAL', 'TSIO-550-K', 5, '5', 'Fixed wing single engine', 'Reciprocating',
   'LOCAL DEV', '1 Hangar Rd', 'AUSTIN', 'TX', '78701', 'Valid', '20180320', '20280331', 'Standard'),
  ('182RG', 'CESSNA', 'R182', 1979, 'R18201234',
   'LYCOMING', 'O-540-J3C5D', 4, '5', 'Fixed wing single engine', 'Reciprocating',
   'LOCAL DEV', '1 Hangar Rd', 'AUSTIN', 'TX', '78701', 'Valid', '19790501', '20270531', 'Standard'),
  ('58P', 'BEECH', '58P', 1981, 'TJ-400',
   'CONTINENTAL', 'TSIO-520-WB', 6, '5', 'Fixed wing multi engine', 'Reciprocating',
   'LOCAL DEV', '1 Hangar Rd', 'AUSTIN', 'TX', '78701', 'Valid', '19810601', '20270630', 'Standard')
on conflict (nnumber) do nothing;
