export async function apiPost<T = Record<string, unknown>>(
  path: string,
  body: unknown,
  opts?: { accessToken?: string | null },
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (opts?.accessToken) {
    headers.Authorization = `Bearer ${opts.accessToken}`
  }
  const r = await fetch(path, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  const data = await r.json().catch(() => ({})) as Record<string, unknown> & {
    statusMessage?: string
    message?: string
    data?: { code?: string }
  }
  if (!r.ok) {
    const err = new Error((data && (data.statusMessage || data.message)) || 'Request failed - try again') as Error & {
      status?: number
      code?: string
      payload?: unknown
    }
    err.status = r.status
    err.code = (data && data.data && data.data.code) || (data && data.statusMessage) || ''
    err.payload = data
    throw err
  }
  return data as T
}
