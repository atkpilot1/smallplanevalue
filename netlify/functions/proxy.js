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
      // Fetch real FAA registry page
      const faaUrl = `https://registry.faa.gov/AircraftInquiry/Search/NNumberResult?nNumberTxt=${nn}`;
      const faaResp = await fetch(faaUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SmallPlaneValue/1.0)',
          'Accept': 'text/html,application/xhtml+xml'
        }
      });

      const faaHtml = await faaResp.text();

      // Check if not found
      if (faaHtml.includes('No aircraft found') || faaHtml.includes('invalid') || faaHtml.length < 500) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ found: false, nnumber: 'N' + nn })
        };
      }

      // Use Claude to extract the data from the FAA HTML
      const aiResp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 800,
          messages: [{
            role: 'user',
            content: `Extract aircraft registration data from this FAA registry HTML page. Return ONLY valid JSON, no markdown.

HTML:
${faaHtml.substring(0, 8000)}

Return this exact JSON structure (use null for missing fields):
{
  "found": true,
  "nnumber": "N${nn}",
  "status": "Valid",
  "make": "Beechcraft",
  "model": "D17S Staggerwing",
  "year": 1944,
  "serialNumber": "4935",
  "engineMake": "Pratt & Whitney",
  "engineModel": "R-985",
  "seats": 5,
  "category": "Normal",
  "aircraftType": "Fixed wing single engine",
  "airworthinessCert": "Standard",
  "certDate": "1962-03-15",
  "registrantName": "John Smith",
  "city": "Nashville",
  "state": "TN",
  "registrationExpiry": "2025-08-31"
}`
          }]
        })
      });

      const aiData = await aiResp.json();
      const txt = aiData.content.map(b => b.text || '').join('').replace(/\`\`\`json|\`\`\`/g, '').trim();
      const parsed = JSON.parse(txt);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ...parsed, _realData: true })
      };

    } catch(err) {
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
