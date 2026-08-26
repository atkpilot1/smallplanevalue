import { AV_PARSE_MAP, ALL_AVIONICS_ITEMS, collectAvionics } from '~/data/avionicsCatalog'
import type { EngineLifeState, EngineTboSpec, LookupRecord, ParsedListing, ValuationRequest } from '~/types/app'
import { isTwinFromLookup } from '~/utils/lookupPrefill'
import { STATE } from '~/utils/stateKeys'

const TBO_PRESETS = ['1500', '1600', '1700', '1800', '1900', '2000', '2100', '2200']

function emptyAvChecked() {
  return Object.fromEntries(ALL_AVIONICS_ITEMS.map((i) => [i.id, false])) as Record<string, boolean>
}

function emptyAvQty() {
  return Object.fromEntries(
    ALL_AVIONICS_ITEMS.filter((i) => i.qtyOptions).map((i) => [i.id, '1']),
  ) as Record<string, string>
}

function emptyAvSize() {
  return Object.fromEntries(
    ALL_AVIONICS_ITEMS.filter((i) => i.sizeOptions).map((i) => [i.id, i.sizeOptions![0].value]),
  ) as Record<string, string>
}

export function cirrusGenFromYear(yearStr: string, model: string) {
  const y = parseInt(String(yearStr || '').replace(/[^0-9]/g, ''), 10)
  const m = (model || '').toLowerCase()
  const isJet = /sf50|vision\s*jet/.test(m)
  if (!y) return ''
  if (isJet) {
    if (y <= 2018) return 'SF50 G1'
    if (y <= 2022) return 'SF50 G2'
    return 'SF50 G2+'
  }
  if (y <= 2003) return 'G1'
  if (y <= 2006) return 'G2'
  if (y <= 2012) return 'G3'
  if (y <= 2016) return 'G5'
  if (y <= 2023) return 'G6'
  return 'G7'
}

export function useValuationForm() {
  const ctx = useAircraftContext()
  const tboCache = useState<Record<string, EngineTboSpec>>(STATE.engineTboCache, () => ({}))
  const lastEngineLife = useState<EngineLifeState | null>(STATE.lastEngineLife, () => null)
  const tboUserOverride = useState(STATE.tboUserOverride, () => false)
  const engineTboAuto = useState(STATE.engineTboAuto, () => 2000)
  const extraTbo = useState<string | null>(STATE.extraTbo, () => null)

  const paste = useState(STATE.vPaste, () => '')
  const make = useState(STATE.vMake, () => '')
  const model = useState(STATE.vModel, () => '')
  const year = useState(STATE.vYear, () => '')
  const annualMonth = useState(STATE.vAnnualMonth, () => '')
  const annualYear = useState(STATE.vAnnualYear, () => '')
  const outOfAnnual = useState(STATE.vOutOfAnnual, () => false)
  const engineDisplay = useState(STATE.vEngineDisplay, () => '')
  const asking = useState(STATE.vAsking, () => '')
  const ttaf = useState(STATE.vTtaf, () => '')
  const engines = useState(STATE.vEngines, () => '1')
  const cirrusGen = useState(STATE.vCirrusGen, () => '')
  const cirrusTouched = useState(STATE.vCirrusTouched, () => false)
  const tbo = useState(STATE.vTbo, () => '2000')
  const engConv = useState(STATE.vEngConv, () => '')
  const smoh = useState(STATE.vSmoh, () => '')
  const prop1 = useState(STATE.vProp1, () => '')
  const smohL = useState(STATE.vSmohL, () => '')
  const smohR = useState(STATE.vSmohR, () => '')
  const propL = useState(STATE.vPropL, () => '')
  const propR = useState(STATE.vPropR, () => '')
  const cond = useState(STATE.vCond, () => 'Good — minor wear')
  const cosm = useState(STATE.vCosm, () => 'Good condition')
  const logbooks = useState(STATE.vLogbooks, () => '')
  const damage = useState(STATE.vDamage, () => '')
  const avionicsPackage = useState(STATE.vAvionicsPackage, () => '')
  const notes = useState(STATE.vNotes, () => '')
  const avChecked = useState<Record<string, boolean>>(STATE.vAvChecked, emptyAvChecked)
  const avQty = useState<Record<string, string>>(STATE.vAvQty, emptyAvQty)
  const avSize = useState<Record<string, string>>(STATE.vAvSize, emptyAvSize)
  const tboNote = useState(STATE.vTboNote, () => '')
  const hasResult = useState(STATE.vHasResult, () => false)

  const nowYear = new Date().getFullYear()
  const annualYears = Array.from({ length: nowYear - 2020 + 1 }, (_, i) => nowYear - i)

  const isTwin = computed(() => engines.value === '2')
  const isCirrus = computed(() => {
    const blob = (make.value + ' ' + model.value).toLowerCase()
    return /\bcirrus\b/.test(blob) || /\bsr20\b|\bsr22t?\b|\bsf50\b|vision\s*jet/.test(blob)
  })

  const tboOptions = computed(() => {
    const opts = TBO_PRESETS.map((v) => ({
      value: v,
      label: Number(v).toLocaleString() + ' hrs',
      extra: false,
    }))
    if (extraTbo.value && !TBO_PRESETS.includes(extraTbo.value)) {
      opts.push({
        value: extraTbo.value,
        label: Number(extraTbo.value).toLocaleString() + ' hrs (auto)',
        extra: true,
      })
    }
    return opts
  })

  function toggleCirrusGen() {
    if (isCirrus.value && !cirrusTouched.value) {
      const g = cirrusGenFromYear(year.value, make.value + ' ' + model.value)
      if (g) cirrusGen.value = g
    }
  }

  function currentEngineModelStr() {
    const fromDisp = engineDisplay.value.trim()
    const fromLookup = ((ctx.valEngMake.value || '') + ' ' + (ctx.valEngModel.value || '')).trim()
    return fromLookup || fromDisp
  }

  function modelForEngineLife() {
    const conv = engConv.value.trim()
    if (/io[\s-]?550|o[\s-]?550/i.test(conv)) return 'IO-550'
    return currentEngineModelStr()
  }

  function getEffectiveTbo() {
    const v = parseInt(tbo.value, 10)
    return (v > 0 ? v : engineTboAuto.value) || 2000
  }

  function refreshEngineLifeBars() {
    const tboHrs = getEffectiveTbo()
    const lifeBlocks: EngineLifeState['engines'] = []
    if (isTwin.value) {
      const sl = parseInt(smohL.value, 10)
      const sr = parseInt(smohR.value, 10)
      if (sl > 0) lifeBlocks.push({ label: 'Left', smoh: sl, tbo: tboHrs })
      if (sr > 0) lifeBlocks.push({ label: 'Right', smoh: sr, tbo: tboHrs })
    } else {
      const s = parseInt(smoh.value, 10)
      if (s > 0) lifeBlocks.push({ label: 'Engine', smoh: s, tbo: tboHrs })
    }
    lastEngineLife.value = { tbo: tboHrs, engines: lifeBlocks, model: currentEngineModelStr() }
  }

  async function fetchEngineTbo(engModel: string, tboOverride: number | null) {
    const makeName = ctx.valEngMake.value || ''
    const key = (engModel || '').toUpperCase() + '|' + makeName.toUpperCase() + '||' + (tboOverride || '')
    if (tboCache.value[key]) return tboCache.value[key]
    const q = new URLSearchParams()
    if (engModel) q.set('model', engModel)
    if (makeName) q.set('make', makeName)
    if (tboOverride) q.set('tbo', String(tboOverride))
    const r = await fetch('/api/engine-tbo?' + q.toString())
    const data = await r.json().catch(() => ({})) as EngineTboSpec
    tboCache.value = { ...tboCache.value, [key]: data }
    return data
  }

  async function refreshEngineLife() {
    const engModel = modelForEngineLife()
    const spec = await fetchEngineTbo(engModel, tboUserOverride.value ? getEffectiveTbo() : null)
    engineTboAuto.value = spec.tbo || 2000
    if (!tboUserOverride.value) {
      extraTbo.value = null
      const auto = String(Math.round(engineTboAuto.value))
      if (!TBO_PRESETS.includes(auto)) extraTbo.value = auto
      tbo.value = auto
    }
    tboNote.value = tboUserOverride.value
      ? 'TBO manually set to ' + getEffectiveTbo().toLocaleString() + ' hrs (auto would be ' + engineTboAuto.value.toLocaleString() + ').'
      : (spec.matchType === 'default'
        ? 'TBO defaulting to ' + (spec.tbo || 2000).toLocaleString() + ' hrs — select above if your engine has a different interval.'
        : 'TBO ' + spec.tbo.toLocaleString() + ' hrs (' + spec.matchType + ' match: ' + spec.matchedKey + ').')
    refreshEngineLifeBars()
  }

  function onTboOverride() {
    const v = getEffectiveTbo()
    const auto = engineTboAuto.value || 2000
    tboUserOverride.value = v !== auto
    refreshEngineLifeBars()
  }

  function resetTboAuto() {
    tboUserOverride.value = false
    refreshEngineLife()
  }

  function resetForm() {
    make.value = ''
    model.value = ''
    year.value = ''
    ttaf.value = ''
    engines.value = '1'
    smoh.value = ''
    prop1.value = ''
    smohL.value = ''
    smohR.value = ''
    propL.value = ''
    propR.value = ''
    cond.value = 'Good — minor wear'
    cosm.value = 'Good condition'
    notes.value = ''
    engineDisplay.value = ''
    asking.value = ''
    annualMonth.value = ''
    annualYear.value = ''
    outOfAnnual.value = false
    engConv.value = ''
    extraTbo.value = null
    tbo.value = '2000'
    tboUserOverride.value = false
    tboNote.value = ''
    lastEngineLife.value = null
    cirrusGen.value = ''
    cirrusTouched.value = false
    logbooks.value = ''
    damage.value = ''
    avionicsPackage.value = ''
    avChecked.value = emptyAvChecked()
    avQty.value = emptyAvQty()
    avSize.value = emptyAvSize()
    paste.value = ''
    hasResult.value = false
    toggleCirrusGen()
  }

  function prefillFromLookup(d: LookupRecord) {
    ctx.valEngMake.value = d.engineMake || ''
    ctx.valEngModel.value = d.engineModel || ''
    resetForm()
    engineDisplay.value = ((d.engineMake || '') + ' ' + (d.engineModel || '')).trim()
    make.value = d.make || ''
    model.value = d.model || ''
    year.value = d.year != null ? String(d.year) : ''
    if (isTwinFromLookup(d)) engines.value = '2'
    toggleCirrusGen()
    refreshEngineLife()
  }

  function applyParsedListing(d: ParsedListing) {
    const L = ctx.lastLookup.value || {}
    if (L.make) make.value = String(L.make)
    if (L.model) model.value = String(L.model)
    if (L.year) year.value = String(L.year)
    ctx.valEngMake.value = L.engineMake || ctx.valEngMake.value || ''
    ctx.valEngModel.value = L.engineModel || ctx.valEngModel.value || ''
    engineDisplay.value = ((ctx.valEngMake.value || '') + ' ' + (ctx.valEngModel.value || '')).trim()
    if (isTwinFromLookup(L)) engines.value = '2'
    if (d.make) make.value = d.make
    if (d.model) model.value = d.model
    if (d.year) year.value = String(d.year)
    if (d.ttaf) ttaf.value = String(d.ttaf)
    if (d.engines === 2 || d.engines === 1) engines.value = d.engines === 2 ? '2' : '1'
    if (engines.value === '2') {
      if (d.smoh != null) smohL.value = String(d.smoh)
      if (d.smohR != null) smohR.value = String(d.smohR)
      if (d.propHrs != null) propL.value = String(d.propHrs)
      if (d.propHrsR != null) propR.value = String(d.propHrsR)
    } else {
      if (d.smoh != null) smoh.value = String(d.smoh)
      if (d.propHrs != null) prop1.value = String(d.propHrs)
    }
    if (d.condition) cond.value = d.condition
    if (d.cosmetics) cosm.value = d.cosmetics
    if (d.notes) notes.value = (d.notes || '').substring(0, 200)
    if (d.avionics && Array.isArray(d.avionics)) {
      const next = { ...avChecked.value }
      d.avionics.forEach((av) => {
        for (const key of Object.keys(AV_PARSE_MAP)) {
          if (av.toUpperCase().indexOf(key.toUpperCase()) >= 0) {
            next[AV_PARSE_MAP[key]] = true
            break
          }
        }
      })
      avChecked.value = next
    }
    toggleCirrusGen()
  }

  function collectedAvionics() {
    return collectAvionics(avChecked.value, avQty.value, avSize.value)
  }

  function identity() {
    return {
      make: String(make.value ?? '').trim(),
      model: String(model.value ?? '').trim(),
      year: String(year.value ?? ''),
    }
  }

  function buildValuationPayload(opts: { clientId: string; email: string | null }): ValuationRequest | null {
    const { make: mk, model: md, year: yr } = identity()
    if (!mk || !md) return null

    const ttafVal = String(ttaf.value ?? '')
    const notesText = notes.value.replace(/["'\\]/g, ' ')
    let annualInfo = ''
    if (annualMonth.value && annualYear.value) {
      const annualVal = annualYear.value + '-' + annualMonth.value
      const ad = new Date(annualVal + '-01')
      const now = new Date()
      const months = Math.round((now.getTime() - ad.getTime()) / (1000 * 60 * 60 * 24 * 30))
      const pct = Math.min(100, Math.round(months / 12 * 100))
      annualInfo = 'Annual inspection done ' + months + ' months ago (' + pct + '% through annual cycle). '
    }
    const out = !!outOfAnnual.value
    if (out) annualInfo += 'Aircraft is OUT OF ANNUAL (airworthiness inspection lapsed). '

    const tboHrs = getEffectiveTbo()
    const twin = isTwin.value
    const engineModel = currentEngineModelStr()
    let engineSmoh: number | null = null
    let engineSmohL: number | null = null
    let engineSmohR: number | null = null
    let engineInfo = ''
    if (twin) {
      const sl = smohL.value
      const sr2 = smohR.value
      if (sl) engineSmohL = parseInt(sl, 10)
      if (sr2) engineSmohR = parseInt(sr2, 10)
      engineInfo = 'Twin engine. Engine: ' + (ctx.valEngMake.value || '') + ' ' + (ctx.valEngModel.value || '') + '. Left SMOH: ' + (sl || '?') + ' hrs, Right SMOH: ' + (sr2 || '?') + ' hrs, Left prop: ' + (propL.value || '?') + ' hrs, Right prop: ' + (propR.value || '?') + ' hrs'
    } else {
      const smohVal = smoh.value
      if (smohVal) engineSmoh = parseInt(smohVal, 10)
      engineInfo = 'Single engine. Engine: ' + (ctx.valEngMake.value || '') + ' ' + (ctx.valEngModel.value || '') + '. SMOH: ' + (smohVal || '?') + ' hrs, Prop TSOH: ' + (prop1.value || '?') + ' hrs'
    }
    if (engConv.value.trim()) {
      engineInfo += '. Engine conversion/STC: ' + engConv.value.trim().replace(/["'\\]/g, ' ')
    }
    if (lastEngineLife.value && lastEngineLife.value.engines.length) {
      engineInfo += '. Recommended TBO: ' + tboHrs + ' hrs.'
      lastEngineLife.value.engines.forEach((e) => {
        const pct = e.life ? e.life.pctRemaining : Math.max(0, Math.round((1 - e.smoh / e.tbo) * 100))
        engineInfo += ' ' + e.label + ' engine: ' + e.smoh + ' SMOH / ' + e.tbo + ' TBO (' + pct + '% life remaining).'
      })
    } else if (tboHrs) {
      engineInfo += '. Recommended TBO: ' + tboHrs + ' hrs (enter SMOH for life-remaining analysis).'
    }

    const askPrice = String(asking.value ?? '')
    return {
      make: mk,
      model: md,
      year: yr || '',
      ttaf: ttafVal || '',
      engineInfo,
      annualInfo,
      cond: cond.value,
      cosm: cosm.value,
      avionics: collectedAvionics(),
      notes: notesText || '',
      asking: askPrice || '',
      cirrusGen: cirrusGen.value,
      logbooks: logbooks.value,
      damage: damage.value,
      outOfAnnual: out,
      avionicsPackage: avionicsPackage.value,
      clientId: opts.clientId,
      email: opts.email,
      engineModel,
      engineTbo: tboHrs,
      engineSmoh,
      engineSmohL,
      engineSmohR,
      isTwin: twin,
      engineConversion: engConv.value.trim() || '',
    }
  }

  return {
    paste, make, model, year, annualMonth, annualYear, outOfAnnual, engineDisplay,
    asking, ttaf, engines, cirrusGen, cirrusTouched, tbo, engConv, smoh, prop1,
    smohL, smohR, propL, propR, cond, cosm, logbooks, damage, avionicsPackage,
    notes, avChecked, avQty, avSize, tboNote, lastEngineLife, tboUserOverride, hasResult,
    annualYears, isTwin, isCirrus, tboOptions,
    toggleCirrusGen, refreshEngineLife, refreshEngineLifeBars, onTboOverride,
    resetTboAuto, resetForm, prefillFromLookup,
    applyParsedListing, collectedAvionics, getEffectiveTbo, currentEngineModelStr,
    identity, buildValuationPayload,
  }
}
