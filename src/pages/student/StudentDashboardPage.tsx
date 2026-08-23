import { useAppSelector } from '@/app/hooks'
import { useT } from '@/shared/i18n/useT'
import { useStudentDashboardQuery } from '@/features/dashboard/dashboardApi'
import Spinner from '@/shared/ui/Spinner'

export default function StudentDashboardPage() {
  const t = useT()
  const user = useAppSelector((s) => s.auth.user)

  const { data: response, isLoading, error } = useStudentDashboardQuery()
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

  const courses = dashData?.courses ?? []
  const grades = dashData?.grades ?? []
  const assignments = dashData?.assignments ?? []
  const attendance = dashData?.attendance ?? 0
  const today = dashData?.today ? new Date(dashData.today).toLocaleDateString() : new Date().toLocaleDateString()

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Card */}
      <div className="rounded-card bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-fg">
        <h1 className="text-2xl font-bold">{t('dashboard.student_welcome', { name: user?.fullName ?? '' })}</h1>
        <p className="mt-1 opacity-80">
          <span className="mr-2 inline-block rounded bg-white/20 px-2 py-0.5 text-sm font-medium">
            {user?.id}
          </span>
          {t('dashboard.today_is')} {today}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label={t('dashboard.my_courses')}
          value={courses.length}
          color="bg-primary/10 text-primary"
        />
        <StatCard
          label={t('dashboard.recent_grades')}
          value={grades.length}
          color="bg-success/10 text-success"
        />
        <StatCard
          label={t('dashboard.upcoming_assignments')}
          value={assignments.length}
          color="bg-warning/10 text-warning"
        />
        <StatCard
          label={t('dashboard.attendance')}
          value={attendance}
          suffix="%"
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
            <div className="grid gap-4 md:grid-cols-2">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} t={t} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted">
              <p>{t('dashboard.no_courses')}</p>
            </div>
          )}
        </div>

        {/* Recent Grades */}
        <div className="rounded-card border border-border bg-surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('dashboard.recent_grades')}</h2>
          </div>
          {grades.length > 0 ? (
            <div className="flex flex-col gap-3">
              {grades.map((grade, idx) => (
                <GradeItem key={idx} grade={grade} t={t} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted">
              <p>{t('dashboard.no_grades')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Assignments */}
      <div className="rounded-card border border-border bg-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('dashboard.upcoming_assignments')}</h2>
        </div>
        {assignments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-sm text-muted">
                  <th className="pb-2 font-medium">{t('assignment.title')}</th>
                  <th className="hidden pb-2 font-medium md:table-cell">{t('course.name')}</th>
                  <th className="pb-2 font-medium">{t('assignment.due_date')}</th>
                  <th className="hidden pb-2 font-medium sm:table-cell">{t('assignment.status')}</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="border-b border-border last:border-0">
                    <td className="py-3">
                      <span className="font-medium">{t(assignment.title_key)}</span>
                      <span className="md:hidden block text-sm text-muted">{t(assignment.course_name_key)}</span>
                    </td>
                    <td className="hidden py-3 text-muted md:table-cell">{t(assignment.course_name_key)}</td>
                    <td className="py-3">
                      <span className={assignment.is_urgent ? 'font-medium text-error' : ''}>
                        {new Date(assignment.due_date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="hidden py-3 sm:table-cell">
                      {assignment.is_submitted ? (
                        <span className="rounded bg-success/10 px-2 py-1 text-xs font-medium text-success">
                          {t('assignment.submitted')}
                        </span>
                      ) : (
                        <span className="rounded bg-warning/10 px-2 py-1 text-xs font-medium text-warning">
                          {t('assignment.pending')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-muted">
            <p>{t('dashboard.no_assignments')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  suffix,
  color,
}: {
  label: string
  value: number
  suffix?: string
  color: string
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-4 transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${color}`}>
          <span className="text-lg font-bold">#</span>
        </div>
        <div>
          <p className="text-2xl font-bold">
            {value}
            {suffix && <span className="text-base text-muted">{suffix}</span>}
          </p>
          <p className="text-sm text-muted">{label}</p>
        </div>
      </div>
    </div>
  )
}

function CourseCard({
  course,
  t,
}: {
  course: { id: string; code: string; name_key: string; credits: number; instructor: string; progress: number }
  t: (key: string) => string
}) {
  return (
    <div className="rounded-card border border-border p-4 transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-start justify-between">
        <span className="rounded bg-muted/20 px-2 py-0.5 text-xs font-medium">{course.code}</span>
        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {course.credits} {t('course.credits')}
        </span>
      </div>
      <h3 className="mb-1 font-semibold">{t(course.name_key)}</h3>
      <p className="mb-3 text-sm text-muted">{course.instructor}</p>
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/20">
          <div className="h-full rounded-full bg-primary" style={{ width: `${course.progress}%` }} />
        </div>
        <span className="text-xs text-muted">{course.progress}%</span>
      </div>
    </div>
  )
}

function GradeItem({
  grade,
  t,
}: {
  grade: { title_key: string; course_name_key: string; score: number; max_score: number }
  t: (key: string) => string
}) {
  return (
    <div className="flex items-center justify-between rounded-card border border-border p-3">
      <div className="flex-1">
        <p className="font-medium">{t(grade.title_key)}</p>
        <p className="text-sm text-muted">{t(grade.course_name_key)}</p>
      </div>
      <span className="rounded bg-primary px-2.5 py-1 text-sm font-medium text-primary-fg">
        {grade.score}/{grade.max_score}
      </span>
    </div>
  )
}
