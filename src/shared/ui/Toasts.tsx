import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { toastDismissed } from '@/features/ui/uiSlice'
import Icon, { type IconName } from './Icon'

const TONES: Record<'success' | 'error', { bar: string; icon: string; name: IconName }> = {
  success: { bar: 'bg-success', icon: 'text-success', name: 'check' },
  error: { bar: 'bg-danger', icon: 'text-danger', name: 'alert' },
}

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
    <div
      className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => {
        const tone = TONES[t.type]
        return (
          <div
            key={t.id}
            className="pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-card
              border border-border bg-surface py-3 pr-3 pl-4 text-sm shadow-overlay"
          >
            <span className={`absolute left-0 h-full w-1 ${tone.bar}`} aria-hidden />
            <Icon name={tone.name} className={`mt-0.5 size-4 ${tone.icon}`} />
            <span className="min-w-0 flex-1 break-words text-fg">{t.message}</span>
            <button
              type="button"
              onClick={() => dispatch(toastDismissed(t.id))}
              className="-mt-0.5 flex size-6 shrink-0 cursor-pointer items-center justify-center
                rounded text-muted transition-colors hover:bg-surface-2 hover:text-fg
                focus-visible:outline-2 focus-visible:outline-primary"
              aria-label="Закрыть"
            >
              <Icon name="close" className="size-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
