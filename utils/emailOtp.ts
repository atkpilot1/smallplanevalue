/** Keep the 6-digit sign-in code from typing or from a pasted email. */
export function emailOtpDigits(value: string): string {
  const groups = value.match(/\d{6}/g)
  if (groups?.length) return groups[groups.length - 1]
  return value.replace(/\D/g, '').slice(0, 6)
}

export function signInCodeError(message: string): string {
  if (/expired or is invalid|otp_expired/i.test(message)) {
    return 'That code did not work. Send a new code, then enter the 6 digits from the newest email.'
  }
  return message
}
