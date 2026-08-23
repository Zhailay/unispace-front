import { baseApi } from '@/app/api/baseApi'
import type { Id, LegacyResponse } from '@/shared/types/api'
import type { Lang } from '@/shared/i18n/lang'

/**
 * Row from public.gruppa_op_full2(4, ...).
 * Fields verified against actual API response (HBS template data-attributes).
 */
export interface GruppaOpRow {
  out_code: number | null
  out_gruppa_op_id: Id
  out_gruppa_op_kod: string
  out_gruppa_op_kz: string
  out_gruppa_op_ru: string
  out_gruppa_op_en: string
}

/** Selects the appropriate language column from a GruppaOp row. */
export function gruppaOpName(row: GruppaOpRow, lang: Lang): string {
  if (lang === 'kk') return row.out_gruppa_op_kz
  if (lang === 'en') return row.out_gruppa_op_en
  return row.out_gruppa_op_ru
}

export interface GruppaOpInput {
  gruppa_op_kod: string
  gruppa_op_kz: string
  gruppa_op_ru: string
  gruppa_op_en: string
}

interface ListArgs {
  search?: string
  limit?: number
  offset?: number
}

export const gruppaOpApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // POST /gruppa_op/tb - list with search, pagination
    gruppaOpList: build.query<LegacyResponse<GruppaOpRow[]>, ListArgs>({
      query: (body) => ({ url: '/gruppa_op/tb', method: 'POST', body }),
      providesTags: ['GruppaOp'],
    }),

    // POST /gruppa_op/insert - create
    createGruppaOp: build.mutation<LegacyResponse, GruppaOpInput>({
      query: (body) => ({ url: '/gruppa_op/insert', method: 'POST', body }),
      invalidatesTags: ['GruppaOp'],
    }),

    // PUT /gruppa_op - update
    updateGruppaOp: build.mutation<LegacyResponse, GruppaOpInput & { gruppa_op_id: Id }>({
      query: (body) => ({ url: '/gruppa_op', method: 'PUT', body }),
      invalidatesTags: ['GruppaOp'],
    }),

    // DELETE /gruppa_op - delete
    deleteGruppaOp: build.mutation<LegacyResponse, Id>({
      query: (gruppa_op_id) => ({ url: '/gruppa_op', method: 'DELETE', body: { gruppa_op_id } }),
      invalidatesTags: ['GruppaOp'],
    }),
  }),
})

export const {
  useGruppaOpListQuery,
  useCreateGruppaOpMutation,
  useUpdateGruppaOpMutation,
  useDeleteGruppaOpMutation,
} = gruppaOpApi
