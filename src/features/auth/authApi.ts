import { baseApi } from '@/app/api/baseApi'
import type { ApiOk, CurrentUser, UserType } from '@/shared/types/api'
import { loggedIn, loggedOut } from './authSlice'

export interface LoginRequest {
  login: string
  password: string
}

interface AuthResponse extends ApiOk {
  user: CurrentUser
}

/**
 * Логин и пароль могут совпасть и со студентом, и с сотрудником одновременно
 * (тот же ИИН зарегистрирован в обеих таблицах) — тогда бэк не логинит сразу,
 * а просит выбрать роль явно через chooseRole.
 */
interface LoginResponse extends ApiOk {
  user?: CurrentUser
  needsRoleChoice?: boolean
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      invalidatesTags: ['Auth'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled
        if (data.user) dispatch(loggedIn(data.user))
      },
    }),

    chooseRole: build.mutation<AuthResponse, { role: UserType }>({
      query: (body) => ({ url: '/auth/choose-role', method: 'POST', body }),
      invalidatesTags: ['Auth'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled
        dispatch(loggedIn(data.user))
      },
    }),

    /** Переключение между student/sotrudnik без пароля — только если user.hasMultipleRoles. */
    switchRole: build.mutation<AuthResponse, void>({
      query: () => ({ url: '/auth/switch-role', method: 'POST' }),
      invalidatesTags: ['Auth'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled
        dispatch(loggedIn(data.user))
      },
    }),

    me: build.query<AuthResponse, void>({
      query: () => '/auth/me',
      providesTags: ['Auth'],
    }),

    logout: build.mutation<ApiOk, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
        } finally {
          // Чистим локальное состояние даже если запрос упал — cookie всё равно протух.
          dispatch(loggedOut())
          dispatch(baseApi.util.resetApiState())
        }
      },
    }),
  }),
})

export const {
  useLoginMutation,
  useChooseRoleMutation,
  useSwitchRoleMutation,
  useMeQuery,
  useLogoutMutation,
} = authApi
