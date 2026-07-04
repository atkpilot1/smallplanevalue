import { z } from 'zod'
import { generateText, stepCountIs, tool } from 'ai'
import { findComparables, formatComparables } from '../data/aircraftDb'
import {
  countValuationsThisMonth,
  recordValuationUsage,
  FREE_VALUATIONS_PER_MONTH,
} from '../utils/valuationAccess'

const bodySchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.string().optional().default(''),
  ttaf: z.string().optional().default(''),
  engineInfo: z.string().optional().default(''),
  annualInfo: z.string().optional().default(''),
  cond: z.string().optional().default(''),
  cosm: z.string().optional().default(''),
  avionics: z.array(z.string()).optional().default([]),
  notes: z.string().optional().default(''),
  asking: z.string().optional().default(''),
  cirrusGen: z.string().optional().default(''),
  logbooks: z.string().optional().default(''),
  damage: z.string().optional().default(''),
  outOfAnnual: z.boolean().optional().default(false),
  avionicsPackage: z.string().optional().default(''),
  clientId: z.string().optional().default(''),
  email: z.string().optional().nullable(),
})

const valSchema = z.object({
  sellerAsk: z.number(),
  fairMarketValue: z.number(),
  buyerTarget: z.number(),
  condImpact: z.string(),
  avImpact: z.string(),
  engineImpact: z.string(),
  condVerdict: z.string(),
  avVerdict: z.string(),
  engineVerdict: z.string(),
  keyFinding: z.string(),
  analysis: z.string(),
  negotiatingTips: z.array(z.string()),
  confidence: z.string(),
})

// --- Cirrus generation-based valuation guide ------------------------------
// Cirrus values track GENERATION far more than raw year. The same model year can
// be a different generation, and avionics packages (Avidyne -> Perspective ->
// Perspective+) are standard-fit per generation. Anchor bands below are
// 2025-2026 retail asking ranges; refine with real TAP/Controller comps.

function isCirrus(make: string, model: string): boolean {
  const m = (make + ' ' + model).toLowerCase()
  return /\bcirrus\b/.test(m) || /\bsr20\b|\bsr22\b|\bsr22t\b|\bsf50\b|vision\s*jet/.test(m)
}

// Map a model year to its Cirrus generation for the given model family.
function cirrusGen(yearStr: string, model: string): string {
  const y = parseInt((yearStr || '').replace(/[^0-9]/g, ''), 10)
  const m = (model || '').toLowerCase()
  const isJet = /sf50|vision\s*jet/.test(m)
  if (!y) return isJet ? 'unknown (SF50)' : 'unknown'
  if (isJet) {
    if (y <= 2018) return 'G1'
    if (y <= 2022) return 'G2 / G2+'
    return 'G2+ (current)'
  }
  // SR20 / SR22 / SR22T share the same generation year breaks
  if (y <= 2003) return 'G1'
  if (y <= 2006) return 'G2'
  if (y <= 2012) return 'G3'   // G3 airframe ran ~2007-2012 (no public "G4")
  if (y <= 2016) return 'G5'
  if (y <= 2023) return 'G6'
  return 'G7'
}

function cirrusGuide(yearStr: string, model: string, genOverride?: string): string {
  // A user-selected generation (from the UI dropdown) is authoritative; fall
  // back to inferring it from the year when not provided.
  const override = (genOverride || '').trim()
  const gen = override || cirrusGen(yearStr, model)
  let g =
    'CIRRUS GENERATION GUIDE — price by GENERATION, not raw year. ' +
    'This aircraft is generation: ' + gen +
    (override ? ' (explicitly specified by the user — treat as authoritative).' : ' (inferred from year — verify against serial + avionics).') +
    '\n\n'

  g += 'Year -> generation (SR20 / SR22 / SR22T):\n'
  g += '  G1 = 2001-2003 | G2 = 2004-2006 | G3 = 2007-2012 | G5 = 2013-2016 | G6 = 2017-2023 | G7 = 2024+\n'
  g += '  (SF50 Vision Jet: G1 = 2016-2018 | G2/G2+ = 2019-2022 | G2+ current = 2023+)\n\n'

  g += 'Standard avionics by generation (already included — do NOT add as an extra unless upgraded beyond stock):\n'
  g += '  G1-G2: Avidyne Entegra. G3: Avidyne or early Cirrus Perspective (Garmin). G5: Cirrus Perspective (Garmin). G6+: Cirrus Perspective+ (Garmin, faster, larger displays, FIKI common). SF50: Cirrus Perspective Touch / Perspective Touch+.\n\n'

  g += 'Approx 2025-2026 RETAIL ASKING bands (anchor with live comps; FIKI, low time, AC, and Perspective+ push to the top):\n'
  g += '  SR20:  G1-G2 $150-220k | G3 $200-300k | G5 $300-400k | G6 $380-520k | G7 $560k+.\n'
  g += '  SR22 (NA): G1 $200-290k | G2 $250-340k | G3 $300-470k | G5 $480-620k | G6 $580-820k | G7 $900k-1.1M+.\n'
  g += '  SR22T (turbo): G3 $360-520k | G5 $540-700k | G6 $680-950k | G7 $1.0-1.25M+.\n'
  g += '  SF50 Vision Jet: G1 $1.7-2.2M | G2/G2+ $2.4-3.4M | newest low-time $3.5M+.\n\n'

  g += 'CIRRUS-SPECIFIC VALUE DRIVERS: FIKI known-ice (big premium, standard on most G6+) | air conditioning | Perspective+ vs older Perspective/Avidyne | low airframe time | CAPS parachute repack currently in-date (10-yr repack ~$15-18k; an overdue/soon-due repack is a real deduction) | TKS fluid system condition.\n'
  g += 'IMPORTANT: a 2017-2023 SR22 is a G6 with Perspective+ and usually FIKI — it must NOT be priced like an older G3/G5. Late-gen low-time examples are commonly $600k-$820k (SR22) / $700k-$950k (SR22T). Do not lowball late-generation Cirrus aircraft.\n\n'

  return g
}

function extractJson(txt: string): unknown {
  const cleaned = txt.replace(/```json|```/g, '').trim()
  // Scan for every balanced {...} object (brace-aware, string-aware) and return
  // the LAST one that parses and looks like a valuation. This is robust when the
  // model emits reasoning text containing stray braces before the final JSON.
  const candidates: string[] = []

  const tryParse = (candidate: string): unknown | null => {
    try {
      return JSON.parse(candidate)
    } catch {
      return null
    }
  }

  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] !== '{') continue
    let depth = 0
    let inStr = false
    let esc = false
    for (let j = i; j < cleaned.length; j++) {
      const ch = cleaned[j]
      if (inStr) {
        if (esc) esc = false
        else if (ch === '\\') esc = true
        else if (ch === '"') inStr = false
        continue
      }
      if (ch === '"') inStr = true
      else if (ch === '{') depth++
      else if (ch === '}') {
        depth--
        if (depth === 0) {
          candidates.push(cleaned.slice(i, j + 1))
          break
        }
      }
    }
    if (depth !== 0) {
      candidates.push(cleaned.slice(i))
    }
  }
  for (let k = candidates.length - 1; k >= 0; k--) {
    try {
      const o = JSON.parse(candidates[k])
      if (o && typeof o === 'object' && 'sellerAsk' in (o as Record<string, unknown>)) return o
    } catch {
      /* try the next candidate */
    }
  }
  for (let k = candidates.length - 1; k >= 0; k--) {
    try {
      return JSON.parse(candidates[k])
    } catch {
      /* keep trying */
    }
  }
  // Salvage: the model likely emitted a valid object that got truncated before
  // its closing brace (token limit). Recover the three required price numbers
  // plus any whole string fields we can find, so the user still gets a result.
  const open = cleaned.indexOf('{')
  if (open !== -1 && cleaned.includes('sellerAsk')) {
    const num = (key: string): number | undefined => {
      const m = cleaned.match(new RegExp('"' + key + '"\\s*:\\s*"?\\$?([0-9][0-9,]*)'))
      return m ? parseInt(m[1].replace(/,/g, ''), 10) : undefined
    }
    const str = (key: string): string | undefined => {
      const m = cleaned.match(new RegExp('"' + key + '"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"'))
      return m ? m[1] : undefined
    }
    const sellerAsk = num('sellerAsk')
    const fairMarketValue = num('fairMarketValue')
    const buyerTarget = num('buyerTarget')
    if (sellerAsk !== undefined && fairMarketValue !== undefined && buyerTarget !== undefined) {
      return {
        sellerAsk,
        fairMarketValue,
        buyerTarget,
        condImpact: str('condImpact') || '',
        avImpact: str('avImpact') || '',
        engineImpact: str('engineImpact') || '',
        condVerdict: str('condVerdict') || '',
        avVerdict: str('avVerdict') || '',
        engineVerdict: str('engineVerdict') || '',
        keyFinding: str('keyFinding') || '',
        analysis: str('analysis') || '',
        negotiatingTips: [],
        confidence: str('confidence') || 'medium',
      }
    }
  }
  return JSON.parse(cleaned)
}

export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Enter make and model.' })
  }
  const d = parsed.data
  const avs = d.avionics
  const clientId = (d.clientId || '').trim()

  if (clientId) {
    const used = await countValuationsThisMonth(clientId)
    if (used >= FREE_VALUATIONS_PER_MONTH) {
      throw createError({
        statusCode: 402,
        statusMessage: 'limit_reached',
        data: { code: 'limit_reached', requiresEmail: !d.email },
      })
    }
  }

  let prompt =
    'You are an expert aircraft appraiser with current 2025-2026 market knowledge. Provide ACCURATE asking prices — not lowballed.\n\n'
  prompt +=
    '2025-2026 market:\n- Beech Baron D55/E55: $180k-$320k. Fresh matched engines +$40-60k. G500 TXi+GTN 750Xi+GFC 600 adds $30-50k.\n'
  prompt +=
    '- Autopilot: GFC 600 is gold standard (+$15-20k). S-TEC 3100 capable but $25-30k less than GFC 600. S-TEC 55X basic (+$2-4k). Other legacy S-TEC units (S-TEC 65/60/50/40/30) are older rate-based autopilots, all valued the same and less capable than the 55X (+$1-2k).\n'
  prompt +=
    '- Cessna 172: $80k-$250k. Cessna 182: $120k-$350k. RV-10: $260k-$530k (older/basic $260-330k, newer/loaded $400-530k).\n'
  prompt +=
    '- Cirrus (SR20/SR22/SR22T/SF50 Vision Jet): DO NOT price from this line — a detailed generation-by-generation guide is provided below and MUST be used when the aircraft is a Cirrus.\n'
  prompt +=
    '- Piper Cherokee/Archer: $50k-$150k. Saratoga/Lance: $180k-$400k. Mooney M20: $100k-$350k.\n'
  prompt +=
    '- Avionics: G1000 NXi +$25-35k, G500 TXi +$18-25k, Aspen EFD +$8-12k, GTN 750Xi +$12-18k. Radar on twins +$5-10k.\n'
  prompt +=
    '- Twins: matched engine times=premium. Factory new engines $15-20k more than field OH. 3-blade props +$3-8k.\n\n'

  if (isCirrus(d.make, d.model) || d.cirrusGen) {
    prompt += cirrusGuide(d.year, d.model, d.cirrusGen)
  }

  // Deterministic avionics adjustment from the spreadsheet-derived engine.
  // Base airframe value is unknown until the LLM prices it, so we inject the
  // per-item dollar figures and total and instruct the model to use them as-is
  // (applying the 40% airframe cap relative to its own base airframe estimate).
  // Two avionics paths:
  //  - If the user itemized avionics (checkboxes), use the per-item engine.
  //  - Otherwise, if they picked a simplified panel package, use that.
  if (avs.length > 0) {
    const av = computeAvionicsAdjustment(avs)
    if (av.lineItems.length || av.adsbPenalty) {
      prompt +=
        av.summary +
        'Apply the avionics adjustment ABOVE to the base airframe value you derive from comps. ' +
        'Do NOT independently re-estimate the dollar value of avionics — these figures are authoritative. ' +
        'Cap total POSITIVE avionics value at 40% of the base airframe value; the ADS-B penalty (if any) always applies in full.\n\n'
    }
  } else if (d.avionicsPackage && avionicsPackageValue(d.avionicsPackage)) {
    // Simplified "panel package" path. The package dollar value is added
    // deterministically AFTER the estimate (see applyAvionicsPackage), so the
    // model must price a neutral basic-IFR panel and NOT value avionics itself.
    prompt +=
      'AVIONICS: price this aircraft assuming a basic IFR panel (a WAAS GPS + ADS-B Out). The actual panel upgrade value is added automatically AFTER your estimate, so DO NOT add or subtract avionics value yourself and do NOT mention the avionics/panel in keyFinding or analysis.\n\n'
  }

  prompt +=
    'Aircraft: ' + (d.year || '?') + ' ' + d.make + ' ' + d.model + '\nTTAF: ' + (d.ttaf || '?') + ' hrs\n' + d.engineInfo + '\n'
  prompt +=
    'Annual: ' + (d.annualInfo || 'Unknown') + '. Condition: ' + d.cond + ', Paint/Interior: ' + d.cosm + '\nAvionics: ' + (avs.length ? avs.join(', ') : 'Standard/basic') + '\n'
  prompt +=
    'Logbooks: ' + (d.logbooks || 'Unknown') + '. Damage history: ' + (d.damage || 'Unknown') + '\nNotes: ' + (d.notes || 'none') + '\n'
  prompt +=
    'IMPORTANT — LOGBOOKS and DAMAGE HISTORY are adjusted automatically AFTER your estimate, so DO NOT price them yourself. Price this aircraft assuming COMPLETE logbooks and NO damage history (a clean baseline). Ignore the "Logbooks:" and "Damage history:" lines above when setting sellerAsk, fairMarketValue and buyerTarget. Do not mention logbook completeness or damage history in keyFinding/analysis — a separate records adjustment is appended automatically.\n' +
    'OTHER VALUE-ADD ITEMS (credit when present in notes/equipment, cap combined positives at +15% of base): fresh/recent engine overhaul or factory reman, recently complied ADs/SBs, recent annual, fresh paint, fresh interior, useful STC mods, hangared storage, useful-load mods.\n' +
    'OTHER DEDUCTION ITEMS (subtract when present): run-out/high-time engine, corrosion, hail/hangar rash, outdated/inop equipment, overdue inspections.\n\n'
  prompt +=
    'CRITICAL PRICING RULES: 1) Fair market value MUST be 8-15% BELOW the asking price - buyers NEVER pay full ask. 2) Engine time vs TBO is a primary value driver — fresh engines (under 25% of TBO consumed) add significant value; run-out engines (over 85% of TBO) subtract heavily. Use the SMOH/TBO life-remaining % in engineInfo when provided. 3) A 1970s airplane is worth 30-40% less than the same model from the 1990s. 4) A 1976 A36 Bonanza with 4000+ hours and older avionics (Apollo, STEC, King KI-525) has a fair value of $240-290k even with an IO-550 conversion. 5) Only modern glass cockpit A36s (G500/G1000, 1990s+, low time) reach $350k+. Year matters hugely - a 1976 is worth much less than a 2006. High airframe time reduces value. Engine conversions add 25-40k max. Older avionics add modest value. Keep spread between seller and buyer target within 10-15%.\n\n'
  // --- Internal database comparables (always injected) ----------------------
  // Fuzzy-match the make/model against our scraped Trade-A-Plane catalog and
  // inject the full detail of each price-bearing match. Year is intentionally
  // NOT used to filter — nearby years of the same make/model are useful comps.
  const dbComps = findComparables({ make: d.make, model: d.model, limit: 6 })
  if (dbComps.length) {
    prompt +=
      'INTERNAL DATABASE COMPARABLES — real Trade-A-Plane listings (asking prices) from our own catalog, matched by make/model (years deliberately NOT filtered, so nearby years are included — adjust for year/spec differences yourself). Treat these as primary evidence alongside your web search:\n\n' +
      formatComparables(dbComps) +
      '\n\nThese are ASKING prices, not sold prices. Use them together with live web data; reconcile differences in year, hours, avionics and condition when pricing.\n\n'
  } else {
    prompt +=
      'INTERNAL DATABASE COMPARABLES: no direct matches were pre-loaded for this make/model. You can still call the lookup_comps tool with alternate make/model spellings to search the internal catalog.\n\n'
  }

  prompt += 'MANDATORY — GROUND YOUR ESTIMATE IN REAL EVIDENCE BEFORE PRICING:\n'
  prompt +=
    '1. You MUST use BOTH sources of evidence: (a) the INTERNAL DATABASE COMPARABLES above (and the lookup_comps tool for more/alternate matches), AND (b) the web_search tool for current, active listings and recent sold prices. Do NOT price from memory. Using both is not optional.\n'
  prompt +=
    '2. Keep searching until you have found solid, usable data — run multiple searches with different queries if your first attempts come up short (try variations like "' + (d.year || '') + ' ' + d.make + ' ' + d.model + ' for sale price", "' + d.make + ' ' + d.model + ' asking price", "' + d.make + ' ' + d.model + ' sold price", and aircraft marketplaces like Controller, Trade-A-Plane, Aircraft For Sale, Barnstormers).\n'
  prompt +=
    '3. Use the lookup_comps tool whenever the pre-loaded internal comps are sparse, the make/model may be spelled differently, or you want more examples from the internal catalog.\n'
  prompt +=
    '4. Try very hard to base your price on at least 3-5 comparable real-world listings/sales drawn from the internal comps and the web combined. Only fall back to general market knowledge if both genuinely return nothing useful — and if so, lower confidence and note it in keyFinding.\n'
  prompt +=
    '5. Base sellerAsk, fairMarketValue and buyerTarget DIRECTLY on the actual prices you found (internal comps + web). Every number you output should be defensible by real listings, not invented.\n'
  prompt += '6. Keep the spread between seller price and buyer target within 10-15% max.\n\n'
  prompt += 'Return ONLY valid JSON — no preamble, no markdown, no text after the closing brace. Keep keyFinding to ONE sentence, analysis to 2-3 sentences, and each negotiating tip to one short sentence so the JSON stays compact and complete:\n'
  prompt +=
    '{"sellerAsk":NUMBER,"fairMarketValue":NUMBER,"buyerTarget":NUMBER,"condImpact":"+3%","avImpact":"+7%","engineImpact":"-4%","condVerdict":"Good","avVerdict":"Above average","engineVerdict":"Mid-life","keyFinding":"One sentence.","analysis":"2-3 sentences.","negotiatingTips":["Tip 1","Tip 2","Tip 3"],"confidence":"high"}'

  const provider = anthropic()
  let text = ''
  try {
    const res = await generateText({
      model: provider(models().main),
      prompt,
      maxOutputTokens: 3000,
      tools: {
        web_search: provider.tools.webSearch_20250305({ maxUses: 8 }),
        lookup_comps: tool({
          description:
            'Search the internal Trade-A-Plane aircraft database for comparable listings by make/model. ' +
            'Returns real listings WITH asking prices and full detail (year, total time, avionics, condition notes). ' +
            'Year is NOT used to filter, so nearby years of the same make/model are included. ' +
            'Use this to get more or alternately-spelled comparables beyond the ones pre-loaded into the prompt.',
          inputSchema: z.object({
            make: z.string().describe('Aircraft manufacturer, e.g. "PIPER", "CESSNA", "BEECHCRAFT".'),
            model: z
              .string()
              .describe('Model or family, e.g. "PA-28-180", "172", "A36 BONANZA". Use a broad model name for more matches.'),
            limit: z
              .number()
              .int()
              .min(1)
              .max(12)
              .optional()
              .describe('Maximum number of comparables to return (default 6).'),
          }),
          execute: async ({ make, model, limit }) => {
            const comps = findComparables({ make, model, limit: limit ?? 6 })
            return {
              count: comps.length,
              comparables: formatComparables(comps),
            }
          },
        }),
      },
      stopWhen: stepCountIs(10),
    })
    text = res.text || ''
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    throw createError({ statusCode: 502, statusMessage: 'Valuation provider error: ' + msg })
  }

  let raw: unknown
  try {
    raw = extractJson(text)
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: 'Could not parse a valuation from the AI response. Please try again.',
    })
  }

  // Coerce common shape issues (numbers returned as strings, missing optional
  // arrays) before strict validation so a minor format drift doesn't 500.
  const obj = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {}
  const toNum = (v: unknown): unknown => {
    if (typeof v === 'number') return v
    if (typeof v === 'string') {
      let str = v.trim().toLowerCase()
      const suffix = str.endsWith('k') ? 1000 : str.endsWith('m') ? 1_000_000 : 1
      if (suffix > 1) str = str.slice(0, -1)
      const n = parseFloat(str.replace(/[^0-9\.\-]/g, ''))
      if (!Number.isNaN(n)) return Math.round(n * suffix)
    }
    return v
  }
  obj.sellerAsk = toNum(obj.sellerAsk)
  obj.fairMarketValue = toNum(obj.fairMarketValue)
  obj.buyerTarget = toNum(obj.buyerTarget)
  if (!Array.isArray(obj.negotiatingTips)) {
    obj.negotiatingTips = typeof obj.negotiatingTips === 'string' ? [obj.negotiatingTips] : []
  }
  if (typeof obj.confidence !== 'string') obj.confidence = 'medium'

  const result = valSchema.safeParse(obj)
  if (!result.success) {
    throw createError({
      statusCode: 502,
      statusMessage: 'The AI returned an incomplete valuation. Please try again.',
    })
  }

  // Deterministic adjustments applied to the AI's clean baseline so ordering is
  // guaranteed and not subject to per-call web-search noise:
  //  1) avionics panel package (added as flat dollars over a basic-IFR baseline)
  //  2) logbook + damage records factors
  let out = applyAvionicsPackage(result.data, avs.length > 0 ? '' : d.avionicsPackage)
  out = applyRecordsAdjustment(out, d.logbooks, d.damage)
  out = applyOutOfAnnualAdjustment(out, d.outOfAnnual)

  if (clientId) {
    await recordValuationUsage(clientId, d.email, {
      make: d.make,
      model: d.model,
      year: d.year || null,
    })
  }

  return out
})

// Flat deduction applied when the aircraft is out of annual (airworthiness
// inspection lapsed). A non-airworthy aircraft cannot be legally flown until a
// fresh annual is completed, which is a significant, deterministic hit.
const OUT_OF_ANNUAL_DEDUCTION = 50000

function applyOutOfAnnualAdjustment(
  v: z.infer<typeof valSchema>,
  outOfAnnual: boolean,
): z.infer<typeof valSchema> {
  if (!outOfAnnual) return v
  const clampPos = (n: number) => Math.max(0, n)
  return {
    ...v,
    sellerAsk: clampPos(v.sellerAsk - OUT_OF_ANNUAL_DEDUCTION),
    fairMarketValue: clampPos(v.fairMarketValue - OUT_OF_ANNUAL_DEDUCTION),
    buyerTarget: clampPos(v.buyerTarget - OUT_OF_ANNUAL_DEDUCTION),
  }
}

function applyAvionicsPackage(
  v: z.infer<typeof valSchema>,
  pkgName: string,
): z.infer<typeof valSchema> {
  const pkg = avionicsPackageValue(pkgName)
  if (!pkg || pkg.value === 0) return v
  const add = pkg.value
  const round = (n: number) => Math.round(n / 1000) * 1000
  const adjusted = {
    ...v,
    sellerAsk: round(v.sellerAsk + add),
    fairMarketValue: round(v.fairMarketValue + add),
    buyerTarget: round(v.buyerTarget + add),
  }
  adjusted.avImpact = '+$' + add.toLocaleString('en-US')
  adjusted.avVerdict = pkgName.replace(/\s*\(.*\)\s*$/, '')
  return adjusted
}

// Fractional value impact of logbook completeness (relative to a clean baseline).
function logbookFactor(logbooks: string): number {
  switch (logbooks) {
    case 'Complete since new': return 0.05
    case 'Complete, no gaps': return 0
    case 'Minor gaps': return -0.06
    case 'Missing / incomplete': return -0.18
    default: return 0 // Unknown
  }
}

// Fractional value impact of damage history (relative to a clean baseline).
function damageFactor(damage: string): number {
  switch (damage) {
    case 'None (clean, verified)': return 0.02
    case 'Repaired, minor (documented)': return -0.06
    case 'Repaired, major (documented)': return -0.12
    default: return 0 // Unknown
  }
}

// Simplified avionics "panel package" presets. Each maps to an approximate
// added value (in dollars) over a basic IFR panel. These are deliberately
// conservative resale-VALUE figures (not install cost) and easy to tune.
function avionicsPackageValue(pkg: string): { value: number; note: string } | null {
  switch (pkg) {
    case 'Steam / round-gauge (basic)':
      return { value: 0, note: 'Legacy steam gauges — no avionics premium; may need ADS-B and upgrades.' }
    case 'Basic IFR (GPS + ADS-B)':
      return { value: 8000, note: 'A WAAS GPS navigator plus ADS-B Out — the practical baseline buyers expect.' }
    case 'Single glass upgrade (Aspen / G5 / GI 275)':
      return { value: 16000, note: 'One glass PFD (Aspen Evolution, Garmin G5 or GI 275) replacing the primary instruments.' }
    case 'Modern Garmin suite (GTN + glass + GFC autopilot)':
      return { value: 45000, note: 'A modern Garmin retrofit: GTN-series navigator, G500 TXi / dual G5/GI 275 glass, and a GFC 500/600 digital autopilot.' }
    case 'Full glass + autopilot (latest Garmin suite)':
      return { value: 60000, note: 'A full latest-generation Garmin panel (GTN Xi navigators, G500 TXi displays, GFC autopilot, GTX 345 ADS-B In/Out) — top of the retrofit market.' }
    default:
      return null
  }
}

function applyRecordsAdjustment(
  v: z.infer<typeof valSchema>,
  logbooks: string,
  damage: string,
): z.infer<typeof valSchema> {
  const lf = logbookFactor(logbooks)
  const df = damageFactor(damage)
  const factor = 1 + lf + df
  if (factor === 1) return v // nothing to adjust

  const round = (n: number) => Math.round(n / 1000) * 1000
  const adjusted = {
    ...v,
    sellerAsk: round(v.sellerAsk * factor),
    fairMarketValue: round(v.fairMarketValue * factor),
    buyerTarget: round(v.buyerTarget * factor),
  }

  // Surface the records impact in the condition verdict so the UI reflects it.
  const pct = Math.round((lf + df) * 100)
  const notes: string[] = []
  if (lf < 0) notes.push('incomplete/missing logbooks')
  else if (lf > 0) notes.push('complete logbooks')
  if (df < 0) notes.push('damage history')
  else if (df > 0) notes.push('clean, no-damage history')
  if (notes.length) {
    const sign = pct >= 0 ? '+' : ''
    adjusted.condImpact = sign + pct + '% records'
    const lead = pct < 0 ? 'Records deduction applied for ' : 'Records premium applied for '
    adjusted.keyFinding = (lead + notes.join(' and ') + ' (' + sign + pct + '% vs clean baseline). ' + (v.keyFinding || '')).trim()
  }
  return adjusted
}
