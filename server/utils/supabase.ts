function creds() {
  const config = useRuntimeConfig()
  const url = config.supabaseUrl
  const key = config.supabaseAnonKey
  if (!url || !key) {
    throw createError({ statusCode: 500, statusMessage: 'Database not configured' })
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
