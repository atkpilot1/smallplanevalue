export interface GuideDriver {
  title: string
  text: string
}

export interface GuideVariant {
  name: string
  note: string
}

export interface GuideFaq {
  question: string
  answer: string
}

export interface AircraftGuide {
  slug: string
  name: string
  shortName: string
  /** Valuation form make. */
  make: string
  /** Valuation form model. Owners can change it after they land. */
  model: string
  /** '2' opens the twin engine fields. */
  engines: '1' | '2'
  title: string
  description: string
  kicker: string
  headline: string
  lede: string
  drivers: GuideDriver[]
  variants: GuideVariant[]
  faqs: GuideFaq[]
  related: string[]
}

export const AIRCRAFT_GUIDES: AircraftGuide[] = [
  {
    slug: 'baron',
    name: 'Beech Baron',
    shortName: 'Baron',
    make: 'Beechcraft',
    model: 'Baron 58',
    engines: '2',
    title: 'Beech Baron value — what actually moves a 55 or 58',
    description: 'How to value a Beech Baron 55, 58, or 58P. Two engine times, ice protection, and the panel matter more than a single asking price. No fabricated sale prices.',
    kicker: 'Piston twin',
    headline: 'What a Beech Baron is worth depends on both engines.',
    lede: 'Owners search for a Baron value when they are pricing a 55, a 58, or a pressurized 58P. There is no single number. General aviation sale prices are not publicly recorded, so SmallPlaneValue shows an asking range and a fair-market band from the airplane you describe — not a made-up sold price.',
    drivers: [
      {
        title: 'Left and right engine time',
        text: 'A mid-time pair is a different airplane from one fresh engine and one that is near TBO. Enter both SMOH figures. A buyer prices the next overhaul on the tired side.',
      },
      {
        title: 'Ice protection',
        text: 'Boots, FIKI, and a known-ice package change who will even consider the airplane in the northern US. Say which one is installed, not just “de-ice.”',
      },
      {
        title: 'Panel and autopilot',
        text: 'A steam panel with a vintage autopilot and a GTN / G1000 airplane with a modern autopilot do not compete for the same buyer, even when the airframes match.',
      },
      {
        title: 'Documented damage',
        text: 'Gear-up events and prop strikes belong in the notes when the logs show them. A clean, complete set of logs is part of the value, not a footnote.',
      },
    ],
    variants: [
      { name: 'Baron 55', note: 'The smaller, earlier twin. Compare it with other 55s, not with a late G58.' },
      { name: 'Baron 58', note: 'The common six-seat straight-tail twin. Club seating and the rear doors are why many buyers start here.' },
      { name: 'Baron 58P / G58', note: 'Pressurized 58Ps and later G58s are different markets. Name the exact model in the form.' },
    ],
    faqs: [
      {
        question: 'What is a Beech Baron worth?',
        answer: 'It depends on the model, the year, both engine times, ice protection, the panel, and the logs. SmallPlaneValue turns those inputs into an asking range and a fair-market band. It does not invent a sale price.',
      },
      {
        question: 'Should I value a Baron 55 and a Baron 58 the same way?',
        answer: 'Use the same process, and change the model. A 55 and a 58 do not share one price. Come back and run the other model when you are comparing them.',
      },
    ],
    related: ['bonanza', 'piper-malibu'],
  },
  {
    slug: 'bonanza',
    name: 'Beech Bonanza',
    shortName: 'Bonanza',
    make: 'Beechcraft',
    model: 'Bonanza A36',
    engines: '1',
    title: 'Beech Bonanza value — A36, V35, and F33',
    description: 'How to value a Beech Bonanza A36, V35, or F33. Year, engine conversion, and the panel move the number. Honest asking ranges, no fabricated sale prices.',
    kicker: 'Piston single',
    headline: 'A Bonanza value is a year, an engine, and a panel — not one model price.',
    lede: 'Pilots come back to price a V-tail, then an A36, then a late glass airplane. Those are not the same listing. Enter the variant you are actually looking at. We show asking ranges and a negotiation band because GA transactions are not a public record.',
    drivers: [
      {
        title: 'Which Bonanza',
        text: 'A V35, an F33A, and an A36 answer different missions. The A36 is the six-seat airplane people cross-shop with a Baron. Put the variant in the model field.',
      },
      {
        title: 'Engine and STCs',
        text: 'An IO-550 conversion, tip tanks, and a turbonormalized engine are not “average Bonanza.” Name the conversion. Time since overhaul still sets the engine adjustment.',
      },
      {
        title: 'Year and panel',
        text: 'A 1970s airframe with a legacy panel and a 1990s or later airplane with a Garmin suite are different markets, even under the same marketing name.',
      },
      {
        title: 'Logs and damage history',
        text: 'Complete logs since new support the ask. A documented spar, firewall, or prop-strike repair belongs in the damage field so the band can reflect it.',
      },
    ],
    variants: [
      { name: 'V35 / V-tail', note: 'The classic V-tail. Buyers still ask about the tail; the logs are the evidence, not the rumor.' },
      { name: 'F33A', note: 'Straight tail, usually four or five seats. Do not price it as an A36.' },
      { name: 'A36', note: 'Six seats and club seating. The default starting point if you are comparing family haulers.' },
    ],
    faqs: [
      {
        question: 'What is a Beech Bonanza A36 worth?',
        answer: 'Start a valuation with make Beechcraft and model Bonanza A36, then add year, total time, engine time, and the panel. The result is an asking range and a fair-market band for that airplane.',
      },
      {
        question: 'I already valued my Baron. Why run a Bonanza separately?',
        answer: 'A twin and a single do not share engine risk, insurance, or buyers. Run the Bonanza on its own when that becomes the airplane you are considering.',
      },
    ],
    related: ['baron', 'cirrus-sr22'],
  },
  {
    slug: 'cirrus-sr22',
    name: 'Cirrus SR22',
    shortName: 'SR22',
    make: 'Cirrus',
    model: 'SR22',
    engines: '1',
    title: 'Cirrus SR22 value — generation, turbo, and CAPS',
    description: 'How to value a Cirrus SR22 or SR22T. Generation, turbo, and CAPS status change the airplane. Honest asking ranges, no fabricated sale prices.',
    kicker: 'Piston single',
    headline: 'An SR22 value starts with the generation, not the badge.',
    lede: 'SR22, SR22T, and SR20 are different airplanes, and a G2 is not a G6. SmallPlaneValue asks for the Cirrus generation because the airframe, cabin, and panel changed with it. You still will not get a fabricated sale price — GA sales are not publicly recorded.',
    drivers: [
      {
        title: 'Generation',
        text: 'G1 through G7 (and the jet, if that is what you have) changed the airframe and the panel. Pick the generation or let the year fill it. Do not leave it on auto-detect if you know the airplane.',
      },
      {
        title: 'SR22 or SR22T',
        text: 'The turbo SR22T is a different listing from a normally aspirated SR22. Put SR22T in the model field when that is the airplane.',
      },
      {
        title: 'CAPS',
        text: 'The airframe parachute is part of the airplane. Buyers ask when it was last repacked. Put the date in the notes if you have it.',
      },
      {
        title: 'Perspective versus an earlier panel',
        text: 'A Perspective or Perspective+ panel is not the same ask as an earlier Avidyne or pre-Perspective Garmin suite. Use the avionics fields instead of a generic “glass” label.',
      },
    ],
    variants: [
      { name: 'SR20', note: 'Smaller engine and a different mission. Value it as an SR20, not as a discounted SR22.' },
      { name: 'SR22', note: 'Normally aspirated. The volume airplane in the line.' },
      { name: 'SR22T', note: 'Turbo. Say so in the model field before you compare it with an SR22.' },
    ],
    faqs: [
      {
        question: 'What is a Cirrus SR22 worth?',
        answer: 'Enter Cirrus and SR22 or SR22T, the year, total time, engine time, and the generation. The valuation is an asking range and a fair-market band for that combination.',
      },
      {
        question: 'Does the parachute change the value?',
        answer: 'CAPS is standard equipment, and the repack is a real, dated cost. Record the status in the notes so it is part of the description you are pricing.',
      },
    ],
    related: ['bonanza', 'piper-malibu'],
  },
  {
    slug: 'piper-malibu',
    name: 'Piper Malibu',
    shortName: 'Malibu',
    make: 'Piper',
    model: 'Malibu Mirage',
    engines: '1',
    title: 'Piper Malibu value — Mirage, Matrix, and the PA-46',
    description: 'How to value a Piper Malibu, Mirage, or Matrix. The engine and whether it is pressurized decide the comparison. No fabricated sale prices.',
    kicker: 'Pressurized single',
    headline: 'A Malibu value is whichever PA-46 is actually on the ramp.',
    lede: '“Malibu” gets used for several PA-46s. The original Malibu is Continental-powered. The Mirage is Lycoming-powered and pressurized. The Matrix is the unpressurized sibling. Turbine M500 and M600 airplanes are a different class. Name the one you are pricing.',
    drivers: [
      {
        title: 'Engine model and time',
        text: 'The first question on a PA-46 is which engine is installed and where it sits against TBO. A conversion or a factory engine belongs in the engine notes, not in a guess.',
      },
      {
        title: 'Pressurization',
        text: 'A Mirage and a Matrix do not fly the same trips. Price the pressurized airplane and the unpressurized airplane separately.',
      },
      {
        title: 'Ice, radar, and oxygen',
        text: 'Known ice, weather radar, and a built-in oxygen system are why someone is shopping a PA-46 instead of a Bonanza. Check the equipment that is actually in the airplane.',
      },
      {
        title: 'Avidyne versus Garmin',
        text: 'Entegra and G1000 panels split the used market. Pick the real suite in the avionics section.',
      },
    ],
    variants: [
      { name: 'Malibu', note: 'Earlier Continental-powered PA-46. Do not relabel it as a Mirage.' },
      { name: 'Malibu Mirage', note: 'Lycoming-powered pressurized single. The usual “Mirage” search.' },
      { name: 'Matrix', note: 'Unpressurized PA-46. Value it on its own when that is the listing.' },
    ],
    faqs: [
      {
        question: 'What is a Piper Malibu worth?',
        answer: 'Choose Malibu, Mirage, or Matrix first. Then add year, engine time, pressurization, and the panel. The result is an asking range and a fair-market band, not a recorded sale price.',
      },
      {
        question: 'Is an M600 the same valuation?',
        answer: 'No. The M500 and M600 are turbines. Run them as their own model if that is the airplane you are researching later.',
      },
    ],
    related: ['bonanza', 'cirrus-sr22'],
  },
]

export function guideBySlug(slug: string): AircraftGuide | undefined {
  return AIRCRAFT_GUIDES.find((guide) => guide.slug === slug)
}

export function relatedGuides(guide: AircraftGuide): AircraftGuide[] {
  return guide.related
    .map((slug) => guideBySlug(slug))
    .filter((item): item is AircraftGuide => !!item)
}

/** Homepage query that opens the valuation form on this airplane. */
export function valuationHref(guide: Pick<AircraftGuide, 'make' | 'model' | 'engines'>): string {
  const params = new URLSearchParams({
    tab: 'val',
    make: guide.make,
    model: guide.model,
    engines: guide.engines,
  })
  return `/?${params.toString()}`
}

export function valuationQueryFromSearch(search: string): { make: string; model: string; year: string; engines: '' | '1' | '2' } | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const make = (params.get('make') || '').trim()
  const model = (params.get('model') || '').trim()
  if (!make && !model) return null
  const rawEngines = params.get('engines')
  const engines = rawEngines === '1' || rawEngines === '2' ? rawEngines : ''
  return {
    make,
    model,
    year: (params.get('year') || '').trim(),
    engines,
  }
}
