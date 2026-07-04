import { readBody, setResponseHeader, setResponseStatus } from 'h3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function applyCors(event: any) {
  for (const [key, value] of Object.entries(corsHeaders)) {
    setResponseHeader(event, key, value)
  }
}

function json(event: any, statusCode: number, payload: Record<string, unknown>) {
  setResponseStatus(event, statusCode)
  setResponseHeader(event, 'Content-Type', 'application/json')
  return payload
}

export default defineEventHandler(async (event) => {
  applyCors(event)

  const method = event.node.req.method?.toUpperCase() || 'GET'
  if (method === 'OPTIONS') {
    setResponseStatus(event, 204)
    return ''
  }

  if (method !== 'POST') {
    return json(event, 405, { error: 'Method not allowed' })
  }

  const body = await readBody(event).catch(() => null)
  if (!body || typeof body !== 'object') {
    return json(event, 400, { error: 'Invalid JSON' })
  }

  const type = (body.type || '').toString()
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

  if (type === 'faa_lookup' || type === 'feedback' || type === 'lookup_lead') {
    if (!supabaseUrl || !supabaseAnonKey) {
      return json(event, 500, { error: 'Database not configured' })
    }
  }

  if (type === 'faa_lookup') {
    const nn = (body.nnumber || '').toString().replace(/^N/i, '').trim().toUpperCase()
    if (!nn) {
      return json(event, 400, { error: 'No N-number provided' })
    }

    try {
      const lookupUrl = `${supabaseUrl}/rest/v1/aircraft?nnumber=eq.${encodeURIComponent(nn)}&limit=1`
      const rows = await $fetch(lookupUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      })

      if (Array.isArray(rows) && rows.length > 0) {
        const row = rows[0]
        return json(event, 200, {
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
          kitModel: row.kit_model,
        })
      }

      return json(event, 200, { found: false, nnumber: 'N' + nn })
    } catch (err) {
      return json(event, 500, { error: 'Database lookup failed', detail: (err as Error).message })
    }
  }

  if (type === 'feedback') {
    try {
      await $fetch(`${supabaseUrl}/rest/v1/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          Prefer: 'return=minimal',
        },
        body: {
          email: body.email || null,
          aircraft: body.aircraft || null,
          accuracy: body.accuracy || null,
          message: body.message || null,
          user_agent: body.user_agent || null,
        },
      })

      return json(event, 200, { ok: true })
    } catch (err) {
      return json(event, 500, { error: 'Save failed', detail: (err as Error).message })
    }
  }

  if (type === 'lookup_lead') {
    const email = (body.email || '').toString().trim().toLowerCase()
    if (!email || !email.includes('@')) {
      return json(event, 400, { error: 'Valid email required' })
    }
    const nn = (body.nnumber || '').toString().replace(/^N/i, '').trim().toUpperCase() || null
    const yearRaw = body.year
    const yearNum = yearRaw != null && yearRaw !== '' ? parseInt(String(yearRaw), 10) : null

    try {
      await $fetch(`${supabaseUrl}/rest/v1/lookup_leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          Prefer: 'return=minimal',
        },
        body: {
          email,
          nnumber: nn,
          make: body.make || null,
          model: body.model || null,
          year: Number.isFinite(yearNum) ? yearNum : null,
          utm_source: body.utm_source || null,
          utm_medium: body.utm_medium || null,
          utm_campaign: body.utm_campaign || null,
          user_agent: body.user_agent || null,
        },
      })

      return json(event, 200, { ok: true })
    } catch (err) {
      return json(event, 500, { error: 'Save failed', detail: (err as Error).message })
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return json(event, 500, { error: 'API key not configured' })
  }

  try {
    const apiBody: any = {
      model: body.model || 'claude-sonnet-4-5-20250929',
      max_tokens: body.max_tokens || 4096,
      messages: body.messages || [],
    }
    if (body.tools) {
      apiBody.tools = body.tools
    }

    const resp = await $fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: apiBody,
    })

    return json(event, 200, resp as Record<string, unknown>)
  } catch (err) {
    return json(event, 500, { error: 'API request failed', detail: (err as Error).message })
  }
})
