import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { loggedOut } from '@/features/auth/authSlice'
import { getLang } from '@/shared/i18n/lang'

/**
 * Теги для инвалидации кэша. Один тег на сущность бэка.
 * Мутация объявляет invalidatesTags, запрос — providesTags.
 */
export const API_TAGS = [
  'Auth',
  'Dashboard',
  'Specialty',
  'Gruppa',
  'GruppaOp',
  'Student',
  'Employee',
  'Department',
  'Position',
  'Disciplina',
  'Kalendar',
  'ModulName',
  'ObshName',
  'Plan',
  'Registraciya',
  'Jurnal',
  'Vneplanovoe',
  'Test',
] as const

const rawBaseQuery = fetchBaseQuery({
  // Относительный путь: в dev его проксирует Vite, в проде фронт и API
  // отдаются с одного домена. VITE_API_URL нужен, только если это не так.
  baseUrl: import.meta.env.VITE_API_URL || '/api',
  // Без этого cookie сессии не поедет на бэк.
  credentials: 'include',
  prepareHeaders: (headers) => {
    // Бэк выбирает язык по X-Lang (см. middlewares/i18n.js).
    headers.set('X-Lang', getLang())
    return headers
  },
})

/**
 * Обёртка: ловит 401 и разлогинивает пользователя глобально,
 * чтобы каждый компонент не проверял это сам.
 */
const baseQueryWithAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions)

  if (result.error?.status === 401) {
    const isAuthCheck = typeof args !== 'string' && args.url === '/auth/me'
    // /auth/me отвечает 401 при обычном старте без сессии — это не «выкинуло из системы».
    if (!isAuthCheck) api.dispatch(loggedOut())
  }

  return result
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuth,
  tagTypes: API_TAGS,
  // Эндпоинты добавляются через injectEndpoints в features/*/api.ts —
  // так каждый модуль остаётся самодостаточным.
  endpoints: () => ({}),
})
