import { Link } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { useT } from '@/shared/i18n/useT'
import { useStaffDashboardQuery } from '@/features/dashboard/dashboardApi'
import type { TFunction } from '@/shared/i18n/i18nContext'
import Badge from '@/shared/ui/Badge'
import EmptyState from '@/shared/ui/EmptyState'
import Icon, { type IconName } from '@/shared/ui/Icon'
import Skeleton from '@/shared/ui/Skeleton'
import StatCard from '@/shared/ui/StatCard'

const QUICK_ACTIONS: { labelKey: string; href: string; icon: IconName }[] = [
  { labelKey: 'grade.add', href: '/staff/jurnal', icon: 'journal' },
  { labelKey: 'nav.registraciya', href: '/staff/registraciya', icon: 'clipboard' },
  { labelKey: 'nav.plan', href: '/staff/plan', icon: 'book' },
]

export default function StaffDashboardPage() {
  const t = useT()
  const user = useAppSelector((s) => s.auth.user)

  const { data: response, isLoading, error } = useStaffDashboardQuery()
  const dashData = response?.data

  if (isLoading) return <DashboardSkeleton />

  if (error) {
    return (
      <EmptyState icon="alert" title={t('error.loading_failed')} description={t('common.error_connection')} />
    )
  }

  const stats = dashData?.stats ?? { courses: 0, students: 0, assignments: 0, grades: 0 }
  const courses = dashData?.courses ?? []
  const pendingSubmissions = dashData?.pendingSubmissions ?? []
  const recentActivity = dashData?.recentActivity ?? []

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-card bg-primary p-6 text-primary-fg shadow-raised">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {t('dashboard.staff_welcome', { name: user?.fullName ?? '' })}
        </h1>
        <p className="mt-1 text-sm opacity-80">{t('common.welcome')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label={t('nav.courses')} value={stats.courses} icon="book" tone="primary" />
        <StatCard label={t('nav.students')} value={stats.students} icon="users" tone="success" />
        <StatCard label={t('nav.assignments')} value={stats.assignments} icon="clipboard" tone="warning" />
        <StatCard label={t('nav.grades')} value={stats.grades} icon="check" tone="info" />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title={t('dashboard.my_courses')} className="xl:col-span-2">
          {courses.length > 0 ? (
            <div className="table-scroll">
              <table className="w-full text-sm">
                <thead className="text-muted">
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 text-xs font-semibold tracking-wide uppercase">{t('course.code')}</th>
                    <th className="pb-2 text-xs font-semibold tracking-wide uppercase">{t('course.name')}</th>
                    <th className="hidden pb-2 text-center text-xs font-semibold tracking-wide uppercase md:table-cell">
                      {t('course.credits')}
                    </th>
                    <th className="hidden pb-2 text-xs font-semibold tracking-wide uppercase lg:table-cell">
                      {t('course.semester')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id} className="border-b border-border last:border-0">
                      <td className="py-2.5">
                        <Badge>{course.code}</Badge>
                      </td>
                      <td className="py-2.5 font-medium">{t(course.name_key)}</td>
                      <td className="tabular hidden py-2.5 text-center md:table-cell">{course.credits}</td>
                      <td className="tabular hidden py-2.5 text-muted lg:table-cell">
                        {course.academic_year} / {course.semester}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon="book" title={t('dashboard.no_courses')} />
          )}
        </Panel>

        <div className="flex flex-col gap-5">
          <Panel title={t('dashboard.quick_actions')}>
            <div className="flex flex-col gap-1.5">
              {QUICK_ACTIONS.map(({ labelKey, href, icon }) => (
                <Link
                  key={href}
                  to={href}
                  className="group flex items-center gap-3 rounded-control border border-border px-3 py-2.5
                    text-sm transition-colors hover:border-primary hover:bg-primary-soft
                    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <Icon name={icon} className="size-4 text-subtle group-hover:text-primary" />
                  <span className="min-w-0 flex-1 truncate font-medium">{t(labelKey)}</span>
                  <Icon name="chevronRight" className="size-4 text-subtle group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </Panel>

          <Panel
            title={t('dashboard.pending_submissions')}
            badge={<Badge tone="warning">{pendingSubmissions.length}</Badge>}
          >
            {pendingSubmissions.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {pendingSubmissions.map((submission) => (
                  <li key={submission.id} className="rounded-control border border-border p-3">
                    <p className="text-sm font-medium">{submission.student_name}</p>
                    <p className="text-sm text-muted">{t(submission.assignment_title_key)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon="check" title={t('dashboard.no_pending')} />
            )}
          </Panel>
        </div>
      </div>

      <Panel title={t('dashboard.recent_activity')}>
        {recentActivity.length > 0 ? (
          <ul className="flex flex-col">
            {recentActivity.map((activity, idx) => (
              <ActivityItem key={idx} activity={activity} t={t} />
            ))}
          </ul>
        ) : (
          <EmptyState title={t('dashboard.no_activity')} />
        )}
      </Panel>
    </div>
  )
}

function Panel({
  title,
  badge,
  className = '',
  children,
}: {
  title: string
  badge?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={`rounded-card border border-border bg-surface p-5 shadow-card ${className}`}>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-base font-semibold">{title}</h2>
        {badge}
      </div>
      {children}
    </section>
  )
}

const ACTIVITY_ICONS: Record<string, { icon: IconName; tone: string }> = {
  grade: { icon: 'check', tone: 'bg-success-soft text-success' },
  assignment: { icon: 'clipboard', tone: 'bg-warning-soft text-accent-fg' },
  submission: { icon: 'inbox', tone: 'bg-info-soft text-info' },
}

function ActivityItem({
  activity,
  t,
}: {
  activity: { type: string; message_key: string; created_at: string }
  t: TFunction
}) {
  const meta = ACTIVITY_ICONS[activity.type] ?? { icon: 'info' as IconName, tone: 'bg-surface-2 text-muted' }

  return (
    <li className="flex items-center gap-3 border-b border-border py-2.5 last:border-0 last:pb-0 first:pt-0">
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${meta.tone}`}>
        <Icon name={meta.icon} className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm">{t(activity.message_key)}</p>
        <p className="tabular text-xs text-muted">{new Date(activity.created_at).toLocaleString()}</p>
      </div>
    </li>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-24 w-full rounded-card" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[4.5rem] w-full rounded-card" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <Skeleton className="h-64 w-full rounded-card xl:col-span-2" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    </div>
  )
}
