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

    try {
      // Fetch the FAA registry page
      const faaUrl = `https://registry.faa.gov/AircraftInquiry/Search/NNumberResult?nNumberTxt=${nn}`;
      const faaResp = await fetch(faaUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://registry.faa.gov/aircraftinquiry/Search/NNumberInquiry',
          'Cache-Control': 'no-cache'
        }
      });

      const html = await faaResp.text();

      // Check if not found
      if (html.includes('is not assigned') || html.includes('No aircraft found') || html.length < 1000) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ found: false, nnumber: 'N' + nn })
        };
      }

      // Extract field from FAA table - looks for label in th, value in next td
      function extractField(label, html) {
        // FAA uses <td>Label</td><td>Value</td> pattern in tables
        const patterns = [
          new RegExp(label + '[\\s\\S]*?<td[^>]*>\\s*([^<]+?)\\s*<\\/td>', 'i'),
          new RegExp('<td[^>]*>\\s*' + label + '\\s*<\\/td>[\\s\\S]*?<td[^>]*>\\s*([^<]+?)\\s*<\\/td>', 'i'),
        ];
        for (const p of patterns) {
          const m = html.match(p);
          if (m && m[1] && m[1].trim() && m[1].trim() !== '&nbsp;') {
            return m[1].trim();
          }
        }
        return null;
      }

      // Extract owner name from REGISTERED OWNER section
      function extractOwner(html) {
        const ownerSection = html.match(/REGISTERED OWNER[\s\S]*?<\/table>/i);
        if (!ownerSection) return null;
        const nameMatch = ownerSection[0].match(/<td[^>]*>\s*([A-Z][^<]{2,50})\s*<\/td>/);
        return nameMatch ? nameMatch[1].trim() : null;
      }

      const make = extractField('Manufacturer Name', html);
      const model = extractField('Model', html);
      const year = extractField('MFR Year', html);
      const serial = extractField('Serial Number', html);
      const status = extractField('Status', html);
      const certDate = extractField('Certificate Issue Date', html);
      const expiry = extractField('Expiration Date', html);
      const aircraftType = extractField('Type Aircraft', html);
      const engineType = extractField('Type Engine', html);

      // Get owner info
      const ownerName = extractOwner(html);
      const city = extractField('City', html);
      const state = extractField('State', html);

      if (!make && !model) {
        // Couldn't parse — fall through to AI
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ found: false, nnumber: 'N' + nn, _parseError: true })
        };
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          found: true,
          _realData: true,
          _source: 'faa',
          nnumber: 'N' + nn,
          status: status || 'Valid',
          make: make || '',
          model: model || '',
          year: year ? parseInt(year) : null,
          serialNumber: serial || '',
          aircraftType: aircraftType || '',
          engineType: engineType || '',
          airworthinessCert: 'Standard',
          certDate: certDate || '',
          registrationExpiry: expiry || '',
          registrantName: ownerName || '',
          city: city || '',
          state: state || '',
          ownerHistory: [],
          flags: []
        })
      };

    } catch(err) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ found: false, nnumber: 'N' + nn, error: err.message })
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
