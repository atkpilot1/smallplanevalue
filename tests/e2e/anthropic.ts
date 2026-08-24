import type { BackendMocks } from '@playwright-backend-mocks/playwright'

/**
 * Messages API envelope copied from a real `generateObject` passthrough
 * recorded on GET http://127.0.0.1:4310/api/history (parse-listing).
 *
 * Anthropic returns structured output as JSON inside `content[0].text`,
 * not as tool_use. `generateText` (valuate) uses the same response shape.
 */
export function anthropicMessage(payload: unknown) {
  const text = typeof payload === 'string' ? payload : JSON.stringify(payload)
  return {
    model: 'claude-haiku-4-5-20251001',
    id: 'msg_test',
    type: 'message',
    role: 'assistant',
    content: [{ type: 'text', text }],
    stop_reason: 'end_turn',
    stop_sequence: null,
    stop_details: null,
    usage: {
      input_tokens: 10,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
      cache_creation: {
        ephemeral_5m_input_tokens: 0,
        ephemeral_1h_input_tokens: 0,
      },
      output_tokens: 20,
      service_tier: 'standard',
      inference_geo: 'not_available',
    },
  }
}

export const listingFixture = {
  make: 'Cessna',
  model: '172S',
  year: 2004,
  ttaf: 3200,
  engines: 1,
  smoh: 850,
  smohR: null,
  propHrs: null,
  propHrsR: null,
  condition: 'good',
  cosmetics: 'average',
  avionics: ['Garmin G1000'],
  notes: 'No damage history',
}

export const saleFixture = {
  make: 'Beechcraft',
  model: 'A36',
  year: 1998,
  salePrice: 285000,
  askingPrice: 310000,
  ttaf: 4200,
  smoh: 650,
  saleMonth: '2025-11',
  region: 'Southeast US',
  avionicsTier: 'Modern IFR (GTN/Avidyne + ADS-B)',
  daysOnMarket: '3-6 months',
  avionics: ['GTN750', 'G5'],
  notes: 'Turbonormalized IO-550',
}

export const valuationFixture = {
  sellerAsk: 320000,
  fairMarketValue: 295000,
  buyerTarget: 280000,
  condImpact: '+2%',
  avImpact: '+5%',
  engineImpact: '-3%',
  condVerdict: 'Above average',
  avVerdict: 'Modern glass premium',
  engineVerdict: 'Mid-time engine',
  keyFinding: 'Priced slightly above market',
  analysis: 'This aircraft is well equipped and fairly priced for the market.',
  confidence: 'high',
  negotiatingTips: ['Ask for recent annual', 'Verify SMOH logs'],
}

export const compsFixture = {
  summary: 'Active listings show steady demand for the 172S.',
  askLow: 250000,
  askMid: 295000,
  askHigh: 360000,
  avgDaysListed: 45,
  activeListings: 18,
  negotiationNote: 'Most sell within 5% of asking.',
  listings: [
    { year: 2004, ttaf: 3200, smoh: 850, ask: 295000, daysListed: 30, cond: 'Good', avionics: 'G1000' },
    { year: 2006, ttaf: 2800, smoh: 600, ask: 320000, daysListed: 21, cond: 'Excellent', avionics: 'G1000 NXi' },
  ],
}

export const checklistFixture = [
  { name: 'Firewall SB05-1 inspection', note: 'Check for cracking per Cessna SB', critical: true },
  { name: 'Seat rail AD 2011-10-09', note: 'Inspect seat rails and locking pins', critical: true },
]

function promptText(body: unknown): string {
  try {
    return JSON.stringify(body)
  } catch {
    return ''
  }
}

/** Mock Anthropic only. Local Supabase stays live. */
export async function mockAnthropic(backendMocks: BackendMocks) {
  await backendMocks.route('https://api.anthropic.com/**', async (route, request) => {
    const prompt = promptText(request.postDataJSON())
    let payload: unknown = {}

    if (prompt.includes('Parse this aircraft listing')) payload = listingFixture
    else if (prompt.includes('Parse this aircraft sale')) payload = saleFixture
    else if (prompt.includes('expert aircraft appraiser')) payload = valuationFixture
    else if (prompt.includes('aircraft market analyst')) payload = compsFixture
    else if (prompt.includes('A&P/IA mechanic')) payload = { items: checklistFixture }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: anthropicMessage(payload),
    })
  })
}
