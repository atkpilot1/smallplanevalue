import { STATE } from '~/utils/stateKeys'

export const TOAST_DURATION_MS = 10_000

export type ToastVariant = 'success' | 'info'

export type ToastItem = {
  id: number
  message: string
  variant: ToastVariant
}

let nextId = 0
const timers = new Map<number, ReturnType<typeof setTimeout>>()

export function useToast() {
  const toasts = useState<ToastItem[]>(STATE.toasts, () => [])

  function dismiss(id: number) {
    const timer = timers.get(id)
    if (timer) clearTimeout(timer)
    timers.delete(id)
    toasts.value = toasts.value.filter((item) => item.id !== id)
  }

  function toast(message: string, opts?: { variant?: ToastVariant; durationMs?: number }) {
    const id = ++nextId
    toasts.value = [...toasts.value, { id, message, variant: opts?.variant ?? 'info' }]
    const duration = opts?.durationMs ?? TOAST_DURATION_MS
    if (import.meta.client && duration > 0) {
      timers.set(
        id,
        setTimeout(() => dismiss(id), duration),
      )
    }
    return id
  }

  return { toasts, toast, dismiss }
}
