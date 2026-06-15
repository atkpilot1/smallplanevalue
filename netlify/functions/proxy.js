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

  // ── FAA N-NUMBER LOOKUP via Supabase ─────────────────
  if (body.type === 'faa_lookup') {
    const nn = (body.nnumber || '').replace(/^N/i, '').trim().toUpperCase();
    if (!nn) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'No N-number provided' })
      };
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const lookupUrl = `${supabaseUrl}/rest/v1/aircraft?nnumber=eq.${nn}&limit=1`;
        const dbResp = await fetch(lookupUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`
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
                nnumber: 'N' + row.nnumber,
                status: row.status || 'Valid',
                make: row.make,
                model: row.model,
                year: row.year,
                serialNumber: row.serial_number,
                aircraftType: row.aircraft_type,
                engineType: row.engine_type,
                engineMake: row.engine_make,
                engineModel: row.engine_model,
                horsepower: row.horsepower,
                seats: row.seats,
                speed: row.speed,
                numEngines: row.num_engines,
                weightClass: row.weight_class,
                certDate: row.cert_issue_date,
                airworthDate: row.airworth_date,
                registrationExpiry: row.expiry_date,
                registrantName: row.registrant_name,
                city: row.city,
                state: row.state,
                statusCode: row.status_code,
                kitMfr: row.kit_mfr,
                kitModel: row.kit_model
              })
            };
          }
        }

        // No rows found
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ found: false, nnumber: 'N' + nn })
        };

      } catch (err) {
        console.error('Supabase FAA lookup failed:', err.message);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Database lookup failed', detail: err.message })
        };
      }
    }

    // No Supabase credentials
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Database not configured' })
    };
  }

  // ── FEEDBACK → Supabase ──────────────────────────────
  if (body.type === 'feedback') {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Database not configured' })
      };
    }

    try {
      const dbResp = await fetch(`${supabaseUrl}/rest/v1/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          email: body.email || null,
          aircraft: body.aircraft || null,
          accuracy: body.accuracy || null,
          message: body.message || null,
          user_agent: body.user_agent || null
        })
      });

      if (!dbResp.ok) {
        const detail = await dbResp.text();
        console.error('Supabase feedback insert failed:', detail);
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Save failed' })
        };
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: true })
      };

    } catch (err) {
      console.error('Supabase feedback insert error:', err.message);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Save failed', detail: err.message })
      };
    }
  }

  // ── ANTHROPIC API PROXY (valuations, etc.) ───────────
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'API key not configured' })
    };
  }

  try {
    const apiBody = {
      model: body.model || 'claude-sonnet-4-5-20250929',
      max_tokens: body.max_tokens || 4096,
      messages: body.messages || []
    };

    // Pass through tools if provided
    if (body.tools) {
      apiBody.tools = body.tools;
    }

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(apiBody)
    });

    const data = await resp.json();

    return {
      statusCode: resp.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data)
    };

  } catch (err) {
    console.error('Anthropic API error:', err.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'API request failed', detail: err.message })
    };
  }
};
