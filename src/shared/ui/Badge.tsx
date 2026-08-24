import type { ReactNode } from 'react'

type Tone = 'neutral' | 'primary' | 'success' | 'danger' | 'warning' | 'info'

const TONES: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-muted border-border',
  primary: 'bg-primary-soft text-primary border-transparent',
  success: 'bg-success-soft text-success border-transparent',
  danger: 'bg-danger-soft text-danger border-transparent',
  warning: 'bg-warning-soft text-accent-fg border-transparent',
  info: 'bg-info-soft text-info border-transparent',
}

interface Props {
  tone?: Tone
  children: ReactNode
  className?: string
}

export default function Badge({ tone = 'neutral', children, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium
        whitespace-nowrap ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
