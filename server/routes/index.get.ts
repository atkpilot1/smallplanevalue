// Pool of showcase aircraft. To add a plane: drop a JPG in public/planes/ and
// add an entry here (img is the public URL path, no base64 needed).
const PLANES = [
  {
    img: '/planes/Cessna.jpg',
    alt: 'Cessna 206',
    name: 'Cessna 206',
    tag: 'Piston Single',
    icon: 'ti-star',
    desc: '6-seat utility single · commonly used for utility and bush operations',
    ask: '$200k-$550k',
  },
  {
    img: '/planes/cessna-195.jpg',
    alt: 'Cessna 195',
    name: 'Cessna 195',
    tag: 'Vintage Classic',
    icon: 'ti-clock',
    desc: '5-seat businessliner · Jacobs R-755 radial · 1947-1954',
    ask: '$80k-$200k',
  },
  {
    img: '/planes/beech-staggerwing.jpg',
    alt: 'Beechcraft Staggerwing',
    name: 'Beech Staggerwing',
    tag: 'Vintage / Warbird',
    icon: 'ti-clock',
    desc: '5-seat biplane · 1932-1948 · R-985 Wasp Jr.',
    ask: '$180k-$500k',
  },
  {
    img: '/planes/cirrus-sr22.jpg',
    alt: 'Cirrus SR22 GTS G5 Carbon in flight',
    name: 'Cirrus SR22',
    tag: 'Piston Single',
    icon: 'ti-star',
    desc: '4-seat certified · IO-550 · CAPS parachute system',
    ask: '$180k-$450k',
    // CC BY-SA 2.0 — keep this credit visible when the image is shown
    credit: 'Photo: Angelo Bufalino / Avstock.net — CC BY-SA 2.0 (Wikimedia Commons)',
    creditUrl: 'https://commons.wikimedia.org/wiki/File:N416DJ_Cirrus_SR22_GTS_G5_carbon_(37116662713).jpg',
  },
  {
    img: '/planes/beech-a36.jpg',
    alt: 'Beechcraft A36 Bonanza',
    name: 'Beech A36 Bonanza',
    tag: 'Piston Single',
    icon: 'ti-star',
    desc: '6-seat cabin-class · IO-550 · club seating',
    ask: '$250k-$550k',
  },
  {
    img: '/planes/van-rv7.jpg',
    alt: "Van's RV-7 experimental at a fly-in",
    name: "Van's RV-7",
    tag: 'Experimental',
    icon: 'ti-tool',
    desc: '2-seat kit-built · IO-360 · aerobatic capable',
    ask: '$150k-$320k',
    credit: 'Photo: John Schanlaub — CC BY-SA 4.0 (Wikimedia Commons)',
    creditUrl: 'https://commons.wikimedia.org/wiki/File:Experiment_plane.JPG',
  },
  {
    img: '/planes/van-rv8.jpg',
    alt: "Van's RV-8 tandem experimental in flight",
    name: "Van's RV-8",
    tag: 'Experimental',
    icon: 'ti-tool',
    desc: '2-seat tandem kit · IO-360 · ~190 kt cruise',
    ask: '$140k-$280k',
    credit: 'Photo: Bob Adams — CC BY-SA 2.0 (Wikimedia Commons)',
    creditUrl: 'https://commons.wikimedia.org/wiki/File:Vans_RV-8_ZU-LHD_(12275800574).jpg',
  },
  {
    img: '/planes/van-rv10.jpg',
    alt: "Van's RV-10",
    name: "Van's RV-10",
    tag: 'Experimental',
    icon: 'ti-tool',
    desc: '4-seat kit-built · IO-540 · cruise ~175 kt',
    ask: '$260k-$530k',
  },
  {
    img: '/planes/van-rv14.jpg',
    alt: "Van's RV-14 kit aircraft",
    name: "Van's RV-14",
    tag: 'Experimental',
    icon: 'ti-tool',
    desc: '2-seat side-by-side · IO-390 · modern kit design',
    ask: '$220k-$380k',
    credit: 'Photo: FlugKerl2 — CC BY-SA 3.0 (Wikimedia Commons)',
    creditUrl: 'https://commons.wikimedia.org/wiki/File:VansRV-14.jpg',
  },
  {
    img: '/planes/carbon-cub-ex.jpg',
    alt: 'CubCrafters Carbon Cub EX experimental',
    name: 'Carbon Cub EX',
    tag: 'Experimental',
    icon: 'ti-tool',
    desc: 'STOL kit-built · CC340 · backcountry performer',
    ask: '$180k-$350k',
    credit: 'Photo: FlugKerl2 — CC BY-SA 3.0 (Wikimedia Commons)',
    creditUrl: 'https://commons.wikimedia.org/wiki/File:CubCrafters-CarbonCub-EX-SS.jpg',
  },
]

// Rotate the showcase every few days: a deterministic set of 3 planes chosen by
// the current date, so the lineup changes ~every 3 days (same for all visitors).
const ROTATE_DAYS = 3

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function pickPlanes(count = 3) {
  const period = Math.floor(Date.now() / (ROTATE_DAYS * 86_400_000))
  const offset = period % PLANES.length
  return Array.from({ length: Math.min(count, PLANES.length) }, (_, i) => {
    return PLANES[(offset + i) % PLANES.length]
  })
}

function renderCards(): string {
  return pickPlanes(3)
    .map((p) => {
      const credit =
        'credit' in p && p.credit
          ? `<div class="aircraft-credit">${
              'creditUrl' in p && p.creditUrl
                ? `<a href="${escapeHtml(p.creditUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(p.credit)}</a>`
                : escapeHtml(p.credit)
            }</div>`
          : ''
      return `<div class="aircraft-card">
<img src="${p.img}" alt="${escapeHtml(p.alt)}" loading="lazy">
<div class="aircraft-card-overlay">
<div class="aircraft-tag"><i class="ti ${p.icon}" style="font-size:11px"></i> ${escapeHtml(p.tag)}</div>
<div class="aircraft-name">${escapeHtml(p.name)}</div>
<div class="aircraft-desc">${escapeHtml(p.desc)}</div>
${credit}
</div>
<div class="aircraft-val-badge">Typical ask: <span>${escapeHtml(p.ask)}</span></div>
</div>`
    })
    .join('\n')
}

export default defineEventHandler(async (event) => {
  const raw = (await useStorage('assets:server').getItem('page.html')) as string
  const html = raw.replace('<!--SHOWCASE_CARDS-->', renderCards())
  setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  return html
})
