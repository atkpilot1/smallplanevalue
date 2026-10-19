import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  composeCosmetics,
  matchInteriorCondition,
  matchPaintCondition,
  migrateLegacyCosmetics,
} from './conditionOptions.ts'

test('a new interior does not force the paint grade', () => {
  assert.equal(matchPaintCondition('original 1971 paint, faded'), 'Original (age-typical wear)')
  assert.equal(matchInteriorCondition('brand new leather interior'), 'Brand new / recently redone')
})

test('legacy combined cosmetics still load', () => {
  assert.deepEqual(migrateLegacyCosmetics('Fresh paint & new interior'), {
    paint: 'New / recently painted',
    interior: 'Brand new / recently redone',
  })
  assert.deepEqual(migrateLegacyCosmetics('Good condition'), {
    paint: 'Good',
    interior: 'Good',
  })
})

test('compose keeps both grades', () => {
  assert.equal(
    composeCosmetics('Fair — faded, chips, or hangar rash', 'Brand new / recently redone'),
    'Paint/exterior: Fair — faded, chips, or hangar rash; Interior: Brand new / recently redone',
  )
})
