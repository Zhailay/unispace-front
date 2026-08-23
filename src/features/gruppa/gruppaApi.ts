import { baseApi } from '@/app/api/baseApi'
import type { Id, LegacyResponse, PageResponse, SpisokRow } from '@/shared/types/api'

/**
 * Row from public.gruppa_full(4, ...).
 * Fields verified against gruppa.hbs template data-attributes.
 */
export interface GruppaRow {
  out_code: number | null
  out_gruppa_id: Id
  out_gruppa_name: string
  out_id_otdelenie: Id
  out_id_spec: Id
  out_id_forma_obuch: Id
  out_id_god: Id
  out_id_kontingent: Id | null
  out_otdelenie_ru: string | null
  out_spec_ru: string | null
  out_forma_obuch_ru: string | null
}

/** Dropdown list items from spisok procedures */
export interface OtdelenieItem extends SpisokRow {
  otdelenie_id: Id
  otdelenie_name: string
}

export interface SpecItem extends SpisokRow {
  spec_id: Id
  spec_name: string
}

export interface FormaObuchItem extends SpisokRow {
  forma_obuch_id: Id
  forma_obuch_name: string
}

export interface GodItem extends SpisokRow {
  god_id: Id
  god_value: string
}

/** Page data returned by GET /gruppa (through apiCompat) */
export interface GruppaPageData {
  otdelenie_list: OtdelenieItem[]
  spec_list: SpecItem[]
  forma_obuch_list: FormaObuchItem[]
  god_list: GodItem[]
}

export interface GruppaInput {
  gruppa_name: string
  id_otdelenie: Id
  id_spec: Id
  id_forma_obuch: Id
  id_god: Id
}

interface ListArgs {
  search?: string
  limit?: number
  offset?: number
}

export const gruppaApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /gruppa - page data with dropdown lists (through apiCompat)
    gruppaPage: build.query<PageResponse<GruppaPageData>, void>({
      query: () => '/gruppa',
      providesTags: ['Gruppa'],
    }),

    // POST /gruppa/tb - list with search, pagination
    gruppaList: build.query<LegacyResponse<GruppaRow[]>, ListArgs>({
      query: (body) => ({ url: '/gruppa/tb', method: 'POST', body }),
      providesTags: ['Gruppa'],
    }),

    // POST /gruppa/insert - create
    createGruppa: build.mutation<LegacyResponse, GruppaInput>({
      query: (body) => ({ url: '/gruppa/insert', method: 'POST', body }),
      invalidatesTags: ['Gruppa'],
    }),

    // PUT /gruppa - update
    updateGruppa: build.mutation<LegacyResponse, GruppaInput & { gruppa_id: Id }>({
      query: (body) => ({ url: '/gruppa', method: 'PUT', body }),
      invalidatesTags: ['Gruppa'],
    }),

    // DELETE /gruppa - delete
    deleteGruppa: build.mutation<LegacyResponse, Id>({
      query: (gruppa_id) => ({ url: '/gruppa', method: 'DELETE', body: { gruppa_id } }),
      invalidatesTags: ['Gruppa'],
    }),
  }),
})

export const {
  useGruppaPageQuery,
  useGruppaListQuery,
  useCreateGruppaMutation,
  useUpdateGruppaMutation,
  useDeleteGruppaMutation,
} = gruppaApi
