import type { ReactNode } from 'react'
import Skeleton from './Skeleton'
import EmptyState from './EmptyState'
import { useT } from '@/shared/i18n/useT'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
  align?: 'left' | 'right' | 'center'
}

interface Props<T> {
  columns: Column<T>[]
  data: T[]
  rowKey: (row: T) => string
  loading?: boolean
  /** Заголовок пустого состояния. */
  emptyMessage?: string
  /** Подсказка, что делать дальше, когда данных нет. */
  emptyDescription?: string
  emptyAction?: ReactNode
  /** Строк-заглушек на первую загрузку — под ожидаемый размер страницы. */
  skeletonRows?: number
}

const ALIGN = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const

export default function DataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  emptyMessage,
  emptyDescription,
  emptyAction,
  skeletonRows = 5,
}: Props<T>) {
  const t = useT()
  const isInitialLoad = loading && data.length === 0
  const isEmpty = !loading && data.length === 0

  if (isEmpty) {
    return (
      <div className="rounded-card border border-border bg-surface shadow-card">
        <EmptyState
          title={emptyMessage ?? t('common.no_data')}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    )
  }

  return (
    <div className="table-scroll rounded-card border border-border bg-surface shadow-card">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-surface-2 text-muted">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`border-b border-border px-4 py-2.5 text-xs font-semibold
                  tracking-wide uppercase whitespace-nowrap
                  ${ALIGN[col.align ?? 'left']} ${col.className ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isInitialLoad &&
            Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={`sk-${i}`} className="border-b border-border last:border-0">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <Skeleton className="h-4 w-full max-w-40" />
                  </td>
                ))}
              </tr>
            ))}

          {data.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-b border-border transition-colors last:border-0 hover:bg-surface-2"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-2.5 align-middle
                    ${ALIGN[col.align ?? 'left']} ${col.className ?? ''}`}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
