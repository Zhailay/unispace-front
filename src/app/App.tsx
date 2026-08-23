import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthBootstrap } from '@/features/auth/useAuthBootstrap'
import RequireAuth from '@/features/auth/RequireAuth'
import StaffLayout from '@/layouts/StaffLayout'
import StudentLayout from '@/layouts/StudentLayout'
import LoginPage from '@/pages/LoginPage'
import StaffDashboardPage from '@/pages/staff/StaffDashboardPage'
import SpecialtiesPage from '@/pages/staff/SpecialtiesPage'
import StudentDashboardPage from '@/pages/student/StudentDashboardPage'
import NotFoundPage from '@/pages/NotFoundPage'
import Spinner from '@/shared/ui/Spinner'
import Toasts from '@/shared/ui/Toasts'

export default function App() {
  // Восстанавливаем сессию до первого рендера маршрутов, иначе при F5
  // залогиненного пользователя выкинет на /login.
  const { initialized } = useAuthBootstrap()

  if (!initialized) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Кабинет сотрудника */}
        <Route element={<RequireAuth userType="sotrudnik" />}>
          <Route element={<StaffLayout />}>
            <Route path="/staff" element={<StaffDashboardPage />} />
            <Route path="/staff/specialties" element={<SpecialtiesPage />} />
          </Route>
        </Route>

        {/* Кабинет студента */}
        <Route element={<RequireAuth userType="student" />}>
          <Route element={<StudentLayout />}>
            <Route path="/student" element={<StudentDashboardPage />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <Toasts />
    </>
  )
}
