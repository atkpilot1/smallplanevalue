export const TRUSTED_PARTNERS = [
  {
    name: 'AirLogbooks',
    url: 'https://airlogbooks.com/?utm_source=smallplanevalue&utm_medium=partner&utm_campaign=valuation_loader',
    tip: 'Did you know? Digitized logbooks often make aircraft easier to sell — and protect value.',
  },
]

export function partnerTipHtml(p: { name: string; url: string; tip: string } | undefined) {
  if (!p) return ''
  return p.tip + ' Trusted partner: <a href="' + p.url + '" target="_blank" rel="noopener noreferrer">' + p.name + '</a>.'
}
