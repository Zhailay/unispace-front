import { baseApi } from '@/app/api/baseApi'
import type { Id, LegacyResponse, PageResponse, SpisokRow } from '@/shared/types/api'

/**
 * Row from public.kalendar_full(4, ...).
 * Fields verified against kalendar.hbs template data-attributes.
 */
export interface KalendarRow {
  out_code: number | null
  out_kalendar_id: Id
  out_id_kontingent: Id | null
  out_id_spec: Id
  out_id_forma_obuch: Id
  out_id_god: Id
  out_id_kurs: Id
  out_id_semestr: Id
  out_id_period_obuch: Id
  out_spec_name: string | null
  out_god_value: string | null
  out_forma_obuch_name: string | null
  out_kurs_nomer: string | null
  out_semestr_nomer: string | null
  out_period_obuch_name: string | null
  out_kalendar_nachalo: string | null
  out_kalendar_konec: string | null
}

/** Dropdown list items from spisok procedures */
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

export interface KursItem extends SpisokRow {
  kurs_id: Id
  kurs_nomer: string
}

export interface SemestrItem extends SpisokRow {
  semestr_id: Id
  semestr_nomer: string
}

export interface PeriodObuchItem extends SpisokRow {
  period_obuch_id: Id
  period_obuch_name: string
}

/** Page data returned by GET /kalendar (through apiCompat) */
export interface KalendarPageData {
  spec_list: SpecItem[]
  forma_obuch_list: FormaObuchItem[]
  god_list: GodItem[]
  kurs_list: KursItem[]
  semestr_list: SemestrItem[]
  period_obuch_list: PeriodObuchItem[]
}

export interface KalendarInput {
  id_spec: Id
  id_forma_obuch: Id
  id_god: Id
  id_kurs: Id
  id_semestr: Id
  id_period_obuch: Id
  kalendar_nachalo: string
  kalendar_konec: string
}

interface ListArgs {
  id_spec?: Id | null
  id_forma_obuch?: Id | null
  id_god?: Id | null
  limit?: number
  offset?: number
}

export const kalendarApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /kalendar - page data with dropdown lists (through apiCompat)
    kalendarPage: build.query<PageResponse<KalendarPageData>, void>({
      query: () => '/kalendar',
      providesTags: ['Kalendar'],
    }),

    // POST /kalendar/tb - list with filters, pagination
    kalendarList: build.query<LegacyResponse<KalendarRow[]>, ListArgs>({
      query: (body) => ({ url: '/kalendar/tb', method: 'POST', body }),
      providesTags: ['Kalendar'],
    }),

    // POST /kalendar/insert - create
    createKalendar: build.mutation<LegacyResponse, KalendarInput>({
      query: (body) => ({ url: '/kalendar/insert', method: 'POST', body }),
      invalidatesTags: ['Kalendar'],
    }),

    // PUT /kalendar - update
    updateKalendar: build.mutation<LegacyResponse, KalendarInput & { kalendar_id: Id }>({
      query: (body) => ({ url: '/kalendar', method: 'PUT', body }),
      invalidatesTags: ['Kalendar'],
    }),

    // DELETE /kalendar - delete
    deleteKalendar: build.mutation<LegacyResponse, Id>({
      query: (kalendar_id) => ({ url: '/kalendar', method: 'DELETE', body: { kalendar_id } }),
      invalidatesTags: ['Kalendar'],
    }),
  }),
})

export const {
  useKalendarPageQuery,
  useKalendarListQuery,
  useCreateKalendarMutation,
  useUpdateKalendarMutation,
  useDeleteKalendarMutation,
} = kalendarApi
