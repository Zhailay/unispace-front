import type { ButtonHTMLAttributes, ReactNode } from 'react'
import Spinner from './Spinner'
import Icon, { type IconName } from './Icon'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'subtle'
type Size = 'sm' | 'md' | 'icon'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-primary-fg hover:bg-primary-hover shadow-card',
  secondary: 'bg-surface text-fg border border-border hover:bg-surface-2 hover:border-border-strong',
  danger: 'bg-danger text-danger-fg hover:bg-danger-hover shadow-card',
  ghost: 'text-muted hover:bg-surface-2 hover:text-fg',
  subtle: 'bg-surface-2 text-fg hover:bg-border',
}

// Фиксированная высота, а не только padding: иначе кнопки рядом с полями
// ввода и друг с другом разъезжаются по вертикали из-за длины текста.
const SIZES: Record<Size, string> = {
  sm: 'h-8 gap-1.5 px-2.5 text-xs',
  md: 'h-10 gap-2 px-4 text-sm',
  icon: 'size-9 justify-center',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: IconName
  children?: ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  className = '',
  children,
  ...rest
}: Props) {
  const iconSize = size === 'sm' ? 'size-3.5' : 'size-4'

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap
        rounded-control font-medium transition-colors duration-150
        disabled:cursor-not-allowed disabled:opacity-55
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
        ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
    >
      {loading ? (
        <Spinner className={iconSize} />
      ) : (
        icon && <Icon name={icon} className={iconSize} />
      )}
      {children}
    </button>
  )
}
