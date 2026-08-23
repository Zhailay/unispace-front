import { Link } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { useT } from '@/shared/i18n/useT'

export default function NotFoundPage() {
  const t = useT()
  const user = useAppSelector((s) => s.auth.user)
  const home = user ? (user.type === 'sotrudnik' ? '/staff' : '/student') : '/login'

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <p className="text-5xl font-semibold text-muted">404</p>
      <p className="text-fg">{t('error.not_found')}</p>
      <Link to={home} className="text-primary underline">
        {t('common.home')}
      </Link>
    </div>
  )
}
