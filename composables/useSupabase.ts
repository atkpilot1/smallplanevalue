import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { AUTH_STORAGE_KEY } from '~/utils/authStorage'

let client: SupabaseClient | null = null

export function useSupabase() {
  if (client) return client
  const config = useRuntimeConfig()
  const url = String(config.public.supabaseUrl || '')
  const key = String(config.public.supabaseAnonKey || '')
  if (!url || !key) {
    throw new Error('Supabase is not configured')
  }
    client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // OTP uses verifyOtp. Also accept #access_token= from the email link.
        detectSessionInUrl: true,
        storageKey: AUTH_STORAGE_KEY,
      },
    })
  return client
}
