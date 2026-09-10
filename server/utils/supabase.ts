function creds() {
  const config = useRuntimeConfig()
  const url = config.supabaseUrl
  const key = config.supabaseAnonKey
  if (!url || !key) {
    throw createError({ statusCode: 500, statusMessage: 'Database not configured' })
  }
  return { url, key }
}

function adminCreds() {
  const config = useRuntimeConfig()
  const url = config.supabaseUrl
  const key = config.supabaseServiceRoleKey || config.supabaseAnonKey
  if (!url || !key) {
    throw createError({ statusCode: 500, statusMessage: 'Database not configured' })
  }
  if (!config.supabaseServiceRoleKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Credit ledger requires SUPABASE_SERVICE_ROLE_KEY',
    })
  }
  return { url, key }
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

export async function supabaseAdminGet(path: string): Promise<unknown> {
  const { url, key } = adminCreds()
  return await $fetch(`${url}/rest/v1/${path}`, {
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  })
}

export async function supabaseRpc<T = unknown>(
  fn: string,
  args: Record<string, unknown>,
): Promise<T> {
  const { url, key } = adminCreds()
  return await $fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: args,
  }) as T
}
