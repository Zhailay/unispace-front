import { baseApi } from '@/app/api/baseApi'
import type { ApiOk, CurrentUser } from '@/shared/types/api'
import { loggedOut } from '@/features/auth/authSlice'

interface ProfileResponse extends ApiOk {
  user: CurrentUser
}

interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface ChangePasswordResponse extends ApiOk {
  message: string
}

export const profileApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Профиль сотрудника
    staffProfile: build.query<ProfileResponse, void>({
      query: () => '/staff/profile',
    }),

    // Смена пароля сотрудника — после успеха разлогинивает
    staffChangePassword: build.mutation<ChangePasswordResponse, ChangePasswordRequest>({
      query: (body) => ({ url: '/staff/profile/change-password', method: 'POST', body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          // Сессия уничтожена на бэке — чистим локальное состояние
          dispatch(loggedOut())
          dispatch(baseApi.util.resetApiState())
        } catch {
          // Ошибка обрабатывается в компоненте
        }
      },
    }),

    // Профиль студента
    studentProfile: build.query<ProfileResponse, void>({
      query: () => '/student/profile',
    }),

    // Смена пароля студента — после успеха разлогинивает
    studentChangePassword: build.mutation<ChangePasswordResponse, ChangePasswordRequest>({
      query: (body) => ({ url: '/student/profile/change-password', method: 'POST', body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
          // Сессия уничтожена на бэке — чистим локальное состояние
          dispatch(loggedOut())
          dispatch(baseApi.util.resetApiState())
        } catch {
          // Ошибка обрабатывается в компоненте
        }
      },
    }),
  }),
})

export const {
  useStaffProfileQuery,
  useStaffChangePasswordMutation,
  useStudentProfileQuery,
  useStudentChangePasswordMutation,
} = profileApi
