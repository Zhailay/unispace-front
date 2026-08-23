import { useAppSelector } from '@/app/hooks'
import { useT } from '@/shared/i18n/useT'

export default function StaffDashboardPage() {
  const t = useT()
  const user = useAppSelector((s) => s.auth.user)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{t('nav.dashboard')}</h1>
      <p className="text-muted">
        {t('common.welcome')}, {user?.fullName}
      </p>
    </div>
  )
}
