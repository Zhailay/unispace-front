import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { toastDismissed } from '@/features/ui/uiSlice'

const STYLES = {
  success: 'border-success text-success',
  error: 'border-danger text-danger',
} as const

/** Замена flash-сообщений из hbs: req.flash() -> dispatch(toastPushed(...)). */
export default function Toasts() {
  const toasts = useAppSelector((s) => s.ui.toasts)
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (toasts.length === 0) return
    const timers = toasts.map((t) => setTimeout(() => dispatch(toastDismissed(t.id)), 4000))
    return () => timers.forEach(clearTimeout)
  }, [toasts, dispatch])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 rounded-card border-l-4 bg-surface px-4 py-3 text-sm shadow-lg ${STYLES[t.type]}`}
        >
          <span className="text-fg">{t.message}</span>
          <button
            type="button"
            onClick={() => dispatch(toastDismissed(t.id))}
            className="ml-auto text-muted hover:text-fg"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
