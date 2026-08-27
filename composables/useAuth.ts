import type { User } from '@supabase/supabase-js'
import { STATE } from '~/utils/stateKeys'

export type AuthDialog = 'login' | 'account' | null
export type AuthStep = 'email' | 'code'

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function useAuth() {
  const user = useState<User | null>(STATE.authUser, () => null)
  const ready = useState(STATE.authReady, () => false)
  const dialog = useState<AuthDialog>(STATE.authDialog, () => null)
  const error = useState(STATE.authError, () => '')
  const sending = useState(STATE.authSending, () => false)
  const verifying = useState(STATE.authVerifying, () => false)
  const otpEmail = useState(STATE.authOtpEmail, () => '')
  const step = useState<AuthStep>(STATE.authStep, () => 'email')
  const valuationCount = useState(STATE.authValuationCount, () => 0)

  async function init() {
    if (!import.meta.client || ready.value) return
    const sb = useSupabase()
    const { data } = await sb.auth.getSession()
    user.value = data.session?.user ?? null
    sb.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
    })
    ready.value = true
  }

  function openLogin() {
    error.value = ''
    step.value = 'email'
    otpEmail.value = ''
    dialog.value = 'login'
  }

  function openAccount() {
    error.value = ''
    dialog.value = 'account'
    void refreshValuationCount()
  }

  async function refreshValuationCount() {
    if (!import.meta.client || !user.value) {
      valuationCount.value = 0
      return
    }
    const { data } = await useSupabase()
      .from('profiles')
      .select('valuation_count')
      .eq('user_id', user.value.id)
      .maybeSingle()
    valuationCount.value = data?.valuation_count ?? 0
  }

  function closeDialog() {
    dialog.value = null
    error.value = ''
    step.value = 'email'
    otpEmail.value = ''
  }

  async function sendCode(email: string) {
    const trimmed = email.trim().toLowerCase()
    if (!isEmail(trimmed)) {
      error.value = 'Enter a valid email address.'
      return false
    }
    sending.value = true
    error.value = ''
    try {
      const { error: err } = await useSupabase().auth.signInWithOtp({
        email: trimmed,
        options: { shouldCreateUser: true },
      })
      if (err) {
        error.value = err.message
        return false
      }
      otpEmail.value = trimmed
      step.value = 'code'
      return true
    } catch (e) {
      error.value = (e as Error).message || 'Could not send code.'
      return false
    } finally {
      sending.value = false
    }
  }

  async function verifyCode(token: string) {
    const code = token.replace(/\s/g, '')
    if (!/^\d{6}$/.test(code)) {
      error.value = 'Enter the 6-digit code from your email.'
      return false
    }
    verifying.value = true
    error.value = ''
    try {
      const { error: err } = await useSupabase().auth.verifyOtp({
        email: otpEmail.value,
        token: code,
        type: 'email',
      })
      if (err) {
        error.value = err.message
        return false
      }
      closeDialog()
      return true
    } catch (e) {
      error.value = (e as Error).message || 'Could not verify code.'
      return false
    } finally {
      verifying.value = false
    }
  }

  function backToEmail() {
    step.value = 'email'
    error.value = ''
  }

  async function getAccessToken() {
    if (!import.meta.client) return null
    const { data } = await useSupabase().auth.getSession()
    return data.session?.access_token ?? null
  }

  async function signOut() {
    await useSupabase().auth.signOut()
    valuationCount.value = 0
    closeDialog()
  }

  return {
    user,
    ready,
    dialog,
    error,
    sending,
    verifying,
    otpEmail,
    step,
    valuationCount,
    init,
    openLogin,
    openAccount,
    closeDialog,
    sendCode,
    verifyCode,
    backToEmail,
    getAccessToken,
    signOut,
  }
}
