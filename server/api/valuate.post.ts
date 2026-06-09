import { z } from 'zod'
import { generateText, stepCountIs } from 'ai'

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

function extractJson(txt: string): unknown {
  const cleaned = txt.replace(/```json|```/g, '').trim()
  const m = cleaned.match(/\{[\s\S]*\}/)
  if (m) {
    try {
      return JSON.parse(m[0])
    } catch {
      const m2 = cleaned.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/)
      return m2 ? JSON.parse(m2[0]) : JSON.parse(cleaned)
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

  let prompt =
    'You are an expert aircraft appraiser with current 2025-2026 market knowledge. Provide ACCURATE asking prices — not lowballed.\n\n'
  prompt +=
    '2025-2026 market:\n- Beech Baron D55/E55: $180k-$320k. Fresh matched engines +$40-60k. G500 TXi+GTN 750Xi+GFC 600 adds $30-50k.\n'
  prompt +=
    '- Autopilot: GFC 600 is gold standard (+$15-20k). S-TEC 3100 capable but $25-30k less than GFC 600. S-TEC 55X basic (+$2-4k). S-TEC 65 is an older rate-based unit, less capable than the 55X (+$1-2k).\n'
  prompt +=
    '- Cessna 172: $80k-$250k. Cessna 182: $120k-$350k. RV-10: $260k-$530k (older/basic $260-330k, newer/loaded $400-530k).\n'
  prompt +=
    '- Cirrus SR20: $150k-$350k (G1-G2 $150-220k, G3+ $220-350k). SR22: $240k-$1M+ (G1-G2 $240-350k, G3 $300-500k, G5-G6 $600k-1M+). SR22T: $350k-$1.1M+.\n'
  prompt +=
    '- Piper Cherokee/Archer: $50k-$150k. Saratoga/Lance: $180k-$400k. Mooney M20: $100k-$350k.\n'
  prompt +=
    '- Avionics: G1000 NXi +$25-35k, G500 TXi +$18-25k, Aspen EFD +$8-12k, GTN 750Xi +$12-18k. Radar on twins +$5-10k.\n'
  prompt +=
    '- Twins: matched engine times=premium. Factory new engines $15-20k more than field OH. 3-blade props +$3-8k.\n\n'
  prompt +=
    'Aircraft: ' + (d.year || '?') + ' ' + d.make + ' ' + d.model + '\nTTAF: ' + (d.ttaf || '?') + ' hrs\n' + d.engineInfo + '\n'
  prompt +=
    'Annual: ' + (d.annualInfo || 'Unknown') + '. Condition: ' + d.cond + ', Paint/Interior: ' + d.cosm + '\nAvionics: ' + (avs.length ? avs.join(', ') : 'Standard/basic') + '\nNotes: ' + (d.notes || 'none') + '\n'
  prompt +=
    'CRITICAL PRICING RULES: 1) Fair market value MUST be 8-15% BELOW the asking price - buyers NEVER pay full ask. 2) A 1970s airplane is worth 30-40% less than the same model from the 1990s. 3) A 1976 A36 Bonanza with 4000+ hours and older avionics (Apollo, STEC, King KI-525) has a fair value of $240-290k even with an IO-550 conversion. 4) Only modern glass cockpit A36s (G500/G1000, 1990s+, low time) reach $350k+. Year matters hugely - a 1976 is worth much less than a 2006. High airframe time reduces value. Engine conversions add 25-40k max. Older avionics add modest value. Keep spread between seller and buyer target within 10-15%.\n\n'
  prompt += 'MANDATORY — GROUND YOUR ESTIMATE IN REAL EVIDENCE BEFORE PRICING:\n'
  prompt +=
    '1. You MUST use the web_search tool to find CURRENT, ACTIVE listings and recent sold prices for this exact make/model/year. Do NOT price from memory. Searching is not optional.\n'
  prompt +=
    '2. Keep searching until you have found solid, usable data — run multiple searches with different queries if your first attempts come up short (try variations like "' + (d.year || '') + ' ' + d.make + ' ' + d.model + ' for sale price", "' + d.make + ' ' + d.model + ' asking price", "' + d.make + ' ' + d.model + ' sold price", and aircraft marketplaces like Controller, Trade-A-Plane, Aircraft For Sale, Barnstormers).\n'
  prompt +=
    '3. Try very hard to find at least 3-5 comparable real-world listings/sales. Only fall back to general market knowledge if repeated searches genuinely return nothing useful — and if so, lower confidence and note it in keyFinding.\n'
  prompt +=
    '4. Base sellerAsk, fairMarketValue and buyerTarget DIRECTLY on the actual prices you found online. Every number you output should be defensible by the real listings you located, not invented.\n'
  prompt += '5. Keep the spread between seller price and buyer target within 10-15% max.\n\n'
  prompt += 'Return ONLY valid JSON:\n'
  prompt +=
    '{"sellerAsk":NUMBER,"fairMarketValue":NUMBER,"buyerTarget":NUMBER,"condImpact":"+3%","avImpact":"+7%","engineImpact":"-4%","condVerdict":"Good","avVerdict":"Above average","engineVerdict":"Mid-life","keyFinding":"One sentence.","analysis":"2-3 sentences.","negotiatingTips":["Tip 1","Tip 2","Tip 3"],"confidence":"high"}'

  const provider = anthropic()
  const { text } = await generateText({
    model: provider(models().main),
    prompt,
    maxOutputTokens: 1500,
    tools: {
      web_search: provider.tools.webSearch_20250305({ maxUses: 8 }),
    },
    stopWhen: stepCountIs(10),
  })

  return valSchema.parse(extractJson(text))
})
