/**
 * SmallPlaneValue — valuation engine  (valuationEngine.js)
 * --------------------------------------------------------------------------
 * Deterministic avionics + engine adjustments layered on a base airframe value.
 * No dependencies. Import, call valuate(), render the breakdown.
 *
 * WHY: replaces the direct-Claude price call. Every dollar here traces to a
 * coefficient, so "0 fabricated sale prices" is literally true. Claude/Haiku
 * only NARRATES the breakdown this returns — it never produces the number.
 *
 * TUNE: the CONFIG block and the `retained / decay / floor` columns are your
 * knobs. As Report-a-Sale data accumulates, fit these to real sale deltas.
 * --------------------------------------------------------------------------
 */

// id | category | item | cost(installed) | retained(when new) | decay/yr | floor | typical age (yrs)
// + capability flags: lpv, adsbOut, adsbIn, coupledAP, glass
export const AVIONICS = [
  { id:"nav_gtn750xi", category:"Navigator", item:"Garmin GTN 750Xi", cost:26000, retained:0.60, decay:0.05, floor:0.35, years:3, lpv:1, adsbOut:0, adsbIn:0, coupledAP:0, glass:0 },
  { id:"nav_gtn650xi", category:"Navigator", item:"Garmin GTN 650Xi", cost:19000, retained:0.60, decay:0.05, floor:0.35, years:3, lpv:1, adsbOut:0, adsbIn:0, coupledAP:0, glass:0 },
  { id:"nav_gtn750",   category:"Navigator", item:"Garmin GTN 750 (legacy)", cost:18000, retained:0.45, decay:0.06, floor:0.25, years:8, lpv:1, adsbOut:0, adsbIn:0, coupledAP:0, glass:0 },
  { id:"nav_gtn650",   category:"Navigator", item:"Garmin GTN 650 (legacy)", cost:13000, retained:0.45, decay:0.06, floor:0.25, years:8, lpv:1, adsbOut:0, adsbIn:0, coupledAP:0, glass:0 },
  { id:"nav_gns530w",  category:"Navigator", item:"Garmin GNS 530W", cost:11000, retained:0.40, decay:0.06, floor:0.20, years:15, lpv:1, adsbOut:0, adsbIn:0, coupledAP:0, glass:0 },
  { id:"nav_gns430w",  category:"Navigator", item:"Garmin GNS 430W", cost:8000, retained:0.40, decay:0.06, floor:0.20, years:15, lpv:1, adsbOut:0, adsbIn:0, coupledAP:0, glass:0 },
  { id:"nav_gnc355",   category:"Navigator", item:"Garmin GNC 355", cost:12000, retained:0.50, decay:0.06, floor:0.30, years:3, lpv:1, adsbOut:0, adsbIn:0, coupledAP:0, glass:0 },
  { id:"nav_gnx375",   category:"Navigator", item:"Garmin GNX 375", cost:13000, retained:0.50, decay:0.06, floor:0.30, years:3, lpv:1, adsbOut:1, adsbIn:1, coupledAP:0, glass:0 },
  { id:"nav_gps175",   category:"Navigator", item:"Garmin GPS 175", cost:9000, retained:0.48, decay:0.06, floor:0.28, years:3, lpv:1, adsbOut:0, adsbIn:0, coupledAP:0, glass:0 },
  { id:"nav_ifd540",   category:"Navigator", item:"Avidyne IFD540", cost:16000, retained:0.45, decay:0.06, floor:0.25, years:6, lpv:1, adsbOut:0, adsbIn:0, coupledAP:0, glass:0 },
  { id:"nav_ifd440",   category:"Navigator", item:"Avidyne IFD440", cost:12000, retained:0.45, decay:0.06, floor:0.25, years:6, lpv:1, adsbOut:0, adsbIn:0, coupledAP:0, glass:0 },

  { id:"pfd_g500txi",  category:"Glass", item:"Garmin G500 TXi", cost:19000, retained:0.55, decay:0.06, floor:0.30, years:4, lpv:0, adsbOut:0, adsbIn:0, coupledAP:0, glass:1 },
  { id:"pfd_g600txi",  category:"Glass", item:"Garmin G600 TXi", cost:26000, retained:0.55, decay:0.06, floor:0.30, years:4, lpv:0, adsbOut:0, adsbIn:0, coupledAP:0, glass:1 },
  { id:"pfd_g3x",      category:"Glass", item:"Garmin G3X Touch (certified)", cost:22000, retained:0.55, decay:0.06, floor:0.30, years:3, lpv:0, adsbOut:0, adsbIn:0, coupledAP:0, glass:1 },
  { id:"pfd_gi275",    category:"Glass", item:"Garmin GI 275 (each)", cost:6000, retained:0.50, decay:0.06, floor:0.30, years:3, lpv:0, adsbOut:0, adsbIn:0, coupledAP:0, glass:1 },
  { id:"pfd_g5",       category:"Glass", item:"Garmin G5 (each)", cost:5500, retained:0.50, decay:0.06, floor:0.30, years:4, lpv:0, adsbOut:0, adsbIn:0, coupledAP:0, glass:1 },
  { id:"pfd_aspen_e5", category:"Glass", item:"Aspen Evolution E5", cost:8000, retained:0.45, decay:0.07, floor:0.25, years:5, lpv:0, adsbOut:0, adsbIn:0, coupledAP:0, glass:1 },
  { id:"pfd_aspen_promax", category:"Glass", item:"Aspen Evolution Pro Max", cost:13000, retained:0.45, decay:0.07, floor:0.25, years:5, lpv:0, adsbOut:0, adsbIn:0, coupledAP:0, glass:1 },
  { id:"pfd_dynon_hdx",category:"Glass", item:"Dynon SkyView HDX (STC)", cost:16000, retained:0.45, decay:0.07, floor:0.25, years:4, lpv:0, adsbOut:0, adsbIn:0, coupledAP:0, glass:1 },

  { id:"ap_gfc500",    category:"Autopilot", item:"Garmin GFC 500 (2-axis)", cost:18000, retained:0.60, decay:0.05, floor:0.35, years:4, lpv:0, adsbOut:0, adsbIn:0, coupledAP:1, glass:0 },
  { id:"ap_gfc600",    category:"Autopilot", item:"Garmin GFC 600", cost:30000, retained:0.60, decay:0.05, floor:0.35, years:4, lpv:0, adsbOut:0, adsbIn:0, coupledAP:1, glass:0 },
  { id:"ap_stec3100",  category:"Autopilot", item:"Genesys S-TEC 3100", cost:20000, retained:0.58, decay:0.05, floor:0.33, years:4, lpv:0, adsbOut:0, adsbIn:0, coupledAP:1, glass:0 },
  { id:"ap_dfc100",    category:"Autopilot", item:"Avidyne DFC100", cost:15000, retained:0.50, decay:0.06, floor:0.28, years:7, lpv:0, adsbOut:0, adsbIn:0, coupledAP:1, glass:0 },
  { id:"ap_dfc90",     category:"Autopilot", item:"Avidyne DFC90", cost:10000, retained:0.45, decay:0.06, floor:0.25, years:9, lpv:0, adsbOut:0, adsbIn:0, coupledAP:1, glass:0 },
  { id:"ap_stec55x",   category:"Autopilot", item:"Genesys S-TEC 55X", cost:15000, retained:0.45, decay:0.06, floor:0.25, years:12, lpv:0, adsbOut:0, adsbIn:0, coupledAP:1, glass:0 },
  { id:"ap_stec65",    category:"Autopilot", item:"Genesys S-TEC 65", cost:14000, retained:0.45, decay:0.06, floor:0.25, years:12, lpv:0, adsbOut:0, adsbIn:0, coupledAP:1, glass:0 },
  { id:"ap_kfc150",    category:"Autopilot", item:"Bendix/King KFC 150", cost:7000, retained:0.30, decay:0.05, floor:0.15, years:25, lpv:0, adsbOut:0, adsbIn:0, coupledAP:1, glass:0 },
  { id:"ap_kap140",    category:"Autopilot", item:"Bendix/King KAP 140", cost:6000, retained:0.30, decay:0.05, floor:0.15, years:22, lpv:0, adsbOut:0, adsbIn:0, coupledAP:0, glass:0 },
  { id:"ap_century",   category:"Autopilot", item:"Century / other analog", cost:5000, retained:0.28, decay:0.05, floor:0.12, years:30, lpv:0, adsbOut:0, adsbIn:0, coupledAP:0, glass:0 },

  { id:"xpdr_gtx345",  category:"Transponder/ADS-B", item:"Garmin GTX 345 (In/Out)", cost:6500, retained:0.45, decay:0.07, floor:0.20, years:4, lpv:0, adsbOut:1, adsbIn:1, coupledAP:0, glass:0 },
  { id:"xpdr_gtx335",  category:"Transponder/ADS-B", item:"Garmin GTX 335 (Out only)", cost:5000, retained:0.42, decay:0.07, floor:0.18, years:4, lpv:0, adsbOut:1, adsbIn:0, coupledAP:0, glass:0 },
  { id:"adsb_gdl82",   category:"Transponder/ADS-B", item:"Garmin GDL 82 (978 Out)", cost:3500, retained:0.38, decay:0.08, floor:0.15, years:4, lpv:0, adsbOut:1, adsbIn:0, coupledAP:0, glass:0 },
  { id:"adsb_gdl88",   category:"Transponder/ADS-B", item:"Garmin GDL 88 (978 In/Out)", cost:4500, retained:0.35, decay:0.08, floor:0.15, years:8, lpv:0, adsbOut:1, adsbIn:1, coupledAP:0, glass:0 },

  { id:"eng_edm900",   category:"Engine Monitor", item:"JPI EDM 900", cost:5500, retained:0.50, decay:0.06, floor:0.30, years:4, lpv:0, adsbOut:0, adsbIn:0, coupledAP:0, glass:0 },
  { id:"eng_cgr30p",   category:"Engine Monitor", item:"EI CGR-30P", cost:5000, retained:0.50, decay:0.06, floor:0.30, years:4, lpv:0, adsbOut:0, adsbIn:0, coupledAP:0, glass:0 },
  { id:"eng_mvp50",    category:"Engine Monitor", item:"EI MVP-50", cost:5000, retained:0.48, decay:0.06, floor:0.28, years:6, lpv:0, adsbOut:0, adsbIn:0, coupledAP:0, glass:0 },
  { id:"eng_edm830",   category:"Engine Monitor", item:"JPI EDM 830", cost:3500, retained:0.45, decay:0.07, floor:0.25, years:5, lpv:0, adsbOut:0, adsbIn:0, coupledAP:0, glass:0 },

  { id:"audio_gma345", category:"Audio Panel", item:"Garmin GMA 345", cost:3500, retained:0.40, decay:0.07, floor:0.20, years:4, lpv:0, adsbOut:0, adsbIn:0, coupledAP:0, glass:0 },
  { id:"audio_gma350", category:"Audio Panel", item:"Garmin GMA 350", cost:3500, retained:0.40, decay:0.07, floor:0.20, years:5, lpv:0, adsbOut:0, adsbIn:0, coupledAP:0, glass:0 },
  { id:"audio_pma450b",category:"Audio Panel", item:"PS Engineering PMA450B", cost:3500, retained:0.40, decay:0.07, floor:0.20, years:4, lpv:0, adsbOut:0, adsbIn:0, coupledAP:0, glass:0 },
  { id:"audio_pma8000",category:"Audio Panel", item:"PS Engineering PMA8000", cost:2500, retained:0.35, decay:0.07, floor:0.18, years:8, lpv:0, adsbOut:0, adsbIn:0, coupledAP:0, glass:0 },
  { id:"audio_gma340", category:"Audio Panel", item:"Garmin GMA 340", cost:1500, retained:0.25, decay:0.06, floor:0.10, years:18, lpv:0, adsbOut:0, adsbIn:0, coupledAP:0, glass:0 },

  { id:"traffic_active", category:"Traffic", item:"Active traffic (GTS 800 / Skywatch)", cost:10000, retained:0.35, decay:0.08, floor:0.15, years:8, lpv:0, adsbOut:0, adsbIn:0, coupledAP:0, glass:0 },
];

const BY_ID = Object.fromEntries(AVIONICS.map(r => [r.id, r]));

export const CONFIG = {
  adsbPenalty: -7000,          // applied if NO ADS-B Out source is present (post-2020 mandate)
  bundleBonus: 2500,           // LPV navigator + coupled autopilot both present
  avionicsCapPct: 0.40,        // positive avionics value capped at this fraction of base airframe
  engine: { tbo: 2000, overhaulCost: 65000, reference: "midtime" }, // reference: "midtime" | "fresh" | "runout"
  tiers: { wholesale: 0.88, asking: 1.08 },  // multipliers on fair market value
};

function clamp(x, lo, hi){ return Math.max(lo, Math.min(hi, x)); }
function round(x){ return Math.round(x); }

// per-item dollar add, decayed for age
function itemAdd(row, qty, ageYears){
  const yrs = (ageYears == null ? row.years : ageYears);
  const factor = Math.max(row.floor, row.retained * Math.pow(1 - row.decay, yrs));
  return qty * row.cost * factor;
}

// normalize input: ["nav_gtn750xi", ...] OR [{id, qty?, years?}, ...]
function normalize(selected){
  return (selected || []).map(s => typeof s === "string" ? { id:s, qty:1 } : { qty:1, ...s });
}

export function avionicsValue(selected, config = CONFIG){
  const items = normalize(selected);
  const lineItems = [];
  let positiveSum = 0, hasOut = false, hasLPV = false, hasCoupled = false;

  for (const s of items){
    const row = BY_ID[s.id];
    if (!row) continue;
    const add = itemAdd(row, s.qty, s.years);
    lineItems.push({ id:row.id, item:row.item, qty:s.qty, add: round(add) });
    if (add > 0) positiveSum += add;
    if (row.adsbOut) hasOut = true;
    if (row.lpv) hasLPV = true;
    if (row.coupledAP) hasCoupled = true;
  }

  const bundle = (hasLPV && hasCoupled) ? config.bundleBonus : 0;
  if (bundle) { positiveSum += bundle; lineItems.push({ id:"bundle", item:"IFR capability bundle (LPV nav + coupled AP)", qty:1, add: bundle }); }

  const penalty = hasOut ? 0 : config.adsbPenalty;
  if (penalty) lineItems.push({ id:"gate_adsb_noncompliant", item:"ADS-B Out non-compliant (penalty)", qty:1, add: penalty });

  return { lineItems, positiveSum: round(positiveSum), penalty, bundle, adsbCompliant: hasOut };
}

// engine value adjustment vs the base airframe's assumed engine condition.
// reference="midtime": base assumes a mid-time engine; fresh adds up to +overhaulCost/2, run-out subtracts up to overhaulCost/2.
// reference="fresh":   base assumes a fresh engine; only penalizes as hours accrue (0 to -overhaulCost).
// reference="runout":  base assumes a run-out engine; fresh adds full overhaulCost.
export function engineAdjustment(engine = {}, ecfg = CONFIG.engine){
  const tbo = engine.tbo || ecfg.tbo;
  const overhaulCost = engine.overhaulCost || ecfg.overhaulCost;
  const reference = engine.reference || ecfg.reference;
  const perHour = overhaulCost / tbo;                 // shared with the true-fuel-cost app (engine reserve $/hr)
  if (engine.smoh == null) return { adj:0, perHour: round(perHour), remaining:null, note:"SMOH unknown — no engine adjustment" };

  const consumed = clamp(engine.smoh / tbo, 0, 1);
  let adj;
  if (reference === "fresh")      adj = -overhaulCost * consumed;
  else if (reference === "runout") adj = overhaulCost * (1 - consumed);
  else                             adj = overhaulCost * (0.5 - consumed);  // midtime

  const remaining = overhaulCost * Math.max(0, (tbo - engine.smoh) / tbo);
  return { adj: round(adj), perHour: round(perHour), remaining: round(remaining), reference };
}

// reusable by the true-fuel-cost app: engine reserve dollars per flight hour
export function engineReservePerHour(engine = {}, ecfg = CONFIG.engine){
  return round((engine.overhaulCost || ecfg.overhaulCost) / (engine.tbo || ecfg.tbo));
}

/**
 * Main entry. Returns fair market value + wholesale/asking tiers + a full
 * breakdown you can both display to the user and hand to Haiku to narrate.
 *
 * @param {Object} p
 * @param {number} p.baseAirframe   year/model-adjusted airframe value (from your base pricing layer)
 * @param {Array}  p.avionics       ["nav_gtn750xi", {id:"pfd_gi275", qty:2}, ...]
 * @param {Object} p.engine         { smoh, tbo?, overhaulCost?, reference? }
 * @param {Object} [p.config]       overrides for CONFIG
 */
export function valuate({ baseAirframe, avionics = [], engine = {}, config = {} }){
  const cfg = { ...CONFIG, ...config, engine: { ...CONFIG.engine, ...(config.engine||{}) }, tiers: { ...CONFIG.tiers, ...(config.tiers||{}) } };

  const av = avionicsValue(avionics, cfg);
  const cap = baseAirframe * cfg.avionicsCapPct;
  const cappedPositive = Math.min(av.positiveSum, cap);
  const capApplied = av.positiveSum > cap;
  const avionicsNet = round(cappedPositive + av.penalty);   // penalty (negative) is not capped

  const eng = engineAdjustment(engine, cfg.engine);

  const fmv = round(baseAirframe + avionicsNet + eng.adj);

  return {
    fairMarketValue: fmv,
    wholesale: round(fmv * cfg.tiers.wholesale),
    asking: round(fmv * cfg.tiers.asking),
    breakdown: {
      baseAirframe: round(baseAirframe),
      avionics: { items: av.lineItems, positiveSum: av.positiveSum, capApplied, applied: cappedPositive, penalty: av.penalty, net: avionicsNet, adsbCompliant: av.adsbCompliant },
      engine: eng,
    },
  };
}

/**
 * Build the message for Haiku to EXPLAIN the result. The number is already
 * decided — the model only writes prose. Send breakdown as JSON in the user turn.
 */
export function narrationPrompt(result){
  return {
    system: "You explain a small-aircraft valuation to an owner in 3-4 plain sentences. " +
            "You are given the final numbers and a line-item breakdown. NEVER invent, change, " +
            "round, or recompute any figure — quote only the numbers provided. Be concrete about " +
            "which avionics and engine condition drove the value.",
    user: "Explain this valuation:\n" + JSON.stringify(result, null, 2),
  };
}

// CommonJS fallback (Netlify functions etc.)
if (typeof module !== "undefined" && module.exports) {
  module.exports = { AVIONICS, CONFIG, avionicsValue, engineAdjustment, engineReservePerHour, valuate, narrationPrompt };
}