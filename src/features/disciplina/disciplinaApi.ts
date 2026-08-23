import { baseApi } from '@/app/api/baseApi'
import type { Id, LegacyResponse, PageResponse } from '@/shared/types/api'

/**
 * Row from public.disciplina_full(4, ...). Field names verified from HBS template
 * and controller output - all fields have out_ prefix.
 */
export interface DisciplinaRow {
  out_code: number | null
  out_disciplina_id: Id
  out_disciplina_kz: string
  out_disciplina_ru: string
  out_disciplina_en: string
  out_disciplina_kredit: number | null
  out_disciplina_lk: number | null
  out_disciplina_pz: number | null
  out_disciplina_lz: number | null
  out_disciplina_srs: number | null
  out_disciplina_srsp: number | null
  out_disciplina_pp: number | null
  out_disciplina_lpz: number | null
  out_disciplina_fz: number | null
  out_disciplina_opisanie: string | null
  out_id_podrazdelenie: Id | null
}

export interface DisciplinaInput {
  disciplina_kz: string
  disciplina_ru: string
  disciplina_en: string
  disciplina_kredit: number
  disciplina_lk?: number
  disciplina_pz?: number
  disciplina_lz?: number
  disciplina_srs?: number
  disciplina_srsp?: number
  disciplina_pp?: number
  disciplina_lpz?: number
  disciplina_fz?: number
  disciplina_opisanie?: string
  id_podrazdelenie?: Id
}

interface ListArgs {
  search?: string
  limit?: number
  offset?: number
  id_podrazdelenie?: Id
}

export interface PodrazdelenieRow {
  podrazdelenie_id: Id
  podrazdelenie_name: string
}

export const disciplinaApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET / - page data (podrazdelenie list for dropdown)
    disciplinaPage: build.query<PageResponse<{ podrazdelenie_list: PodrazdelenieRow[] }>, void>({
      query: () => '/disciplina',
    }),

    // POST /tb - list with pagination and filtering
    disciplinaList: build.query<LegacyResponse<DisciplinaRow[]>, ListArgs>({
      query: (body) => ({ url: '/disciplina/tb', method: 'POST', body }),
      providesTags: ['Disciplina'],
    }),

    createDisciplina: build.mutation<LegacyResponse, DisciplinaInput>({
      query: (body) => ({ url: '/disciplina/insert', method: 'POST', body }),
      invalidatesTags: ['Disciplina'],
    }),

    updateDisciplina: build.mutation<LegacyResponse, DisciplinaInput & { disciplina_id: Id }>({
      query: (body) => ({ url: '/disciplina', method: 'PUT', body }),
      invalidatesTags: ['Disciplina'],
    }),

    deleteDisciplina: build.mutation<LegacyResponse, Id>({
      query: (disciplina_id) => ({ url: '/disciplina', method: 'DELETE', body: { disciplina_id } }),
      invalidatesTags: ['Disciplina'],
    }),
  }),
})

export const {
  useDisciplinaPageQuery,
  useDisciplinaListQuery,
  useCreateDisciplinaMutation,
  useUpdateDisciplinaMutation,
  useDeleteDisciplinaMutation,
} = disciplinaApi
