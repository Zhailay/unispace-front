import type { ButtonHTMLAttributes, ReactNode } from 'react'
import Spinner from './Spinner'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-primary-fg hover:bg-primary-hover',
  secondary: 'bg-surface text-fg border border-border hover:bg-bg',
  danger: 'bg-danger text-white hover:opacity-90',
  ghost: 'text-fg hover:bg-bg',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
  children: ReactNode
}

export default function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  children,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-card px-4 py-2 text-sm font-medium
        transition-colors disabled:cursor-not-allowed disabled:opacity-60
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
        ${VARIANTS[variant]} ${className}`}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  )
}
