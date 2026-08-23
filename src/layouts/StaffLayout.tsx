import { NavLink, Outlet } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { useT } from '@/shared/i18n/useT'
import LangSwitcher from '@/shared/ui/LangSwitcher'
import LogoutButton from '@/features/auth/LogoutButton'

/**
 * Аналог views/layouts/staff.hbs. Активный пункт раньше подсвечивался
 * через activePage из контроллера — теперь это делает NavLink по URL.
 */
const NAV = [
  { to: '/staff', end: true, labelKey: 'nav.dashboard' },
  { to: '/staff/gruppa-op', end: false, labelKey: 'nav.gruppa_op' },
  { to: '/staff/specialties', end: false, labelKey: 'nav.specialties' },
  { to: '/staff/gruppa', end: false, labelKey: 'nav.gruppa' },
  { to: '/staff/students', end: false, labelKey: 'nav.ucheb_students' },
  { to: '/staff/disciplina', end: false, labelKey: 'nav.disciplina' },
  { to: '/staff/modul-name', end: false, labelKey: 'nav.modul_name' },
  { to: '/staff/obsh-name', end: false, labelKey: 'nav.obsh_name' },
] as const

export default function StaffLayout() {
  const t = useT()
  const user = useAppSelector((s) => s.auth.user)
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen)

  return (
    <div className="flex h-full">
      <aside
        className={`${sidebarOpen ? 'w-60' : 'w-0'} shrink-0 overflow-hidden border-r border-border bg-surface transition-[width]`}
      >
        <div className="flex h-14 items-center px-4 text-lg font-semibold">{t('common.app_name')}</div>
        <nav className="flex flex-col gap-0.5 p-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-card px-3 py-2 text-sm transition-colors ${
                  isActive ? 'bg-primary text-primary-fg' : 'text-fg hover:bg-bg'
                }`
              }
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-surface px-4">
          <span className="ml-auto text-sm text-muted">{user?.fullName}</span>
          <LangSwitcher />
          <LogoutButton />
        </header>

        <main className="min-w-0 flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
