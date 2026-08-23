import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useMeQuery } from './authApi'
import { authChecked, loggedIn } from './authSlice'

/**
 * Однократная проверка сессии при старте приложения.
 * Пока initialized === false, маршруты рендерить нельзя — иначе RequireAuth
 * увидит user === null и отправит на /login залогиненного пользователя.
 */
export function useAuthBootstrap() {
  const dispatch = useAppDispatch()
  const initialized = useAppSelector((s) => s.auth.initialized)
  const { data, isError, isSuccess } = useMeQuery()

  useEffect(() => {
    if (isSuccess && data?.user) {
      dispatch(loggedIn(data.user))
    } else if (isError) {
      // 401 на старте — обычная ситуация: сессии просто нет.
      dispatch(authChecked())
    }
  }, [isSuccess, isError, data, dispatch])

  return { initialized }
}
