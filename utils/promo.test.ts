import assert from 'node:assert/strict'
import test from 'node:test'
import { matchPromo, normalizePromoCode, promoSessionId } from './promo.ts'

test('normalizePromoCode ignores case, spaces, and hyphens', () => {
  assert.equal(normalizePromoCode(' tradeshow '), 'TRADESHOW')
  assert.equal(normalizePromoCode('Trade-Show'), 'TRADESHOW')
  assert.equal(normalizePromoCode('trade show'), 'TRADESHOW')
  assert.equal(normalizePromoCode(''), '')
})

test('matchPromo accepts the tradeshow code and rejects anything else', () => {
  assert.deepEqual(matchPromo('tradeshow'), { code: 'TRADESHOW', credits: 25 })
  assert.deepEqual(matchPromo(' TRADE-SHOW '), { code: 'TRADESHOW', credits: 25 })
  assert.equal(matchPromo(''), null)
  assert.equal(matchPromo('FREE'), null)
  assert.equal(matchPromo('TRADESHOW1'), null)
})

test('promoSessionId is stable per account', () => {
  const userId = '11111111-1111-1111-1111-111111111111'
  assert.equal(promoSessionId('TRADESHOW', userId), `promo:TRADESHOW:${userId}`)
})
