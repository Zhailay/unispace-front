import { useId, type InputHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from 'react'

const CONTROL =
  `w-full rounded-card border border-border bg-surface px-3 py-2 text-sm text-fg
   placeholder:text-muted focus:outline-2 focus:outline-offset-0 focus:outline-primary
   disabled:cursor-not-allowed disabled:opacity-60`

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function Input({ label, error, className = '', ...rest }: InputProps) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-fg">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${CONTROL} ${error ? 'border-danger' : ''} ${className}`}
        {...rest}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  children: ReactNode
}

export function Select({ label, className = '', children, ...rest }: SelectProps) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-fg">
        {label}
      </label>
      <select id={id} className={`${CONTROL} ${className}`} {...rest}>
        {children}
      </select>
    </div>
  )
}
