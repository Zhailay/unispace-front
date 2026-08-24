import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { sidebarToggled } from '@/features/ui/uiSlice'
import { useT } from '@/shared/i18n/useT'
import LangSwitcher from '@/shared/ui/LangSwitcher'
import LogoutButton from '@/features/auth/LogoutButton'
import SwitchRoleButton from '@/features/auth/SwitchRoleButton'
import Icon, { type IconName } from '@/shared/ui/Icon'

/**
 * Аналог views/layouts/staff.hbs. Активный пункт раньше подсвечивался
 * через activePage из контроллера — теперь это делает NavLink по URL.
 *
 * Пункты сгруппированы: плоский список из 17 ссылок нечитаем, а разделы
 * «Учебный процесс» и «Кадры» соответствуют тому, как устроена работа.
 */
interface NavItem {
  to: string
  end?: boolean
  labelKey: string
  icon: IconName
}

interface NavGroup {
  labelKey?: string
  items: NavItem[]
}

const NAV: NavGroup[] = [
  {
    items: [{ to: '/staff', end: true, labelKey: 'nav.dashboard', icon: 'dashboard' }],
  },
  {
    labelKey: 'nav.section_structure',
    items: [
      { to: '/staff/gruppa-op', labelKey: 'nav.gruppa_op', icon: 'layers' },
      { to: '/staff/specialties', labelKey: 'nav.specialties', icon: 'academic' },
      { to: '/staff/gruppa', labelKey: 'nav.gruppa', icon: 'grid' },
      { to: '/staff/students', labelKey: 'nav.ucheb_students', icon: 'users' },
    ],
  },
  {
    labelKey: 'nav.section_ucheb',
    items: [
      { to: '/staff/disciplina', labelKey: 'nav.disciplina', icon: 'book' },
      { to: '/staff/modul-name', labelKey: 'nav.modul_name', icon: 'layers' },
      { to: '/staff/obsh-name', labelKey: 'nav.obsh_name', icon: 'book' },
      { to: '/staff/kalendar', labelKey: 'nav.kalendar', icon: 'calendar' },
      { to: '/staff/plan', labelKey: 'nav.plan', icon: 'clipboard' },
      { to: '/staff/registraciya', labelKey: 'nav.registraciya', icon: 'clipboard' },
      { to: '/staff/jurnal', labelKey: 'nav.jurnal', icon: 'journal' },
      { to: '/staff/vneplanovoe', labelKey: 'nav.vneplanovoe', icon: 'calendar' },
      { to: '/staff/test-upload', labelKey: 'nav.test_upload', icon: 'upload' },
    ],
  },
  {
    labelKey: 'nav.section_kadr',
    items: [
      { to: '/staff/departments', labelKey: 'nav.departments', icon: 'building' },
      { to: '/staff/positions', labelKey: 'nav.positions', icon: 'briefcase' },
      { to: '/staff/employees', labelKey: 'nav.employees', icon: 'user' },
    ],
  },
]

const LINK_BASE =
  `group flex items-center gap-2.5 rounded-control px-2.5 py-2 text-sm transition-colors
   focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`

export default function StaffLayout() {
  const t = useT()
  const dispatch = useAppDispatch()
  const location = useLocation()
  const user = useAppSelector((s) => s.auth.user)
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen)

  // Заголовок текущего раздела — чтобы в шапке было видно, где ты.
  const current = NAV.flatMap((g) => g.items).find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
  )

  return (
    <div className="flex h-full bg-bg">
      {/* Подложка под сайдбаром на мобильных: перекрывает контент. */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => dispatch(sidebarToggled())}
          aria-hidden
        />
      )}

      <aside
        className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-border
          bg-surface transition-transform duration-200
          lg:static lg:translate-x-0 ${sidebarOpen ? 'lg:w-64' : 'lg:w-0 lg:overflow-hidden lg:border-r-0'}`}
      >
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <span className="flex size-7 items-center justify-center rounded-control bg-primary text-primary-fg">
            <Icon name="academic" className="size-4" />
          </span>
          <span className="text-base font-semibold tracking-tight">{t('common.app_name')}</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-2.5">
          {NAV.map((group, i) => (
            <div key={group.labelKey ?? i} className={i > 0 ? 'mt-5' : ''}>
              {group.labelKey && (
                <p className="px-2.5 pb-1.5 text-[0.6875rem] font-semibold tracking-wider text-subtle uppercase">
                  {t(group.labelKey)}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `${LINK_BASE} ${
                        isActive
                          ? 'bg-primary-soft font-medium text-primary'
                          : 'text-muted hover:bg-surface-2 hover:text-fg'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          name={item.icon}
                          className={`size-4 ${isActive ? 'text-primary' : 'text-subtle group-hover:text-fg'}`}
                        />
                        <span className="truncate">{t(item.labelKey)}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border
            bg-surface/90 px-4 backdrop-blur"
        >
          <button
            type="button"
            onClick={() => dispatch(sidebarToggled())}
            aria-label={t('common.toggle_menu')}
            aria-expanded={sidebarOpen}
            className="flex size-9 cursor-pointer items-center justify-center rounded-control
              text-muted transition-colors hover:bg-surface-2 hover:text-fg
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Icon name="menu" />
          </button>

          {current && (
            <span className="truncate text-sm font-medium">{t(current.labelKey)}</span>
          )}

          <div className="ml-auto flex items-center gap-2">
            <SwitchRoleButton />
            <LangSwitcher />
            <Link
              to="/staff/profile"
              className="flex items-center gap-2 rounded-control px-2 py-1.5 text-sm
                text-muted transition-colors hover:bg-surface-2 hover:text-fg
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <span
                className="flex size-7 shrink-0 items-center justify-center rounded-full
                  bg-primary-soft text-xs font-semibold text-primary"
                aria-hidden
              >
                {initials(user?.fullName)}
              </span>
              <span className="hidden max-w-40 truncate sm:inline">{user?.fullName}</span>
            </Link>
            <LogoutButton />
          </div>
        </header>

        {/* Контент во всю ширину: это плотная админка, а не текстовая
            страница — ограничение по ширине оставляло пустые поля и
            заставляло широкие таблицы журнала скроллиться раньше времени. */}
        <main className="min-w-0 flex-1 overflow-auto p-4 sm:p-5">
          <Outlet />
        </main>
      </div>
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
