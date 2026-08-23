import Button from './Button'
import { useT } from '@/shared/i18n/useT'

interface Props {
  page: number
  lastPage: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, lastPage, onPageChange }: Props) {
  const t = useT()

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
      >
        {t('specialties.prev_page')}
      </Button>
      <span className="text-sm text-muted">
        {t('specialties.page')} {page + 1} {t('specialties.of')} {lastPage + 1}
      </span>
      <Button
        variant="secondary"
        disabled={page >= lastPage}
        onClick={() => onPageChange(page + 1)}
      >
        {t('specialties.next_page')}
      </Button>
    </div>
  )
}
