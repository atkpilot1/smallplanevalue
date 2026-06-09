import { z } from 'zod'

const bodySchema = z.object({
  nnumber: z.string(),
})

interface AircraftRow {
  nnumber: string
  status?: string
  make?: string
  model?: string
  year?: number | string
  serial_number?: string
  aircraft_type?: string
  engine_type?: string
  engine_make?: string
  engine_model?: string
  horsepower?: number | string
  seats?: number | string
  speed?: number | string
  num_engines?: number | string
  weight_class?: string
  cert_issue_date?: string
  airworth_date?: string
  expiry_date?: string
  registrant_name?: string
  city?: string
  state?: string
  status_code?: string
  kit_mfr?: string
  kit_model?: string
}

export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'No N-number provided' })
  }

  const nn = parsed.data.nnumber.replace(/^N/i, '').trim().toUpperCase()
  if (!nn) {
    throw createError({ statusCode: 400, statusMessage: 'No N-number provided' })
  }

  const rows = (await supabaseGet(
    `aircraft?nnumber=eq.${encodeURIComponent(nn)}&limit=1`,
  )) as AircraftRow[]

  if (Array.isArray(rows) && rows.length > 0) {
    const row = rows[0]
    return {
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
    }
  }

  return { found: false, nnumber: 'N' + nn }
})
