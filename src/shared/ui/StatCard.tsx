import Icon, { type IconName } from './Icon'

type Tone = 'primary' | 'success' | 'warning' | 'info'

const TONES: Record<Tone, string> = {
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-accent-fg',
  info: 'bg-info-soft text-info',
}

interface Props {
  label: string
  value: number | string
  icon: IconName
  tone?: Tone
  suffix?: string
}

/** Плитка KPI для дашбордов: число крупно, подпись мелко, иконка для узнавания. */
export default function StatCard({ label, value, icon, tone = 'primary', suffix }: Props) {
  return (
    <div className="rounded-card border border-border bg-surface p-4 shadow-card">
      <div className="flex items-center gap-3">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-control ${TONES[tone]}`}>
          <Icon name={icon} className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="tabular text-2xl leading-tight font-semibold">
            {value}
            {suffix && <span className="text-base text-muted">{suffix}</span>}
          </p>
          <p className="truncate text-sm text-muted">{label}</p>
        </div>
      </div>
    </div>
  )
}
