import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { brokerContactFromHref, isNewAccount, KEY_EVENTS } from './analytics.ts'

const NOW = Date.parse('2026-10-08T15:00:00.000Z')

describe('KEY_EVENTS', () => {
  it('uses the GA4 recommended name for a new account', () => {
    assert.equal(KEY_EVENTS.accountCreated, 'sign_up')
  })
})

describe('isNewAccount', () => {
  it('treats a just-confirmed user as a new account', () => {
    assert.equal(isNewAccount({
      email_confirmed_at: '2026-10-08T15:00:00.000Z',
      last_sign_in_at: '2026-10-08T15:00:01.000Z',
    }, NOW), true)
  })

  it('treats a missing last sign-in on a fresh confirmation as a new account', () => {
    assert.equal(isNewAccount({
      confirmed_at: '2026-10-08T14:59:30.000Z',
    }, NOW), true)
  })

  it('does not treat a later sign-in as account creation', () => {
    assert.equal(isNewAccount({
      email_confirmed_at: '2026-09-01T12:00:00.000Z',
      last_sign_in_at: '2026-10-08T15:00:00.000Z',
    }, NOW), false)
  })

  it('does not treat a same-second re-login days later as account creation', () => {
    assert.equal(isNewAccount({
      email_confirmed_at: '2026-09-01T12:00:00.000Z',
      last_sign_in_at: '2026-09-01T12:00:01.000Z',
    }, NOW), false)
  })

  it('rejects a user with no confirmation timestamp', () => {
    assert.equal(isNewAccount({ last_sign_in_at: '2026-10-08T15:00:00.000Z' }, NOW), false)
  })
})

describe('brokerContactFromHref', () => {
  it('classifies partner and listing-marketplace links', () => {
    assert.deepEqual(
      brokerContactFromHref('https://airlogbooks.com/?utm_source=smallplanevalue&utm_medium=partner'),
      { link_domain: 'airlogbooks.com', partner: 'AirLogbooks' },
    )
    assert.deepEqual(
      brokerContactFromHref('https://www.trade-a-plane.com'),
      { link_domain: 'trade-a-plane.com', partner: 'Trade-A-Plane' },
    )
    assert.deepEqual(
      brokerContactFromHref('https://controller.com/listings/123'),
      { link_domain: 'controller.com', partner: 'Controller' },
    )
    assert.deepEqual(
      brokerContactFromHref('https://www.barnstormers.com/'),
      { link_domain: 'barnstormers.com', partner: 'Barnstormers' },
    )
  })

  it('ignores registry, social, and on-site links', () => {
    assert.equal(brokerContactFromHref('https://registry.faa.gov/aircraftinquiry/Search/NNumberInquiry?nNumberTxt=172SP'), null)
    assert.equal(brokerContactFromHref('https://www.facebook.com/sharer/sharer.php'), null)
    assert.equal(brokerContactFromHref('https://www.bonanza.org'), null)
    assert.equal(brokerContactFromHref('#app'), null)
    assert.equal(brokerContactFromHref('mailto:sales@example.com'), null)
    assert.equal(brokerContactFromHref('https://trade-a-plane.com.evil.test'), null)
  })
})
