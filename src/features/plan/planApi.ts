import { baseApi } from '@/app/api/baseApi'
import type { Id, LegacyResponse, PageResponse, SpisokRow } from '@/shared/types/api'

/**
 * Row from public.plan_full(4, ...).
 * Fields verified against plan.hbs template data-attributes (lines 609-650).
 */
export interface PlanRow {
  out_code: number | null
  out_plan_id: Id
  out_kurs_nomer: string | null
  out_semestr_nomer: string | null
  out_period_obuch_name: string | null
  out_disciplina_name: string | null
  out_plan_kod: string | null
  out_obsh_name: string | null
  out_modul_name: string | null
  out_plan_kredit: string | null
  out_chasy: string | null
  out_yazyk_prepodavaniya: string | null
  out_vid_zanyatiya_str: string | null
  out_forma_kontrolya_name: string | null
  out_plan_ro: string | null
  // IDs for edit form population
  out_id_disciplina: Id | null
  out_id_obsh_name: Id | null
  out_id_modul_name: Id | null
  out_id_forma_kontrolya: Id | null
  out_yazyk_kaz: Id | null
  out_yazyk_rus: Id | null
  out_yazyk_angl: Id | null
  out_yazyk_poliaz: Id | null
  out_plan_ro_kz: string | null
  out_plan_ro_ru: string | null
  out_plan_ro_en: string | null
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

export interface ModulNameItem extends SpisokRow {
  modul_name_id: Id
  modul_name_value: string
}

export interface ObshNameItem extends SpisokRow {
  obsh_name_id: Id
  obsh_name_value: string
}

export interface FormaKontrolyaItem extends SpisokRow {
  forma_kontrolya_id: Id
  forma_kontrolya_name: string
}

export interface YazykItem extends SpisokRow {
  yazyk_id: Id
  yazyk_name: string
}

export interface DisciplinaSearchItem {
  disciplina_id: Id
  disciplina_name: string
}

/** Page data returned by GET /plan (through apiCompat) */
export interface PlanPageData {
  spec_list: SpecItem[]
  forma_obuch_list: FormaObuchItem[]
  god_list: GodItem[]
  kurs_list: KursItem[]
  semestr_list: SemestrItem[]
  period_obuch_list: PeriodObuchItem[]
  modul_name_list: ModulNameItem[]
  obsh_name_list: ObshNameItem[]
  forma_kontrolya_list: FormaKontrolyaItem[]
  yazyk_list: YazykItem[]
}

export interface PlanCreateInput {
  id_spec: Id
  id_forma_obuch: Id
  id_god: Id
  id_kurs: Id
  id_semestr: Id
  id_period_obuch: Id
  id_disciplina: Id
  plan_kod?: string | null
  plan_ro_kz?: string | null
  plan_ro_ru?: string | null
  plan_ro_en?: string | null
  id_modul_name?: Id | null
  id_obsh_name?: Id | null
  id_forma_kontrolya?: Id | null
  id_yazyk_kaz?: Id | null
  id_yazyk_rus?: Id | null
  id_yazyk_angl?: Id | null
  id_yazyk_poliaz?: Id | null
}

export interface PlanUpdateInput {
  plan_id: Id
  id_disciplina: Id
  plan_kod?: string | null
  plan_ro_kz?: string | null
  plan_ro_ru?: string | null
  plan_ro_en?: string | null
  id_modul_name?: Id | null
  id_obsh_name?: Id | null
  id_forma_kontrolya?: Id | null
  id_yazyk_kaz?: Id | null
  id_yazyk_rus?: Id | null
  id_yazyk_angl?: Id | null
  id_yazyk_poliaz?: Id | null
}

interface ListArgs {
  id_spec: Id | null
  id_forma_obuch: Id | null
  id_god: Id | null
  id_kurs: Id | null
}

interface PeriodObuchArgs {
  id_kurs: Id
  id_semestr: Id
}

interface DisciplinaSearchArgs {
  disciplina_value: string
}

export const planApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /plan - page data with dropdown lists (through apiCompat)
    planPage: build.query<PageResponse<PlanPageData>, void>({
      query: () => '/plan',
      providesTags: ['Plan'],
    }),

    // POST /plan/tb - list with filters (no pagination in original)
    planList: build.query<LegacyResponse<PlanRow[]>, ListArgs>({
      query: (body) => ({ url: '/plan/tb', method: 'POST', body }),
      providesTags: ['Plan'],
    }),

    // POST /plan/period_obuch - get period_obuch options based on kurs + semestr
    planPeriodObuch: build.query<LegacyResponse<PeriodObuchItem[]>, PeriodObuchArgs>({
      query: (body) => ({ url: '/plan/period_obuch', method: 'POST', body }),
    }),

    // POST /plan/poisk_dis - search disciplines by name
    planSearchDisciplina: build.query<LegacyResponse<DisciplinaSearchItem[]>, DisciplinaSearchArgs>({
      query: (body) => ({ url: '/plan/poisk_dis', method: 'POST', body }),
    }),

    // POST /plan/insert - create
    createPlan: build.mutation<LegacyResponse, PlanCreateInput>({
      query: (body) => ({ url: '/plan/insert', method: 'POST', body }),
      invalidatesTags: ['Plan'],
    }),

    // PUT /plan - update
    updatePlan: build.mutation<LegacyResponse, PlanUpdateInput>({
      query: (body) => ({ url: '/plan', method: 'PUT', body }),
      invalidatesTags: ['Plan'],
    }),

    // DELETE /plan - delete
    deletePlan: build.mutation<LegacyResponse, Id>({
      query: (plan_id) => ({ url: '/plan', method: 'DELETE', body: { plan_id } }),
      invalidatesTags: ['Plan'],
    }),
  }),
})

export const {
  usePlanPageQuery,
  usePlanListQuery,
  usePlanPeriodObuchQuery,
  usePlanSearchDisciplinaQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeletePlanMutation,
} = planApi
