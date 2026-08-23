import { NavLink, Outlet } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { useT } from '@/shared/i18n/useT'
import LangSwitcher from '@/shared/ui/LangSwitcher'
import LogoutButton from '@/features/auth/LogoutButton'

/** Аналог views/layouts/student.hbs. */
const NAV = [{ to: '/student', end: true, labelKey: 'nav.dashboard' }] as const

export default function StudentLayout() {
  const t = useT()
  const user = useAppSelector((s) => s.auth.user)

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-surface px-4">
        <span className="text-lg font-semibold">{t('common.app_name')}</span>

        <nav className="flex gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-card px-3 py-1.5 text-sm transition-colors ${
                  isActive ? 'bg-primary text-primary-fg' : 'text-fg hover:bg-bg'
                }`
              }
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        <span className="ml-auto text-sm text-muted">{user?.fullName}</span>
        <LangSwitcher />
        <LogoutButton />
      </header>

      <main className="min-w-0 flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
