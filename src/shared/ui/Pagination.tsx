import Button from './Button'
import { useT } from '@/shared/i18n/useT'

interface Props {
  page: number
  lastPage: number
  onPageChange: (page: number) => void
  /** Всего записей — показываем диапазон «21–30 из 148». */
  total?: number
  pageSize?: number
}

export default function Pagination({ page, lastPage, onPageChange, total, pageSize }: Props) {
  const t = useT()

  // Одна страница — листать нечего, полоса кнопок только шумит.
  if (lastPage <= 0) return null

  const range =
    total !== undefined && pageSize !== undefined
      ? `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, total)} ${t('common.of')} ${total}`
      : `${t('common.page')} ${page + 1} ${t('common.of')} ${lastPage + 1}`

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3" aria-label={t('common.page')}>
      <span className="tabular text-sm text-muted">{range}</span>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          icon="chevronLeft"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          {t('common.prev_page')}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={page >= lastPage}
          onClick={() => onPageChange(page + 1)}
        >
          {t('common.next_page')}
        </Button>
      </div>
    </nav>
  )
}
