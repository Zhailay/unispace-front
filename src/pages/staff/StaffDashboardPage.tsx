import { useAppSelector } from '@/app/hooks'
import { useT } from '@/shared/i18n/useT'
import { useStaffDashboardQuery } from '@/features/dashboard/dashboardApi'
import Spinner from '@/shared/ui/Spinner'

export default function StaffDashboardPage() {
  const t = useT()
  const user = useAppSelector((s) => s.auth.user)

  const { data: response, isLoading, error } = useStaffDashboardQuery()
  const dashData = response?.data

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-error">{t('error.loading_failed')}</p>
      </div>
    )
  }

  const stats = dashData?.stats ?? { courses: 0, students: 0, assignments: 0, grades: 0 }
  const courses = dashData?.courses ?? []
  const pendingSubmissions = dashData?.pendingSubmissions ?? []
  const recentActivity = dashData?.recentActivity ?? []

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Card */}
      <div className="rounded-card bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-fg">
        <h1 className="text-2xl font-bold">{t('dashboard.staff_welcome', { name: user?.fullName ?? '' })}</h1>
        <p className="mt-1 opacity-80">{t('common.welcome')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label={t('nav.courses')}
          value={stats.courses}
          color="bg-primary/10 text-primary"
        />
        <StatCard
          label={t('nav.students')}
          value={stats.students}
          color="bg-success/10 text-success"
        />
        <StatCard
          label={t('nav.assignments')}
          value={stats.assignments}
          color="bg-warning/10 text-warning"
        />
        <StatCard
          label={t('nav.grades')}
          value={stats.grades}
          color="bg-info/10 text-info"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* My Courses - takes 2 columns */}
        <div className="rounded-card border border-border bg-surface p-6 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('dashboard.my_courses')}</h2>
          </div>
          {courses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-sm text-muted">
                    <th className="pb-2 font-medium">{t('course.code')}</th>
                    <th className="pb-2 font-medium">{t('course.name')}</th>
                    <th className="hidden pb-2 text-center font-medium md:table-cell">{t('course.credits')}</th>
                    <th className="hidden pb-2 font-medium lg:table-cell">{t('course.semester')}</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id} className="border-b border-border last:border-0">
                      <td className="py-3">
                        <span className="rounded bg-muted/20 px-2 py-1 text-xs font-medium">{course.code}</span>
                      </td>
                      <td className="py-3">
                        <span className="font-medium">{t(course.name_key)}</span>
                      </td>
                      <td className="hidden py-3 text-center md:table-cell">{course.credits}</td>
                      <td className="hidden py-3 text-muted lg:table-cell">
                        {course.academic_year} / {course.semester}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted">
              <p>{t('dashboard.no_courses')}</p>
            </div>
          )}
        </div>

        {/* Sidebar - Quick Actions & Pending */}
        <div className="flex flex-col gap-6">
          {/* Quick Actions */}
          <div className="rounded-card border border-border bg-surface p-6">
            <h2 className="mb-4 text-lg font-semibold">{t('dashboard.quick_actions')}</h2>
            <div className="flex flex-col gap-2">
              <QuickActionButton label={t('grade.add')} href="/staff/jurnal" />
              <QuickActionButton label={t('nav.registraciya')} href="/staff/registraciya" />
              <QuickActionButton label={t('nav.plan')} href="/staff/plan" />
            </div>
          </div>

          {/* Pending Submissions */}
          <div className="rounded-card border border-border bg-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t('dashboard.pending_submissions')}</h2>
              <span className="rounded-full bg-warning px-2 py-0.5 text-xs font-medium text-warning-fg">
                {pendingSubmissions.length}
              </span>
            </div>
            {pendingSubmissions.length > 0 ? (
              <div className="flex flex-col gap-3">
                {pendingSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between rounded-card border border-border p-3"
                  >
                    <div>
                      <p className="font-medium">{submission.student_name}</p>
                      <p className="text-sm text-muted">{t(submission.assignment_title_key)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-muted">
                <p>{t('dashboard.no_pending')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-card border border-border bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold">{t('dashboard.recent_activity')}</h2>
        {recentActivity.length > 0 ? (
          <div className="flex flex-col gap-3">
            {recentActivity.map((activity, idx) => (
              <ActivityItem key={idx} activity={activity} t={t} />
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-muted">
            <p>{t('dashboard.no_activity')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-card border border-border bg-surface p-4 transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${color}`}>
          <span className="text-lg font-bold">#</span>
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted">{label}</p>
        </div>
      </div>
    </div>
  )
}

function QuickActionButton({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      className="flex items-center justify-between rounded-card border border-border px-4 py-3 transition-colors hover:bg-bg"
    >
      <span className="font-medium">{label}</span>
      <span className="text-muted">&rarr;</span>
    </a>
  )
}

function ActivityItem({
  activity,
  t,
}: {
  activity: { type: string; message_key: string; created_at: string }
  t: (key: string) => string
}) {
  const typeColors: Record<string, string> = {
    grade: 'bg-success/10 text-success',
    assignment: 'bg-warning/10 text-warning',
    submission: 'bg-info/10 text-info',
  }
  const color = typeColors[activity.type] ?? 'bg-muted/10 text-muted'

  return (
    <div className="flex items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
      <div className={`h-8 w-8 rounded-full ${color} flex items-center justify-center`}>
        <span className="text-xs font-bold">{activity.type[0].toUpperCase()}</span>
      </div>
      <div className="flex-1">
        <p className="text-sm">{t(activity.message_key)}</p>
        <p className="text-xs text-muted">{new Date(activity.created_at).toLocaleString()}</p>
      </div>
    </div>
  )
}
