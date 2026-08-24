import { Link } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { useT } from '@/shared/i18n/useT'
import Icon from '@/shared/ui/Icon'

export default function NotFoundPage() {
  const t = useT()
  const user = useAppSelector((s) => s.auth.user)
  const home = user ? (user.type === 'sotrudnik' ? '/staff' : '/student') : '/login'

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-surface-2 text-subtle">
        <Icon name="alert" className="size-6" />
      </span>
      <p className="tabular text-4xl font-semibold text-muted">404</p>
      <p className="text-fg">{t('error.not_found')}</p>
      <Link
        to={home}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-control bg-primary px-4 py-2
          text-sm font-medium text-primary-fg transition-colors hover:bg-primary-hover
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Icon name="chevronLeft" className="size-4" />
        {t('common.home')}
      </Link>
    </div>
  )
}
