export interface ShowcasePlane {
  img: string
  alt: string
  name: string
  tag: string
  icon: string
  desc: string
  ask: string
}

export const PLANES: ShowcasePlane[] = [
  {
    img: '/planes/Cessna.jpg',
    alt: 'Cessna 206',
    name: 'Cessna 206',
    tag: 'Piston Single',
    icon: 'ti-star',
    desc: '6-seat utility single · commonly used for utility and bush operations',
    ask: '$120k-$260k',
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
    alt: 'Cirrus SR22 at sunset',
    name: 'Cirrus SR22',
    tag: 'Piston Single',
    icon: 'ti-star',
    desc: '4-seat certified · IO-550 · CAPS parachute system',
    ask: '$180k-$450k',
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
    img: "/planes/van-rv10.jpg",
    alt: "Van's RV-10",
    name: "Van's RV-10",
    tag: 'Experimental',
    icon: 'ti-tool',
    desc: '4-seat kit-built · IO-540 · cruise ~175 kt',
    ask: '$120k-$300k',
  },
]

const ROTATE_DAYS = 3

export function showcasePeriod(pinned?: string) {
  if (pinned !== undefined && pinned !== '') {
    const n = Number(pinned)
    if (Number.isFinite(n)) return n
  }
  return Math.floor(Date.now() / (ROTATE_DAYS * 86_400_000))
}

export function pickPlanes(count = 3, period = showcasePeriod()): ShowcasePlane[] {
  const offset = period % PLANES.length
  return Array.from({ length: Math.min(count, PLANES.length) }, (_, i) => {
    return PLANES[(offset + i) % PLANES.length]
  })
}
