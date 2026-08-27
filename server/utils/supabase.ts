export type AuthUser = { id: string; email?: string }

function restHeaders(key: string) {
  return {
    'Content-Type': 'application/json',
    apikey: key,
    Authorization: `Bearer ${key}`,
  }
}

function creds() {
  const config = useRuntimeConfig()
  const url = config.supabaseUrl || config.public.supabaseUrl
  const key = config.supabaseAnonKey || config.public.supabaseAnonKey
  if (!url || !key) {
    throw createError({ statusCode: 500, statusMessage: 'Database not configured' })
  }
  return { url: String(url), key: String(key) }
}

function adminCreds() {
  const config = useRuntimeConfig()
  const url = config.supabaseUrl || config.public.supabaseUrl
  const key = config.supabaseServiceRoleKey
  if (!url || !key) {
    throw createError({ statusCode: 500, statusMessage: 'Database admin not configured' })
  }
  return { url: String(url), key: String(key) }
}

const SIGN_IN_REQUIRED = 'Sign in to get a valuation.'

/** Verify a Supabase access token via GoTrue. Rejects missing/invalid JWTs. */
export async function requireAuthUser(event: Parameters<typeof getHeader>[0]): Promise<AuthUser> {
  const header = getHeader(event, 'authorization') || ''
  const token = header.match(/^Bearer\s+(\S+)/i)?.[1]
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: SIGN_IN_REQUIRED })
  }

  const { url, key } = creds()
  try {
    const user = await $fetch<{ id?: string; email?: string }>(`${url}/auth/v1/user`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${token}`,
      },
    })
    if (!user?.id) {
      throw createError({ statusCode: 401, statusMessage: SIGN_IN_REQUIRED })
    }
    return { id: user.id, email: user.email }
  } catch {
    throw createError({ statusCode: 401, statusMessage: SIGN_IN_REQUIRED })
  }
}

export async function supabaseGet(path: string): Promise<unknown> {
  const { url, key } = creds()
  return await $fetch(`${url}/rest/v1/${path}`, {
    headers: restHeaders(key),
  })
}

export async function supabaseInsert(table: string, row: Record<string, unknown>): Promise<void> {
  const { url, key } = creds()
  await $fetch(`${url}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      ...restHeaders(key),
      Prefer: 'return=minimal',
    },
    body: row,
  })
}

export async function supabaseAdminGet(path: string): Promise<unknown> {
  const { url, key } = adminCreds()
  return await $fetch(`${url}/rest/v1/${path}`, {
    headers: restHeaders(key),
  })
}

export async function supabaseAdminInsert(table: string, row: Record<string, unknown>): Promise<void> {
  const { url, key } = adminCreds()
  await $fetch(`${url}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      ...restHeaders(key),
      Prefer: 'return=minimal',
    },
    body: row,
  })
}

export async function supabaseAdminRpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { url, key } = adminCreds()
  return await $fetch<T>(`${url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: restHeaders(key),
    body: args,
  })
}
