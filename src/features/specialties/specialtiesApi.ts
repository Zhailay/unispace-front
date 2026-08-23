import { baseApi } from '@/app/api/baseApi'
import type { LegacyResponse, PageResponse, SpisokRow } from '@/shared/types/api'

/** Строка из public.spec_full(4, ...) — процедура отдаёт колонки с префиксом out_. */
export interface SpecialtyRow {
  out_spec_id: number
  out_spec_kod: string
  out_spec_name: string
  out_gruppa_op_name?: string | null
  [key: string]: unknown
}

export interface SpecialtyInput {
  spec_kod: string
  spec_kz: string
  spec_ru: string
  spec_en: string
  id_gruppa_op: number
}

interface ListArgs {
  search?: string
  limit?: number
  offset?: number
}

export const specialtiesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET / — данные страницы (список групп ОП для выпадающего списка).
    // Проходит через apiCompat, поэтому форма ответа — PageResponse.
    specialtiesPage: build.query<PageResponse<{ gruppaOpList: SpisokRow[] }>, void>({
      query: () => '/specialties',
      providesTags: ['GruppaOp'],
    }),

    // Выборка — POST, а не GET: так этот эндпоинт устроен на бэке (/tb).
    specialties: build.query<LegacyResponse<SpecialtyRow[]>, ListArgs>({
      query: (body) => ({ url: '/specialties/tb', method: 'POST', body }),
      providesTags: ['Specialty'],
    }),

    createSpecialty: build.mutation<LegacyResponse, SpecialtyInput>({
      query: (body) => ({ url: '/specialties/insert', method: 'POST', body }),
      invalidatesTags: ['Specialty'],
    }),

    updateSpecialty: build.mutation<LegacyResponse, SpecialtyInput & { spec_id: number }>({
      query: (body) => ({ url: '/specialties', method: 'PUT', body }),
      invalidatesTags: ['Specialty'],
    }),

    deleteSpecialty: build.mutation<LegacyResponse, number>({
      query: (spec_id) => ({ url: '/specialties', method: 'DELETE', body: { spec_id } }),
      invalidatesTags: ['Specialty'],
    }),
  }),
})

export const {
  useSpecialtiesPageQuery,
  useSpecialtiesQuery,
  useCreateSpecialtyMutation,
  useUpdateSpecialtyMutation,
  useDeleteSpecialtyMutation,
} = specialtiesApi
