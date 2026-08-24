import { useAppSelector } from '@/app/hooks'
import { useT } from '@/shared/i18n/useT'
import { useStudentDashboardQuery } from '@/features/dashboard/dashboardApi'
import type { TFunction } from '@/shared/i18n/i18nContext'
import Badge from '@/shared/ui/Badge'
import EmptyState from '@/shared/ui/EmptyState'
import Skeleton from '@/shared/ui/Skeleton'
import StatCard from '@/shared/ui/StatCard'

export default function StudentDashboardPage() {
  const t = useT()
  const user = useAppSelector((s) => s.auth.user)

  const { data: response, isLoading, error } = useStudentDashboardQuery()
  const dashData = response?.data

  if (isLoading) return <DashboardSkeleton />

  if (error) {
    return (
      <EmptyState icon="alert" title={t('error.loading_failed')} description={t('common.error_connection')} />
    )
  }

  const courses = dashData?.courses ?? []
  const grades = dashData?.grades ?? []
  const assignments = dashData?.assignments ?? []
  const attendance = dashData?.attendance ?? 0
  const today = dashData?.today
    ? new Date(dashData.today).toLocaleDateString()
    : new Date().toLocaleDateString()

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-card bg-primary p-6 text-primary-fg shadow-raised">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {t('dashboard.student_welcome', { name: user?.fullName ?? '' })}
        </h1>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm opacity-90">
          <span className="tabular rounded bg-white/20 px-2 py-0.5 font-medium">{user?.id}</span>
          <span>
            {t('dashboard.today_is')} {today}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label={t('dashboard.my_courses')} value={courses.length} icon="book" tone="primary" />
        <StatCard label={t('dashboard.recent_grades')} value={grades.length} icon="check" tone="success" />
        <StatCard
          label={t('dashboard.upcoming_assignments')}
          value={assignments.length}
          icon="clipboard"
          tone="warning"
        />
        <StatCard
          label={t('dashboard.attendance')}
          value={attendance}
          suffix="%"
          icon="calendar"
          tone="info"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title={t('dashboard.my_courses')} className="xl:col-span-2">
          {courses.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} t={t} />
              ))}
            </div>
          ) : (
            <EmptyState icon="book" title={t('dashboard.no_courses')} />
          )}
        </Panel>

        <Panel title={t('dashboard.recent_grades')}>
          {grades.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {grades.map((grade, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-control border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t(grade.title_key)}</p>
                    <p className="truncate text-sm text-muted">{t(grade.course_name_key)}</p>
                  </div>
                  <span className="tabular shrink-0 rounded bg-primary-soft px-2.5 py-1 text-sm font-semibold text-primary">
                    {grade.score}/{grade.max_score}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title={t('dashboard.no_grades')} />
          )}
        </Panel>
      </div>

      <Panel title={t('dashboard.upcoming_assignments')}>
        {assignments.length > 0 ? (
          <div className="table-scroll">
            <table className="w-full text-sm">
              <thead className="text-muted">
                <tr className="border-b border-border text-left">
                  <th className="pb-2 text-xs font-semibold tracking-wide uppercase">
                    {t('assignment.title')}
                  </th>
                  <th className="hidden pb-2 text-xs font-semibold tracking-wide uppercase md:table-cell">
                    {t('course.name')}
                  </th>
                  <th className="pb-2 text-xs font-semibold tracking-wide uppercase">
                    {t('assignment.due_date')}
                  </th>
                  <th className="hidden pb-2 text-xs font-semibold tracking-wide uppercase sm:table-cell">
                    {t('assignment.status')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="border-b border-border last:border-0">
                    <td className="py-2.5">
                      <span className="font-medium">{t(assignment.title_key)}</span>
                      <span className="block text-sm text-muted md:hidden">
                        {t(assignment.course_name_key)}
                      </span>
                    </td>
                    <td className="hidden py-2.5 text-muted md:table-cell">
                      {t(assignment.course_name_key)}
                    </td>
                    <td className="tabular py-2.5">
                      <span className={assignment.is_urgent ? 'font-medium text-danger' : ''}>
                        {new Date(assignment.due_date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="hidden py-2.5 sm:table-cell">
                      <Badge tone={assignment.is_submitted ? 'success' : 'warning'}>
                        {assignment.is_submitted ? t('assignment.submitted') : t('assignment.pending')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon="clipboard" title={t('dashboard.no_assignments')} />
        )}
      </Panel>
    </div>
  )
}

function Panel({
  title,
  className = '',
  children,
}: {
  title: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={`rounded-card border border-border bg-surface p-5 shadow-card ${className}`}>
      <h2 className="mb-4 text-base font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function CourseCard({
  course,
  t,
}: {
  course: {
    id: string
    code: string
    name_key: string
    credits: number
    instructor: string
    progress: number
  }
  t: TFunction
}) {
  return (
    <div className="rounded-control border border-border p-4 transition-colors hover:border-border-strong">
      <div className="mb-2 flex items-start justify-between gap-2">
        <Badge>{course.code}</Badge>
        <Badge tone="primary">
          {course.credits} {t('course.credits')}
        </Badge>
      </div>
      <h3 className="mb-1 font-semibold">{t(course.name_key)}</h3>
      <p className="mb-3 text-sm text-muted">{course.instructor}</p>
      <div className="flex items-center gap-3">
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2"
          role="progressbar"
          aria-valuenow={course.progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${course.progress}%` }} />
        </div>
        <span className="tabular text-xs text-muted">{course.progress}%</span>
      </div>
    </div>
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
