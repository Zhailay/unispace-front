import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthBootstrap } from '@/features/auth/useAuthBootstrap'
import RequireAuth from '@/features/auth/RequireAuth'
import StaffLayout from '@/layouts/StaffLayout'
import StudentLayout from '@/layouts/StudentLayout'
import LoginPage from '@/pages/LoginPage'
import StaffDashboardPage from '@/pages/staff/StaffDashboardPage'
import SpecialtiesPage from '@/pages/staff/SpecialtiesPage'
import GruppaOpPage from '@/pages/staff/GruppaOpPage'
import GruppaPage from '@/pages/staff/GruppaPage'
import StudentsPage from '@/pages/staff/StudentsPage'
import DisciplinaPage from '@/pages/staff/DisciplinaPage'
import ModulNamePage from '@/pages/staff/ModulNamePage'
import ObshNamePage from '@/pages/staff/ObshNamePage'
import KalendarPage from '@/pages/staff/KalendarPage'
import PlanPage from '@/pages/staff/PlanPage'
import RegistraciyaPage from '@/pages/staff/RegistraciyaPage'
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
            <Route path="/staff/gruppa-op" element={<GruppaOpPage />} />
            <Route path="/staff/gruppa" element={<GruppaPage />} />
            <Route path="/staff/students" element={<StudentsPage />} />
            <Route path="/staff/disciplina" element={<DisciplinaPage />} />
            <Route path="/staff/modul-name" element={<ModulNamePage />} />
            <Route path="/staff/obsh-name" element={<ObshNamePage />} />
            <Route path="/staff/kalendar" element={<KalendarPage />} />
            <Route path="/staff/plan" element={<PlanPage />} />
            <Route path="/staff/registraciya" element={<RegistraciyaPage />} />
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
