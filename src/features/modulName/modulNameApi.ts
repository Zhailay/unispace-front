import { baseApi } from '@/app/api/baseApi'
import type { Id, LegacyResponse, PageResponse } from '@/shared/types/api'

/**
 * Row from public.modul_name_full(4, ...). Field names verified from HBS template
 * and controller output - all fields have out_ prefix.
 */
export interface ModulNameRow {
  out_code: number | null
  out_modul_name_id: Id
  out_modul_name_kz: string
  out_modul_name_ru: string
  out_modul_name_en: string
  out_modul_name_short_kz: string
  out_modul_name_short_ru: string
  out_modul_name_short_en: string
  out_id_tip_modul: Id | null
}

export interface ModulNameInput {
  modul_name_kz: string
  modul_name_ru: string
  modul_name_en: string
  modul_name_short_kz: string
  modul_name_short_ru: string
  modul_name_short_en: string
  id_tip_modul: Id
}

interface ListArgs {
  search?: string
  limit?: number
  offset?: number
}

export interface TipModulRow {
  tip_modul_id: Id
  tip_modul_name: string
}

export const modulNameApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET / - page data (tip modul list for dropdown)
    modulNamePage: build.query<PageResponse<{ tipModulList: TipModulRow[] }>, void>({
      query: () => '/modul_name',
    }),

    // POST /tb - list with pagination
    modulNameList: build.query<LegacyResponse<ModulNameRow[]>, ListArgs>({
      query: (body) => ({ url: '/modul_name/tb', method: 'POST', body }),
      providesTags: ['ModulName'],
    }),

    createModulName: build.mutation<LegacyResponse, ModulNameInput>({
      query: (body) => ({ url: '/modul_name/insert', method: 'POST', body }),
      invalidatesTags: ['ModulName'],
    }),

    updateModulName: build.mutation<LegacyResponse, ModulNameInput & { modul_name_id: Id }>({
      query: (body) => ({ url: '/modul_name', method: 'PUT', body }),
      invalidatesTags: ['ModulName'],
    }),

    deleteModulName: build.mutation<LegacyResponse, Id>({
      query: (modul_name_id) => ({ url: '/modul_name', method: 'DELETE', body: { modul_name_id } }),
      invalidatesTags: ['ModulName'],
    }),
  }),
})

export const {
  useModulNamePageQuery,
  useModulNameListQuery,
  useCreateModulNameMutation,
  useUpdateModulNameMutation,
  useDeleteModulNameMutation,
} = modulNameApi
