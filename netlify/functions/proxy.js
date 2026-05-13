exports.handler = async function(event) {

  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  // ── N-NUMBER LOOKUP via AviationStack ─────────────────
  if (body.type === 'faa_lookup') {
    const nn = (body.nnumber || '').replace(/^N/i, '').trim().toUpperCase();
    if (!nn) return { statusCode: 400, body: JSON.stringify({ error: 'No N-number provided' }) };

    const AVIATION_KEY = process.env.AVIATIONSTACK_KEY;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

    // Try AviationStack first
    try {
      const avResp = await fetch(
        `http://api.aviationstack.com/v1/airplanes?access_key=${AVIATION_KEY}&registration_number=N${nn}`,
        { headers: { 'Accept': 'application/json' } }
      );

      const avData = await avResp.json();

      if (avData.data && avData.data.length > 0) {
        const a = avData.data[0];
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            found: true,
            _realData: true,
            _source: 'aviationstack',
            nnumber: 'N' + nn,
            status: a.plane_status || 'Valid',
            make: a.production_line || a.plane_model || '',
            model: a.plane_model || '',
            year: a.first_flight_date ? new Date(a.first_flight_date).getFullYear() : null,
            serialNumber: a.plane_serial_no || '',
            engineCount: a.engines_count || null,
            engineType: a.engines_type || '',
            seats: a.plane_class || '',
            aircraftType: a.plane_class || '',
            registrantName: a.airline_name || '',
            iataCode: a.iata_code_short || '',
            icaoCode: a.icao_code_hex || '',
            age: a.plane_age || '',
            firstFlight: a.first_flight_date || '',
            deliveryDate: a.delivery_date || '',
            ownerHistory: [],
            flags: []
          })
        };
      }
    } catch(e) {
      console.log('AviationStack error:', e.message);
    }

    // Fall back to Supabase if AviationStack returns nothing
    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        const sbResp = await fetch(
          `${SUPABASE_URL}/rest/v1/aircraft?nnumber=eq.${nn}&limit=1`,
          {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        const rows = await sbResp.json();
        if (rows && rows.length > 0) {
          const r = rows[0];
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
              found: true,
              _realData: true,
              _source: 'supabase',
              nnumber: 'N' + r.nnumber,
              status: r.status || 'Valid',
              make: r.make,
              model: r.model,
              year: r.year,
              serialNumber: r.serial_number,
              engineMake: r.engine_make,
              engineModel: r.engine_model,
              seats: r.seats,
              category: r.category,
              aircraftType: r.aircraft_type,
              airworthinessCert: r.airworthiness,
              certDate: r.cert_date,
              registrantName: r.registrant_name,
              city: r.city,
              state: r.state,
              registrationExpiry: r.expiry_date,
              ownerHistory: [],
              flags: []
            })
          };
        }
      } catch(e) {
        console.log('Supabase error:', e.message);
      }
    }

    // Nothing found — return not found so frontend falls back to AI
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ found: false, nnumber: 'N' + nn })
    };
  }

  // ── ANTHROPIC AI PROXY ───────────────────────────────
  body.model = 'claude-sonnet-4-5-20250929';
  body.max_tokens = Math.min(body.max_tokens || 1000, 4000);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body)
  });

  const data = await response.text();

  return {
    statusCode: response.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: data
  };
};
