export interface AvionicsItem {
  id: string
  label: string
  submitName: string
  qtyOptions?: string[]
  sizeOptions?: { value: string; label: string }[]
}

export interface AvionicsGroup {
  title: string
  gap?: string
  items: AvionicsItem[]
}

const QTY2 = ['1', '2']
const QTY3 = ['1', '2', '3']
const TXI_SIZES = [
  { value: '10.6"', label: '10.6"' },
  { value: '7"', label: '7"' },
  { value: 'dual 10.6"', label: '2x 10.6"' },
  { value: 'dual 7"', label: '2x 7"' },
  { value: '10.6" + 7"', label: '10.6"+7"' },
]

export const PROMINENT_AVIONICS: AvionicsItem[] = [
  { id: 'av-ac', label: 'Air conditioning (factory or STC)', submitName: 'Air conditioning' },
  { id: 'av-aoa', label: 'Angle of attack (AOA) indicator', submitName: 'Angle of attack (AOA)' },
  { id: 'av-fiki', label: 'FIKI certified (flight into known ice)', submitName: 'FIKI certified (known ice)' },
  { id: 'av-known-ice', label: 'Known ice / inadvertent TKS (not FIKI — exit icing only)', submitName: 'Known ice / inadvertent TKS' },
  { id: 'av-taws', label: 'TAWS (terrain awareness / avoidance)', submitName: 'TAWS (terrain awareness)' },
  { id: 'av-svt', label: 'Synthetic vision (add-on or retrofit — skip if G1000 NXi / Perspective+)', submitName: 'Synthetic vision' },
  { id: 'av-oshkosh', label: 'Oshkosh / EAA AirVenture award winner (strongest on experimental/homebuilt)', submitName: 'Oshkosh / EAA award winner' },
]

export const AVIONICS_COLUMNS: AvionicsGroup[][] = [
  [
    {
      title: 'BASIC / LEGACY',
      items: [
        { id: 'av-sixpack', label: 'Standard six pack (steam gauges)', submitName: 'Standard six pack' },
        { id: 'av-nav1', label: 'Single NAV/COM', submitName: 'Single NAV/COM' },
        { id: 'av-nav2', label: 'Dual NAV/COM', submitName: 'Dual NAV/COM' },
        { id: 'av-adf', label: 'ADF', submitName: 'ADF' },
        { id: 'av-dme', label: 'DME', submitName: 'DME' },
        { id: 'av-kx155', label: 'King KX-155/165', submitName: 'King KX-155/165' },
      ],
    },
    {
      title: 'GARMIN',
      items: [
        { id: 'av-g5', label: 'G5 (single or dual)', submitName: 'Garmin G5', qtyOptions: QTY2 },
        { id: 'av-gi275', label: 'GI 275', submitName: 'Garmin GI 275', qtyOptions: QTY2 },
        { id: 'av-g500', label: 'G500', submitName: 'Garmin G500' },
        { id: 'av-g500txi', label: 'G500 TXi', submitName: 'Garmin G500 TXi', sizeOptions: TXI_SIZES },
        { id: 'av-g600txi', label: 'G600 TXi', submitName: 'Garmin G600 TXi', sizeOptions: TXI_SIZES },
        { id: 'av-g1000', label: 'G1000', submitName: 'Garmin G1000' },
        { id: 'av-g1000nxi', label: 'G1000 NXi', submitName: 'Garmin G1000 NXi' },
        { id: 'av-g3x', label: 'G3X Touch', submitName: 'Garmin G3X Touch' },
        { id: 'av-gns430', label: 'GNS 430(non WAAS)', submitName: 'GNS 430(non WAAS)', qtyOptions: QTY2 },
        { id: 'av-gns430w', label: 'GNS 430W (WAAS)', submitName: 'GNS 430W WAAS', qtyOptions: QTY2 },
        { id: 'av-gns530', label: 'GNS 530 (non-WAAS)', submitName: 'GNS 530 non-WAAS', qtyOptions: QTY2 },
        { id: 'av-gns530w', label: 'GNS 530W (WAAS)', submitName: 'GNS 530W WAAS', qtyOptions: QTY2 },
        { id: 'av-gns480', label: 'GNS 480 (WAAS)', submitName: 'GNS 480 WAAS' },
        { id: 'av-gtn650', label: 'GTN 650', submitName: 'GTN 650', qtyOptions: QTY2 },
        { id: 'av-gtn750', label: 'GTN 750', submitName: 'GTN 750', qtyOptions: QTY2 },
        { id: 'av-gtn650xi', label: 'GTN 650Xi', submitName: 'GTN 650Xi', qtyOptions: QTY2 },
        { id: 'av-gtn750xi', label: 'GTN 750Xi', submitName: 'GTN 750Xi', qtyOptions: QTY2 },
        { id: 'av-gps175', label: 'GPS 175', submitName: 'Garmin GPS 175' },
        { id: 'av-gnx375', label: 'GNX 375', submitName: 'Garmin GNX 375' },
        { id: 'av-gnc255', label: 'GNC 255 (NAV/COM)', submitName: 'Garmin GNC 255', qtyOptions: QTY2 },
        { id: 'av-gtr205', label: 'GTR 205 (COM radio)', submitName: 'Garmin GTR 205', qtyOptions: QTY2 },
        { id: 'av-gfc500', label: 'GFC 500 autopilot', submitName: 'Garmin GFC 500' },
        { id: 'av-gfc600', label: 'GFC 600 autopilot', submitName: 'Garmin GFC 600' },
        { id: 'av-gfc700', label: 'GFC 700 autopilot', submitName: 'Garmin GFC 700' },
        { id: 'av-autoland', label: 'Garmin Autoland (HALO/Safe Return/HomeSafe)', submitName: 'Garmin Autoland (emergency autoland)' },
        { id: 'av-gad43', label: 'GAD 43e autopilot adapter', submitName: 'Garmin GAD 43e' },
        { id: 'av-mx20', label: 'Garmin MX20 MFD', submitName: 'Garmin MX20 MFD' },
        { id: 'av-gmx200', label: 'Garmin GMX 200 MFD', submitName: 'Garmin GMX 200 MFD' },
        { id: 'av-gdl88', label: 'GDL 88 (ADS-B transceiver)', submitName: 'Garmin GDL 88' },
        { id: 'av-gma345', label: 'GMA 345 (Bluetooth) audio panel', submitName: 'GMA 345 audio' },
        { id: 'av-gma350', label: 'GMA 350/35c audio panel', submitName: 'Garmin GMA 350' },
        { id: 'av-gi275-standby', label: 'GI 275 standby instrument', submitName: 'Garmin GI 275 standby' },
        { id: 'av-gtx345', label: 'GTX 345 (ADS-B In/Out transponder)', submitName: 'GTX 345 ADS-B' },
        { id: 'av-radar-garmin', label: 'GWX 68/70/75/80 weather radar', submitName: 'Garmin GWX radar' },
        { id: 'av-garmin-eis', label: 'GI 275 EIS / TXi EIS engine monitor', submitName: 'Garmin EIS' },
      ],
    },
    {
      title: 'ASPEN AVIONICS',
      items: [
        { id: 'av-aspen-e5', label: 'Evolution E5', submitName: 'Aspen E5' },
        { id: 'av-aspen-pro', label: 'Evolution Pro 1000 MAX PFD', submitName: 'Aspen Pro 1000 MAX' },
        { id: 'av-aspen-mfd', label: 'Evolution MFD 500/1000', submitName: 'Aspen MFD 500/1000' },
        { id: 'av-aspen-2500', label: 'Evolution 2500 MAX (full panel)', submitName: 'Aspen 2500 MAX' },
      ],
    },
  ],
  [
    {
      title: 'AVIDYNE',
      items: [
        { id: 'av-avr9', label: 'Entegra PFD/MFD (R9)', submitName: 'Avidyne Entegra R9' },
        { id: 'av-ex500', label: 'EX500/600 MFD', submitName: 'Avidyne EX500/600' },
        { id: 'av-ifd440', label: 'IFD 440', submitName: 'Avidyne IFD 440' },
        { id: 'av-ifd550', label: 'IFD 540/550', submitName: 'Avidyne IFD 540/550' },
        { id: 'av-dfc90', label: 'DFC 90 autopilot', submitName: 'Avidyne DFC 90' },
        { id: 'av-dfc100', label: 'DFC 100 autopilot', submitName: 'Avidyne DFC 100' },
      ],
    },
    {
      title: 'DYNON',
      items: [
        { id: 'av-dynon-hdx', label: 'SkyView HDX (PFD/MFD)', submitName: 'Dynon SkyView HDX' },
        { id: 'av-dynon-se', label: 'SkyView SE', submitName: 'Dynon SkyView SE' },
        { id: 'av-dynon-d10', label: 'D10A/D100 (EFIS)', submitName: 'Dynon D10A/D100' },
        { id: 'av-dynon-ap', label: 'SV-AP autopilot', submitName: 'Dynon SV-AP autopilot' },
        { id: 'av-dynon-gps', label: 'SkyView GPS navigator', submitName: 'Dynon SkyView GPS' },
      ],
    },
    {
      title: 'OTHER AUTOPILOTS',
      items: [
        { id: 'av-stec55', label: 'S-TEC 55X', submitName: 'S-TEC 55X' },
        { id: 'av-stec65', label: 'S-TEC (other)', submitName: 'S-TEC (other)' },
        { id: 'av-stec3100', label: 'S-TEC 3100', submitName: 'S-TEC 3100' },
        { id: 'av-kfc200', label: 'King KFC 150/200/225', submitName: 'King KFC 150/200/225' },
        { id: 'av-trutrak', label: 'TruTrak / BendixKing', submitName: 'TruTrak/BendixKing' },
      ],
    },
    {
      title: 'PS ENGINEERING',
      items: [
        { id: 'av-pma8000', label: 'PMA 8000 series audio panel', submitName: 'PS Engineering PMA 8000' },
        { id: 'av-pma450', label: 'PMA 450B audio panel', submitName: 'PS Engineering PMA 450B' },
        { id: 'av-pma6000', label: 'PMA 6000/7000 audio panel', submitName: 'PS Engineering PMA 6000/7000' },
      ],
    },
    {
      title: 'L3 / L3HARRIS',
      items: [
        { id: 'av-esi500', label: 'ESI-500 electronic standby', submitName: 'L3 ESI-500' },
      ],
    },
    {
      title: 'UAVIONIX (mostly experimental)',
      items: [
        { id: 'av-uav-skybeacon', label: 'skyBeacon (wingtip ADS-B Out)', submitName: 'uAvionix skyBeacon' },
        { id: 'av-uav-tailbeacon', label: 'tailBeacon (tail ADS-B Out)', submitName: 'uAvionix tailBeacon' },
        { id: 'av-uav-echouat', label: 'echoUAT (ADS-B In/Out)', submitName: 'uAvionix echoUAT' },
        { id: 'av-uav-tailbeaconx', label: 'tailBeaconX (transponder + ADS-B)', submitName: 'uAvionix tailBeaconX' },
        { id: 'av-uav-avipro', label: 'AV-30-C / AV-30-E (EFIS)', submitName: 'uAvionix AV-30' },
        { id: 'av-uav-avlink', label: 'AvLink (Wi-Fi gateway)', submitName: 'uAvionix AvLink' },
        { id: 'av-uav-beaconx', label: 'BeaconX series', submitName: 'uAvionix BeaconX' },
      ],
    },
    {
      title: 'TRANSPONDER / ADS-B',
      items: [
        { id: 'av-adsb', label: 'ADS-B Out (other)', submitName: 'ADS-B Out' },
        { id: 'av-tcas', label: 'Traffic (TAS/TCAD)', submitName: 'Traffic TAS' },
        { id: 'av-wx500', label: 'Stormscope WX-500', submitName: 'Stormscope' },
        { id: 'av-radar-bk', label: 'BendixKing RDR 2000/2100 radar', submitName: 'BendixKing RDR 2000/2100 radar' },
        { id: 'av-radar-legacy', label: 'Legacy radar (RDS-81/82, other)', submitName: 'Legacy radar' },
      ],
    },
    {
      title: 'ENGINE MONITORS',
      gap: '5px',
      items: [
        { id: 'av-ei-cgr', label: 'EI CGR-30P', submitName: 'EI CGR-30P', qtyOptions: QTY3 },
        { id: 'av-ei-other', label: 'EI (other)', submitName: 'EI monitor', qtyOptions: QTY3 },
        { id: 'av-jpi', label: 'JPI EDM 700/800/900', submitName: 'JPI EDM', qtyOptions: QTY3 },
      ],
    },
    {
      title: 'OTHER',
      items: [
        { id: 'av-wx', label: 'XM/SiriusXM weather', submitName: 'XM weather' },
      ],
    },
    {
      title: 'UPGRADES & MODIFICATIONS',
      items: [
        { id: 'av-stc', label: 'Engine STC / conversion', submitName: 'Engine STC' },
        { id: 'av-3blade', label: '3-blade prop upgrade', submitName: '3-blade prop' },
        { id: 'av-cies', label: 'CiES fuel senders', submitName: 'CiES senders' },
        { id: 'av-led', label: 'LED lighting upgrade', submitName: 'LED lighting' },
        { id: 'av-annual', label: 'Fresh annual inspection', submitName: 'Fresh annual' },
        { id: 'av-oxy', label: 'Built-in oxygen system', submitName: 'Oxygen system' },
      ],
    },
  ],
]

export const ALL_AVIONICS_ITEMS: AvionicsItem[] = [
  ...PROMINENT_AVIONICS,
  ...AVIONICS_COLUMNS.flatMap((col) => col.flatMap((g) => g.items)),
]

export const AV_SUBMIT_NAMES: Record<string, string> = Object.fromEntries(
  ALL_AVIONICS_ITEMS.map((item) => [item.id, item.submitName]),
)

export const AV_PARSE_MAP: Record<string, string> = {
  'GTX345': 'av-gtx345', 'GTX 345': 'av-gtx345', 'ADS-B': 'av-adsb',
  'GFC500': 'av-gfc500', 'GFC 500': 'av-gfc500', 'GFC600': 'av-gfc600', 'GFC 600': 'av-gfc600', 'GFC700': 'av-gfc700', 'GFC 700': 'av-gfc700',
  'G1000': 'av-g1000', 'G1000 NXi': 'av-g1000nxi', 'G500': 'av-g500', 'G500 TXi': 'av-g500txi', 'G600 TXi': 'av-g600txi',
  'G3X': 'av-g3x', 'G5': 'av-g5', 'GI 275': 'av-gi275', 'GI275': 'av-gi275',
  'GTN650': 'av-gtn650', 'GTN 650': 'av-gtn650', 'GTN750': 'av-gtn750', 'GTN 750': 'av-gtn750',
  'GTN650Xi': 'av-gtn650xi', 'GTN 650Xi': 'av-gtn650xi', 'GTN750Xi': 'av-gtn750xi', 'GTN 750Xi': 'av-gtn750xi',
  'GNS430': 'av-gns430', 'GNS 430': 'av-gns430', 'GNS430W': 'av-gns430w', 'GNS 430W': 'av-gns430w',
  'GNS530': 'av-gns530', 'GNS 530': 'av-gns530', 'GNS530W': 'av-gns530w', 'GNS 530W': 'av-gns530w',
  'GNS480': 'av-gns480', 'GNS 480': 'av-gns480', 'GPS175': 'av-gps175', 'GNX375': 'av-gnx375',
  'GMA345': 'av-gma345', 'GDL88': 'av-gdl88', 'GDL 88': 'av-gdl88',
  'KFC200': 'av-kfc200', 'KFC 200': 'av-kfc200', 'KFC150': 'av-kfc200', 'KFC 150': 'av-kfc200',
  'STEC55': 'av-stec55', 'S-TEC 55X': 'av-stec55', 'STEC3100': 'av-stec3100', 'S-TEC 3100': 'av-stec3100',
  'DFC90': 'av-dfc90', 'DFC 90': 'av-dfc90', 'DFC100': 'av-dfc100', 'DFC 100': 'av-dfc100',
  'IFD440': 'av-ifd440', 'IFD 440': 'av-ifd440', 'IFD550': 'av-ifd550', 'IFD 550': 'av-ifd550',
  'Entegra': 'av-avr9', 'PMA8000': 'av-pma8000', 'PMA 8000': 'av-pma8000', 'PS Engineering': 'av-pma8000', 'MX20': 'av-mx20', 'MX 20': 'av-mx20', 'GMX200': 'av-gmx200', 'GMX 200': 'av-gmx200', 'Stormscope': 'av-wx500', 'WX500': 'av-wx500', 'WX1000': 'av-wx500',
  'Autoland': 'av-autoland', 'HALO': 'av-autoland', 'Safe Return': 'av-autoland',
  'Radar': 'av-radar-legacy', 'GWX': 'av-radar-garmin', 'RDR': 'av-radar-bk',
  'JPI': 'av-jpi', 'EDM': 'av-jpi', 'CGR': 'av-ei-cgr', 'Insight': 'av-ei-other',
  'SkyView HDX': 'av-dynon-hdx', 'SkyView SE': 'av-dynon-se', 'Dynon': 'av-dynon-hdx', 'STEC 65': 'av-stec65', 'STEC65': 'av-stec65', 'S-TEC 65': 'av-stec65', 'STEC 60': 'av-stec65', 'S-TEC 60': 'av-stec65', 'STEC 50': 'av-stec65', 'S-TEC 50': 'av-stec65', 'STEC 40': 'av-stec65', 'S-TEC 40': 'av-stec65', 'STEC 30': 'av-stec65', 'S-TEC 30': 'av-stec65', 'Skywatch': 'av-tcas', 'TCAS': 'av-tcas', 'TAS': 'av-tcas', 'TAWS': 'av-taws', 'terrain awareness': 'av-taws', 'terrain avoidance': 'av-taws', 'AOA': 'av-aoa', 'angle of attack': 'av-aoa', 'Alpha Systems': 'av-aoa', 'FIKI': 'av-fiki', 'flight into known ice': 'av-fiki', 'TKS FIKI': 'av-fiki', 'inadvertent': 'av-known-ice', 'inadvertent ice': 'av-known-ice', 'known ice': 'av-known-ice', 'TKS inadvertent': 'av-known-ice', 'deice': 'av-known-ice', 'anti-ice': 'av-known-ice', 'ice protection': 'av-known-ice', 'Oshkosh': 'av-oshkosh', 'AirVenture': 'av-oshkosh', 'EAA award': 'av-oshkosh', 'Grand Champion': 'av-oshkosh', 'Gold Lindy': 'av-oshkosh', 'synthetic vision': 'av-svt', 'SVT': 'av-svt', 'air conditioning': 'av-ac', 'A/C': 'av-ac', 'air cond': 'av-ac', 'PiperAire': 'av-ac', 'EDM 830': 'av-jpi', 'EDM 760': 'av-jpi', 'EDM 900': 'av-jpi', 'EDM830': 'av-jpi', 'WX 500': 'av-wx500', 'BFG': 'av-wx500', 'Flight Stream': 'av-adsb', 'CNX 80': 'av-gns430w', 'CNX80': 'av-gns430w', 'GNS 480': 'av-gns480', 'speed brakes': 'av-stc', 'IO-550': 'av-stc', '3-blade': 'av-3blade', '3 blade': 'av-3blade', 'LED': 'av-led', 'CiES': 'av-cies', 'tip tank': 'av-stc',
}

export function collectAvionics(
  checked: Record<string, boolean>,
  qty: Record<string, string>,
  size: Record<string, string>,
) {
  const avs: string[] = []
  for (const [id, nm] of Object.entries(AV_SUBMIT_NAMES)) {
    if (!checked[id]) continue
    const sv = size[id]
    if (sv) {
      if (sv.indexOf('dual') === 0) {
        const oneSize = sv.replace('dual ', '')
        avs.push(nm + ' ' + oneSize)
        avs.push(nm + ' ' + oneSize)
      } else if (sv.indexOf('+') >= 0) {
        const parts = sv.split('+')
        avs.push(nm + ' ' + parts[0].trim())
        avs.push(nm + ' ' + parts[1].trim())
      } else {
        avs.push(nm + ' ' + sv)
      }
      continue
    }
    let q = qty[id] ? parseInt(qty[id], 10) : 1
    if (!(q >= 1)) q = 1
    for (let i = 0; i < q; i++) avs.push(nm)
  }
  return avs
}
