import type { ReactNode } from 'react'
import Badge from './Badge'
import Spinner from './Spinner'

interface Props {
  title: string
  /** Короткое пояснение под заголовком — что это за раздел. */
  description?: string
  /** Счётчик записей рядом с заголовком. */
  count?: number
  /** Идёт фоновая загрузка — показываем спиннер, не подменяя контент. */
  busy?: boolean
  /** Кнопки основных действий раздела. */
  actions?: ReactNode
}

/**
 * Единая шапка раздела. Все справочники выглядят одинаково: заголовок
 * слева, действия справа — не нужно вспоминать вёрстку на каждой странице.
 */
export default function PageHeader({ title, description, count, busy, actions }: Props) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <h1 className="truncate text-xl font-semibold tracking-tight">{title}</h1>
          {count !== undefined && <Badge>{count}</Badge>}
          {busy && <Spinner className="size-4 text-muted" />}
        </div>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>

      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}
