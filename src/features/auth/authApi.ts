import { baseApi } from '@/app/api/baseApi'
import type { ApiOk, CurrentUser, UserType } from '@/shared/types/api'
import { loggedIn, loggedOut } from './authSlice'

export interface LoginRequest {
  login: string
  password: string
  userType: UserType
}

interface AuthResponse extends ApiOk {
  user: CurrentUser
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
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

export const { useLoginMutation, useMeQuery, useLogoutMutation } = authApi
