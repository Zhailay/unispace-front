import { useId } from 'react'
import Spinner from './Spinner'

// h-10 — та же высота, что у Field и Button size="md": иначе селекты
// каскада не совпадают по высоте с остальными контролами на странице.
const CONTROL =
  `h-10 w-full cursor-pointer rounded-card border border-border bg-surface px-3 text-sm text-fg
   placeholder:text-muted focus:outline-2 focus:outline-offset-0 focus:outline-primary
   disabled:cursor-not-allowed disabled:opacity-60`

export interface CascadeOption {
  value: string
  label: string
}

export interface CascadeLevel {
  name: string
  label: string
  options: CascadeOption[]
  loading?: boolean
  placeholder?: string
}

interface Props {
  levels: CascadeLevel[]
  values: Record<string, string>
  onChange: (name: string, value: string) => void
}

/**
 * CascadeSelect renders a series of linked dropdowns where each subsequent
 * dropdown is disabled until the previous one has a selection.
 *
 * Example: semester -> discipline -> group -> week
 * Each level unlocks after the previous is selected.
 */
export default function CascadeSelect({ levels, values, onChange }: Props) {
  const baseId = useId()

  return (
    <div className="flex flex-wrap gap-4">
      {levels.map((level, index) => {
        const prevLevel = index > 0 ? levels[index - 1] : null
        const isDisabled = prevLevel ? !values[prevLevel.name] : false
        const currentValue = values[level.name] ?? ''
        const id = `${baseId}-${level.name}`

        return (
          <div key={level.name} className="flex min-w-48 flex-col gap-1.5">
            <label htmlFor={id} className="text-sm font-medium text-fg">
              {level.label}
              {level.loading && <Spinner className="ml-2 inline-block size-3" />}
            </label>
            <select
              id={id}
              value={currentValue}
              disabled={isDisabled || level.loading}
              onChange={(e) => {
                onChange(level.name, e.target.value)
                // Clear all subsequent levels when a level changes
                for (let i = index + 1; i < levels.length; i++) {
                  onChange(levels[i].name, '')
                }
              }}
              className={CONTROL}
            >
              <option value="">{level.placeholder ?? `-- ${level.label} --`}</option>
              {level.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )
      })}
    </div>
  )
}
