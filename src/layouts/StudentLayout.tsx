import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { useT } from '@/shared/i18n/useT'
import LangSwitcher from '@/shared/ui/LangSwitcher'
import LogoutButton from '@/features/auth/LogoutButton'
import SwitchRoleButton from '@/features/auth/SwitchRoleButton'
import Icon, { type IconName } from '@/shared/ui/Icon'

/** Аналог views/layouts/student.hbs — у студента разделов мало, меню сверху. */
const NAV: { to: string; end?: boolean; labelKey: string; icon: IconName }[] = [
  { to: '/student', end: true, labelKey: 'nav.dashboard', icon: 'dashboard' },
  { to: '/student/profile', labelKey: 'nav.profile', icon: 'user' },
]

export default function StudentLayout() {
  const t = useT()
  const user = useAppSelector((s) => s.auth.user)

  return (
    <div className="flex h-full flex-col bg-bg">
      <header
        className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-4 border-b border-border
          bg-surface/90 px-4 backdrop-blur"
      >
        <span className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-control bg-primary text-primary-fg">
            <Icon name="academic" className="size-4" />
          </span>
          <span className="hidden text-base font-semibold tracking-tight sm:inline">
            {t('common.app_name')}
          </span>
        </span>

        <nav className="flex gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-control px-3 py-1.5 text-sm transition-colors
                 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                   isActive
                     ? 'bg-primary-soft font-medium text-primary'
                     : 'text-muted hover:bg-surface-2 hover:text-fg'
                 }`
              }
            >
              <Icon name={item.icon} className="size-4" />
              <span className="hidden sm:inline">{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <SwitchRoleButton />
          <LangSwitcher />
          <Link
            to="/student/profile"
            className="flex items-center gap-2 rounded-control px-2 py-1.5 text-sm text-muted
              transition-colors hover:bg-surface-2 hover:text-fg
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-full
                bg-primary-soft text-xs font-semibold text-primary"
              aria-hidden
            >
              {initials(user?.fullName)}
            </span>
            <span className="hidden max-w-40 truncate md:inline">{user?.fullName}</span>
          </Link>
          <LogoutButton />
        </div>
      </header>

      {/* Во всю ширину — как и в кабинете сотрудника, см. StaffLayout. */}
      <main className="min-w-0 flex-1 overflow-auto p-4 sm:p-5">
        <Outlet />
      </main>
    </div>
  )
}

/** «Алибеков Асан» -> «АА». Аватарки в системе нет, инициалы её заменяют. */
function initials(fullName?: string): string {
  if (!fullName) return '—'
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
