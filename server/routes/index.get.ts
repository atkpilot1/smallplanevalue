// Pool of showcase aircraft. To add a plane: drop a JPG in public/planes/ and
// add an entry here (img is the public URL path, no base64 needed).
const PLANES = [
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
    alt: 'Cirrus SR22 at sunset',
    name: 'Cirrus SR22',
    tag: 'Piston Single',
    icon: 'ti-star',
    desc: '4-seat certified · IO-550 · CAPS parachute system',
    ask: '$180k-$450k',
  },
  {
    img: '/planes/cessna-172.jpg',
    alt: 'Cessna 172 Skyhawk',
    name: 'Cessna',
    tag: 'Piston Single',
    icon: 'ti-star',
    desc: '4-seat trainer · Lycoming O-360 · most-produced aircraft',
    ask: '$80k-$400k',
  },
  {
    img: '/planes/beech-a36.jpg',
    alt: 'Beechcraft A36 Bonanza',
    name: 'Beech A36 Bonanza',
    tag: 'Piston Single',
    icon: 'ti-star',
    desc: '6-seat cabin-class · IO-550 · club seating',
    ask: '$150k-$500k',
  },
  {
    img: '/planes/van-rv10.jpg',
    alt: "Van's RV-10",
    name: "Van's RV-10",
    tag: 'Experimental',
    icon: 'ti-tool',
    desc: '4-seat kit-built · IO-540 · cruise ~175 kt',
    ask: '$120k-$300k',
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
    .map(
      (p) => `<div class="aircraft-card">
<img src="${p.img}" alt="${escapeHtml(p.alt)}" loading="lazy">
<div class="aircraft-card-overlay">
<div class="aircraft-tag"><i class="ti ${p.icon}" style="font-size:11px"></i> ${escapeHtml(p.tag)}</div>
<div class="aircraft-name">${escapeHtml(p.name)}</div>
<div class="aircraft-desc">${escapeHtml(p.desc)}</div>
</div>
<div class="aircraft-val-badge">Typical ask: <span>${escapeHtml(p.ask)}</span></div>
</div>`,
    )
    .join('\n')
}

export default defineEventHandler(async (event) => {
  const raw = (await useStorage('assets:server').getItem('page.html')) as string
  const html = raw.replace('<!--SHOWCASE_CARDS-->', renderCards())
  setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  return html
})
