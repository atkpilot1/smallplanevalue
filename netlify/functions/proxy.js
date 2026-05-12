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

  // ── FAA N-NUMBER LOOKUP ──────────────────────────────
  if (body.type === 'faa_lookup') {
    const nn = (body.nnumber || '').replace(/^N/i, '').trim().toUpperCase();
    if (!nn) return { statusCode: 400, body: JSON.stringify({ error: 'No N-number provided' }) };

    try {
      const faaUrl = `https://registry.faa.gov/AircraftInquiry/Search/NNumberResult?nNumberTxt=${nn}`;
      const faaResp = await fetch(faaUrl, {
        headers: {
          'User-Agent': 'SmallPlaneValue.com/1.0 Aircraft Registry Lookup',
          'Accept': 'text/html'
        }
      });

      if (!faaResp.ok) {
        throw new Error(`FAA returned ${faaResp.status}`);
      }

      const html = await faaResp.text();

      // Parse key fields from FAA HTML
      function extract(label, html) {
        // FAA registry uses table rows with label/value pairs
        const patterns = [
          new RegExp(label + '[^<]*</th>[^<]*<td[^>]*>([^<]+)<', 'i'),
          new RegExp(label + '[^<]*</td>[^<]*<td[^>]*>([^<]+)<', 'i'),
          new RegExp('<th[^>]*>' + label + '[^<]*</th>[\\s\\S]*?<td[^>]*>([^<]+)<', 'i'),
        ];
        for (const p of patterns) {
          const m = html.match(p);
          if (m && m[1]) return m[1].trim();
        }
        return null;
      }

      // Check if aircraft was found
      if (html.includes('No aircraft found') || html.includes('not found') || html.includes('Invalid N-Number')) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ found: false, nnumber: 'N' + nn, message: 'No aircraft found with this N-number in the FAA registry.' })
        };
      }

      // Extract all the fields we need
      const data = {
        found: true,
        nnumber: 'N' + nn,
        make:           extract('MFR MDL Code|Manufacturer Name|Make', html),
        model:          extract('Model', html),
        year:           extract('Year Mfr|Mfr Year|Year', html),
        serialNumber:   extract('Serial Number', html),
        engineMake:     extract('Engine Manufacturer', html),
        engineModel:    extract('Engine Model', html),
        category:       extract('Aircraft Category', html),
        aircraftType:   extract('Type Aircraft', html),
        engineType:     extract('Type Engine', html),
        seats:          extract('Seat Count|No. Seats', html),
        weightClass:    extract('Weight', html),
        certDate:       extract('Certification Date|Airworthiness Date', html),
        airworthinessCert: extract('Airworthiness Classification|Certification', html),
        registrantName: extract('Name', html),
        street:         extract('Street', html),
        city:           extract('City', html),
        state:          extract('State', html),
        zip:            extract('Zip Code', html),
        registrationExpiry: extract('Expiration Date', html),
        status:         extract('Status', html),
        faaUrl:         faaUrl
      };

      // Clean up nulls
      Object.keys(data).forEach(k => {
        if (data[k] === null) delete data[k];
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(data)
      };

    } catch(err) {
      // If FAA fetch fails, return error so frontend can fall back to AI
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ found: false, error: err.message, nnumber: 'N' + nn })
      };
    }
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
