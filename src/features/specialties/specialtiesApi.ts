import { baseApi } from '@/app/api/baseApi'
import type { Id, LegacyResponse, PageResponse, SpisokRow } from '@/shared/types/api'
import type { Lang } from '@/shared/i18n/lang'

/**
 * Строка из public.spec_full(4, ...). Поля сверены с реальным ответом API,
 * а не выведены по догадке: процедура отдаёт все три языка отдельными
 * колонками, единого out_spec_name не существует.
 */
export interface SpecialtyRow {
  out_code: number | null
  out_spec_id: Id
  out_spec_kod: string
  out_spec_kz: string
  out_spec_ru: string
  out_spec_en: string
  out_id_gruppa_op: Id
  out_gruppa_op_name: string | null
}

/** Выбирает нужную языковую колонку строки справочника. */
export function specName(row: SpecialtyRow, lang: Lang): string {
  if (lang === 'kk') return row.out_spec_kz
  if (lang === 'en') return row.out_spec_en
  return row.out_spec_ru
}

export interface SpecialtyInput {
  spec_kod: string
  spec_kz: string
  spec_ru: string
  spec_en: string
  id_gruppa_op: Id
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

    updateSpecialty: build.mutation<LegacyResponse, SpecialtyInput & { spec_id: Id }>({
      query: (body) => ({ url: '/specialties', method: 'PUT', body }),
      invalidatesTags: ['Specialty'],
    }),

    deleteSpecialty: build.mutation<LegacyResponse, Id>({
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
