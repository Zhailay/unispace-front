import { useEffect, useRef, type ReactNode } from 'react'
import Icon from './Icon'

type Size = 'sm' | 'md' | 'lg' | 'xl'

const SIZES: Record<Size, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
}

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  /** Прижатая к низу панель действий — не уезжает при прокрутке тела. */
  footer?: ReactNode
  size?: Size
  className?: string
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className = '',
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement
      if (!dialog.open) dialog.showModal()
    } else if (dialog.open) {
      dialog.close()
      previousFocusRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    function handleCancel(e: Event) {
      e.preventDefault()
      onClose()
    }

    // Клик по самому <dialog> — это клик по подложке: содержимое лежит
    // во вложенном div, поэтому e.target === dialog только вне окна.
    function handleClick(e: MouseEvent) {
      if (e.target === dialog) onClose()
    }

    dialog.addEventListener('cancel', handleCancel)
    dialog.addEventListener('click', handleClick)
    return () => {
      dialog.removeEventListener('cancel', handleCancel)
      dialog.removeEventListener('click', handleClick)
    }
  }, [onClose])

  return (
    <dialog
      ref={dialogRef}
      // m-auto обязателен: preflight Tailwind сбрасывает margin в 0 и тем
      // самым убивает штатное центрирование dialog:modal из UA-стилей —
      // без него окно прилипает к левому верхнему углу.
      className={`m-auto w-[calc(100%-2rem)] ${SIZES[size]} rounded-card border border-border
        bg-surface p-0 text-fg shadow-overlay
        backdrop:bg-black/50 backdrop:backdrop-blur-[2px] ${className}`}
    >
      <div className="flex max-h-[85vh] flex-col">
        {title && (
          <div className="flex shrink-0 items-start gap-4 border-b border-border px-5 py-4">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-semibold">{title}</h2>
              {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mt-1 -mr-1 flex size-8 cursor-pointer items-center justify-center
                rounded-control text-muted transition-colors hover:bg-surface-2 hover:text-fg
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Icon name="close" />
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {footer && (
          <div className="shrink-0 border-t border-border bg-surface-2 px-5 py-3">{footer}</div>
        )}
      </div>
    </dialog>
  )
}
