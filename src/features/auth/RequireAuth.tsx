import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import type { UserType } from '@/shared/types/api'

/**
 * Разграничение доступа повторяет бэк: там оно тоже сводится к
 * «студент или сотрудник» — ролей в системе фактически нет.
 */
export default function RequireAuth({ userType }: { userType: UserType }) {
  const user = useAppSelector((s) => s.auth.user)
  const location = useLocation()

  if (!user) {
    // Запоминаем, куда шли, чтобы вернуть после входа.
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user.type !== userType) {
    return <Navigate to={user.type === 'sotrudnik' ? '/staff' : '/student'} replace />
  }

  return <Outlet />
}
