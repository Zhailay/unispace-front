import { baseApi } from '@/app/api/baseApi'
import type { Id, LegacyResponse } from '@/shared/types/api'

/**
 * Row from public.obsh_name_full(4, ...). Field names verified from HBS template
 * and controller output - all fields have out_ prefix.
 */
export interface ObshNameRow {
  out_code: number | null
  out_obsh_name_id: Id
  out_obsh_name_kz: string
  out_obsh_name_ru: string
  out_obsh_name_en: string
  out_obsh_name_short_kz: string
  out_obsh_name_short_ru: string
  out_obsh_name_short_en: string
}

export interface ObshNameInput {
  obsh_name_kz: string
  obsh_name_ru: string
  obsh_name_en: string
  obsh_name_short_kz: string
  obsh_name_short_ru: string
  obsh_name_short_en: string
}

interface ListArgs {
  search?: string
  limit?: number
  offset?: number
}

export const obshNameApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // POST /tb - list with pagination
    obshNameList: build.query<LegacyResponse<ObshNameRow[]>, ListArgs>({
      query: (body) => ({ url: '/obsh_name/tb', method: 'POST', body }),
      providesTags: ['ObshName'],
    }),

    createObshName: build.mutation<LegacyResponse, ObshNameInput>({
      query: (body) => ({ url: '/obsh_name/insert', method: 'POST', body }),
      invalidatesTags: ['ObshName'],
    }),

    updateObshName: build.mutation<LegacyResponse, ObshNameInput & { obsh_name_id: Id }>({
      query: (body) => ({ url: '/obsh_name', method: 'PUT', body }),
      invalidatesTags: ['ObshName'],
    }),

    deleteObshName: build.mutation<LegacyResponse, Id>({
      query: (obsh_name_id) => ({ url: '/obsh_name', method: 'DELETE', body: { obsh_name_id } }),
      invalidatesTags: ['ObshName'],
    }),
  }),
})

export const {
  useObshNameListQuery,
  useCreateObshNameMutation,
  useUpdateObshNameMutation,
  useDeleteObshNameMutation,
} = obshNameApi
