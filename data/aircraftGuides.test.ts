import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  AIRCRAFT_GUIDES,
  guideBySlug,
  relatedGuides,
  valuationHref,
  valuationQueryFromSearch,
} from './aircraftGuides.ts'

describe('aircraft guides', () => {
  it('keeps unique slugs and resolvable related links', () => {
    const slugs = AIRCRAFT_GUIDES.map((guide) => guide.slug)
    assert.equal(new Set(slugs).size, slugs.length)
    for (const guide of AIRCRAFT_GUIDES) {
      assert.equal(guideBySlug(guide.slug)?.name, guide.name)
      assert.ok(relatedGuides(guide).length >= 1)
      for (const related of relatedGuides(guide)) {
        assert.notEqual(related.slug, guide.slug)
      }
    }
  })

  it('builds a valuation deep link and reads it back', () => {
    const href = valuationHref({ make: 'Beechcraft', model: 'Baron 58', engines: '2' })
    assert.equal(href, '/?tab=val&make=Beechcraft&model=Baron+58&engines=2')
    assert.deepEqual(valuationQueryFromSearch(href.slice(1)), {
      make: 'Beechcraft',
      model: 'Baron 58',
      year: '',
      engines: '2',
    })
  })

  it('ignores a search that does not name an airplane', () => {
    assert.equal(valuationQueryFromSearch('?tab=val'), null)
    assert.deepEqual(valuationQueryFromSearch('?make=Cirrus&model=SR22T&engines=9'), {
      make: 'Cirrus',
      model: 'SR22T',
      year: '',
      engines: '',
    })
  })
})
