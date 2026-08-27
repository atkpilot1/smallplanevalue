function creds() {
  const config = useRuntimeConfig()
  const url = config.supabaseUrl || config.public.supabaseUrl
  const key = config.supabaseAnonKey || config.public.supabaseAnonKey
  if (!url || !key) {
    throw createError({ statusCode: 500, statusMessage: 'Database not configured' })
  }
  return { url: String(url), key: String(key) }
}

const SIGN_IN_REQUIRED = 'Sign in to get a valuation.'

/** Verify a Supabase access token via GoTrue. Rejects missing/invalid JWTs. */
export async function requireAuthUser(event: Parameters<typeof getHeader>[0]) {
  const header = getHeader(event, 'authorization') || ''
  const token = header.match(/^Bearer\s+(\S+)/i)?.[1]
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: SIGN_IN_REQUIRED })
  }

  const { url, key } = creds()
  try {
    const user = await $fetch<{ id?: string }>(`${url}/auth/v1/user`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${token}`,
      },
    })
    if (!user?.id) {
      throw createError({ statusCode: 401, statusMessage: SIGN_IN_REQUIRED })
    }
    return user
  } catch {
    throw createError({ statusCode: 401, statusMessage: SIGN_IN_REQUIRED })
  }
}

export async function supabaseGet(path: string): Promise<unknown> {
  const { url, key } = creds()
  return await $fetch(`${url}/rest/v1/${path}`, {
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  })
}

export async function supabaseInsert(table: string, row: Record<string, unknown>): Promise<void> {
  const { url, key } = creds()
  await $fetch(`${url}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'return=minimal',
    },
    body: row,
  })
}
