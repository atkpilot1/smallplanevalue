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

  // ── FAA N-NUMBER LOOKUP via airport-data.com ──────────
  if (body.type === 'faa_lookup') {
    const nn = (body.nnumber || '').replace(/^N/i, '').trim().toUpperCase();
    if (!nn) return { statusCode: 400, body: JSON.stringify({ error: 'No N-number provided' }) };

    try {
      // airport-data.com has clean JSON API - free, no auth needed
      const adUrl = `https://airport-data.com/api/ac_thumb.json?r=N${nn}&n=1`;
      const adResp = await fetch(adUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SmallPlaneValue/1.0)',
          'Accept': 'application/json'
        }
      });

      const adData = await adResp.json();

      // Also fetch detailed page for full info
      const detailUrl = `https://airport-data.com/aircraft/N${nn}.html`;
      const detailResp = await fetch(detailUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html'
        }
      });
      const detailHtml = await detailResp.text();

      // Use Claude to extract from airport-data.com HTML
      const aiResp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `Extract aircraft data from this airport-data.com page for N${nn}. Return ONLY valid JSON, no markdown:
{
  "found": true,
  "make": "Beech",
  "model": "D55 Baron",
  "year": 1969,
  "serialNumber": "TE-714",
  "status": "Valid",
  "aircraftType": "Fixed wing multi engine",
  "engineType": "Reciprocating",
  "engineMake": "Continental",
  "engineModel": "IO-520",
  "seats": 6,
  "engines": 2,
  "certDate": "",
  "registrantName": "",
  "city": "",
  "state": "",
  "registrationExpiry": ""
}

HTML: ${detailHtml.substring(0, 5000)}`
          }]
        })
      });

      const aiData = await aiResp.json();
      const txt = aiData.content.map(b => b.text || '').join('').replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(txt);

      if (parsed.found) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            ...parsed,
            nnumber: 'N' + nn,
            _realData: true,
            _source: 'airport-data',
            ownerHistory: [],
            flags: []
          })
        };
      }
    } catch(err) {
      console.log('airport-data error:', err.message);
    }

    // Fall back to FAA direct
    try {
      const faaUrl = `https://registry.faa.gov/AircraftInquiry/Search/NNumberResult?nNumberTxt=${nn}`;
      const faaResp = await fetch(faaUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      });
      const html = await faaResp.text();

      if (html.length > 1000 && !html.includes('is not assigned')) {
        const aiResp2 = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 500,
            messages: [{
              role: 'user',
              content: `Extract aircraft data from FAA registry HTML. Return ONLY valid JSON:
{"found":true,"make":"","model":"","year":null,"serialNumber":"","status":"Valid","aircraftType":"","engineType":"","certDate":"","registrationExpiry":"","registrantName":"","city":"","state":""}
HTML: ${html.substring(0, 5000)}`
            }]
          })
        });
        const aiData2 = await aiResp2.json();
        const txt2 = aiData2.content.map(b => b.text || '').join('').replace(/```json|```/g, '').trim();
        const parsed2 = JSON.parse(txt2);
        if (parsed2.found && parsed2.make) {
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ ...parsed2, nnumber: 'N' + nn, _realData: true, _source: 'faa', ownerHistory: [], flags: [] })
          };
        }
      }
    } catch(err) {
      console.log('FAA fallback error:', err.message);
    }

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
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: data
  };
};
