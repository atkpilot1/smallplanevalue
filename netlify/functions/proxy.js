exports.handler = async function(event) {

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

  // ── FAA N-NUMBER LOOKUP ───────────────────────────────
  if (body.type === 'faa_lookup') {
    const nn = (body.nnumber || '').replace(/^N/i, '').trim().toUpperCase();
    if (!nn) return { statusCode: 400, body: JSON.stringify({ error: 'No N-number provided' }) };

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const lookupUrl = `${supabaseUrl}/rest/v1/aircraft?nnumber=eq.N${nn}&limit=1`;
        const dbResp = await fetch(lookupUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`
          }
        });

        if (dbResp.ok) {
          const rows = await dbResp.json();
          if (Array.isArray(rows) && rows.length > 0) {
            const row = rows[0];
            return {
              statusCode: 200,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
              body: JSON.stringify({
                found: true,
                _realData: true,
                _source: 'supabase',
                nnumber: row.nnumber,
                status: row.status || 'Valid',
                make: row.make,
                model: row.model,
                year: row.year,
                serialNumber: row.serial_number,
                aircraftType: row.aircraft_type,
                engineType: row.engine_type,
                engineMake: row.engine_make,
                engineModel: row.engine_model,
                seats: row.seats,
                certDate: row.cert_date,
                registrationExpiry: row.expiry_date,
                registrantName: row.registrant_name,
                street: row.street,
                city: row.city,
                state: row.state,
                zip: row.zip,
                airworthiness: row.airworthiness
              })
            };
          }
        }
      } catch (err) {
        console.error('Supabase FAA lookup failed:', err);
      }
    }

    // Fallback: use AI WITH WEB SEARCH to find real FAA data
    try {
      const aiResp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1500,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{
            role: 'user',
            content: `Look up the REAL FAA a
git add netlify/functions/proxy.js
git commit -m "Fix proxy: use web search for real FAA data, pass tools through"
git push

