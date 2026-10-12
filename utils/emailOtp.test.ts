import assert from 'node:assert/strict'
import { test } from 'node:test'
import { emailOtpDigits, signInCodeError } from './emailOtp.ts'

test('keeps digits while the code is still being typed', () => {
  assert.equal(emailOtpDigits('12'), '12')
  assert.equal(emailOtpDigits('1234567'), '123456')
})

test('pulls the code out of the sign-in email', () => {
  const email = [
    'Your sign-in code',
    '',
    'Enter this code in SmallPlaneValue to sign in:',
    '',
    '121911',
    '',
    'This code expires in one hour. If you did not request it, you can ignore this email.',
  ].join('\n')
  assert.equal(emailOtpDigits(email), '121911')
})

test('joins a code split by spaces', () => {
  assert.equal(emailOtpDigits('121 911'), '121911')
})

test('explains a used or expired code', () => {
  assert.equal(
    signInCodeError('Token has expired or is invalid'),
    'That code did not work. Send a new code, then enter the 6 digits from the newest email.',
  )
  assert.equal(signInCodeError('Email rate limit exceeded'), 'Email rate limit exceeded')
})
