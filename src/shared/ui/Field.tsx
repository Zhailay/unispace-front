import {
  useId,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from 'react'
import Icon from './Icon'

// h-10 совпадает с высотой Button size="md" — только так поля и кнопки
// в одной строке тулбара выравниваются по нижнему краю без подгонок.
const CONTROL =
  `w-full rounded-control border border-border bg-surface px-3 text-sm text-fg transition-colors
   placeholder:text-subtle hover:border-border-strong
   focus:border-primary focus:outline-2 focus:outline-offset-0 focus:outline-primary
   disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-60`

const CONTROL_H = 'h-10'
const LABEL = 'text-sm font-medium text-fg'
const INVALID = 'border-danger focus:border-danger focus:outline-danger'

function FieldShell({
  id,
  label,
  error,
  hint,
  required,
  children,
}: {
  id: string
  label?: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className={LABEL}>
          {label}
          {required && (
            <span className="ml-0.5 text-danger" aria-hidden>
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} className="flex items-center gap-1 text-xs text-danger">
          <Icon name="alert" className="size-3.5" />
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted">{hint}</p>
      )}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className = '', required, ...rest }: InputProps) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required}>
      <input
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${CONTROL} ${CONTROL_H} ${error ? INVALID : ''} ${className}`}
        {...rest}
      />
    </FieldShell>
  )
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  children: ReactNode
}

export function Select({
  label,
  error,
  hint,
  className = '',
  required,
  children,
  ...rest
}: SelectProps) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required}>
      <select
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${CONTROL} ${CONTROL_H} cursor-pointer ${error ? INVALID : ''} ${className}`}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export function Textarea({ label, error, hint, className = '', required, ...rest }: TextareaProps) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required}>
      <textarea
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${CONTROL} py-2 ${error ? INVALID : ''} ${className}`}
        {...rest}
      />
    </FieldShell>
  )
}

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Доступное имя — поле обычно без видимой подписи. */
  label: string
  /** Отдельная подпись для кнопки очистки: скринридер иначе читает две «Поиск» подряд. */
  clearLabel?: string
  onClear?: () => void
}

/** Поле поиска с иконкой и кнопкой очистки — основной способ фильтрации справочников. */
export function SearchInput({
  label,
  clearLabel,
  onClear,
  className = '',
  value,
  ...rest
}: SearchInputProps) {
  const id = useId()
  const hasValue = Boolean(value)

  return (
    <div className="relative min-w-0">
      <Icon
        name="search"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle"
      />
      <input
        id={id}
        type="search"
        value={value}
        aria-label={label}
        className={`${CONTROL} ${CONTROL_H} pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden ${className}`}
        {...rest}
      />
      {hasValue && onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label={clearLabel ?? label}
          className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 cursor-pointer
            items-center justify-center rounded text-subtle transition-colors
            hover:bg-surface-2 hover:text-fg
            focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Icon name="close" className="size-3.5" />
        </button>
      )}
    </div>
  )
}
