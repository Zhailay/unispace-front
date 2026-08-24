import type { ReactNode } from 'react'
import Icon, { type IconName } from './Icon'

interface Props {
  /** Что произошло — «ничего не найдено», а не просто пустота. */
  title: string
  /** Что с этим делать дальше. */
  description?: string
  icon?: IconName
  action?: ReactNode
}

/**
 * Пустой экран не должен быть просто белым пятном: пользователю нужно
 * понять, это «данных ещё нет» или «фильтр ничего не нашёл», и что нажать.
 */
export default function EmptyState({ title, description, icon = 'inbox', action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-surface-2 text-subtle">
        <Icon name={icon} className="size-5" />
      </div>
      <p className="text-sm font-medium text-fg">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
