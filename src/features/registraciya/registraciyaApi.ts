import { baseApi } from '@/app/api/baseApi'
import type { Id, LegacyResponse, PageResponse, SpisokRow } from '@/shared/types/api'

/**
 * Dropdown list items from spisok procedures
 */
export interface SpecItem extends SpisokRow {
  spec_id: Id
  spec_name: string
}

export interface GodItem extends SpisokRow {
  god_id: Id
  god_value: string
}

export interface FormaObuchItem extends SpisokRow {
  forma_obuch_id: Id
  forma_obuch_name: string
}

export interface KursItem extends SpisokRow {
  kurs_id: Id
  kurs_nomer: string
}

export interface SemestrItem extends SpisokRow {
  semestr_id: Id
  semestr_nomer: string
}

export interface TeacherItem extends SpisokRow {
  sotrudnik_id: Id
  sotrudnik_fio: string
}

/** Page data returned by GET /registraciya (through apiCompat) */
export interface RegistraciyaPageData {
  spec_list: SpecItem[]
  god_list: GodItem[]
  forma_obuch_list: FormaObuchItem[]
  kurs_list: KursItem[]
  semestr_list: SemestrItem[]
  teacher_list: TeacherItem[]
}

/** Group row from gruppa_spisok_reg procedure */
export interface GruppaRegItem {
  id_kontingent: Id
  id_otdelenie: Id
  gruppa_id: Id
  gruppa_name: string
}

/** Discipline row from disciplina_plan_spisok procedure */
export interface DisciplinaPlanItem {
  plan_id: Id
  disciplina_name: string
}

/** Vid zanyatiya row from plan_vid_zanyatiya_spisok procedure */
export interface VidZanyatiyaItem {
  plan_vid_zanyatiya_id: Id
  vid_zanyatiya_name: string
}

/** Student row from student_gruppa_spisok procedure */
export interface StudentRegItem {
  student_id: Id
  student_fio: string
}

/** Registration table row from registraciya_full(4) */
export interface RegistraciyaTableRow {
  student_id: Id
  student_fio: string
  l_fio: string | null
  pz_fio: string | null
  lz_fio: string | null
  srs_fio: string | null
  srsp_fio: string | null
  fz_fio: string | null
  lpz_fio: string | null
}

interface GruppaBySpecArgs {
  id_spec: Id
  id_god: Id
  id_forma_obuch: Id
}

interface DisciplinaListArgs {
  id_kontingent: Id
  id_semestr: Id
  id_kurs?: Id | null
}

interface VidZanyatiyaArgs {
  id_plan: Id
}

interface StudentListArgs {
  id_gruppa: Id
}

interface RegistraciyaTableArgs {
  id_plan: Id
  id_gruppa: Id
}

interface SaveRegistraciyaArgs {
  id_plan_vid_zanyatiya: Id
  id_sotrudnik: Id
  id_plan: Id
  id_otdelenie: Id
  student_ids: Id[]
}

interface DeleteRegistraciyaArgs {
  id_plan_vid_zanyatiya: Id
  student_ids: Id[]
}

export const registraciyaApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /registraciya - page data with dropdown lists (through apiCompat)
    registraciyaPage: build.query<PageResponse<RegistraciyaPageData>, void>({
      query: () => '/registraciya',
      providesTags: ['Registraciya'],
    }),

    // POST /registraciya/gruppa - get groups by spec/god/forma_obuch
    registraciyaGruppa: build.query<LegacyResponse<GruppaRegItem[]>, GruppaBySpecArgs>({
      query: (body) => ({ url: '/registraciya/gruppa', method: 'POST', body }),
    }),

    // POST /registraciya/disciplina - get disciplines for a kontingent and semestr
    registraciyaDisciplina: build.query<LegacyResponse<DisciplinaPlanItem[]>, DisciplinaListArgs>({
      query: (body) => ({ url: '/registraciya/disciplina', method: 'POST', body }),
    }),

    // POST /registraciya/vid_zanyatiya - get vid zanyatiya for a plan
    registraciyaVidZanyatiya: build.query<LegacyResponse<VidZanyatiyaItem[]>, VidZanyatiyaArgs>({
      query: (body) => ({ url: '/registraciya/vid_zanyatiya', method: 'POST', body }),
    }),

    // POST /registraciya/students - get students by gruppa
    registraciyaStudents: build.query<LegacyResponse<StudentRegItem[]>, StudentListArgs>({
      query: (body) => ({ url: '/registraciya/students', method: 'POST', body }),
    }),

    // POST /registraciya/table - get registration table with assigned teachers
    registraciyaTable: build.query<LegacyResponse<RegistraciyaTableRow[]>, RegistraciyaTableArgs>({
      query: (body) => ({ url: '/registraciya/table', method: 'POST', body }),
    }),

    // POST /registraciya/save - save registration
    saveRegistraciya: build.mutation<LegacyResponse, SaveRegistraciyaArgs>({
      query: (body) => ({ url: '/registraciya/save', method: 'POST', body }),
      invalidatesTags: ['Registraciya'],
    }),

    // POST /registraciya/delete - delete registration
    deleteRegistraciya: build.mutation<LegacyResponse, DeleteRegistraciyaArgs>({
      query: (body) => ({ url: '/registraciya/delete', method: 'POST', body }),
      invalidatesTags: ['Registraciya'],
    }),
  }),
})

export const {
  useRegistraciyaPageQuery,
  useRegistraciyaGruppaQuery,
  useRegistraciyaDisciplinaQuery,
  useRegistraciyaVidZanyatiyaQuery,
  useRegistraciyaStudentsQuery,
  useRegistraciyaTableQuery,
  useSaveRegistraciyaMutation,
  useDeleteRegistraciyaMutation,
} = registraciyaApi
