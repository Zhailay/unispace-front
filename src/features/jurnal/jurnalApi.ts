import { baseApi } from '@/app/api/baseApi'
import type { Id, PageResponse, SpisokRow } from '@/shared/types/api'

/**
 * Semester item from semestr table
 */
export interface SemestrItem extends SpisokRow {
  semestr_id: Id
  semestr_nomer: string
}

/**
 * Day item from den_spisok procedure
 */
export interface DenItem extends SpisokRow {
  den_id: Id
  den_nomer: number
  den_short: string
}

/**
 * Discipline + Group item for journal list (jurnal_gruppa_spisok)
 * Used in TK, R1, R2, Exam tabs
 */
export interface JurnalGruppaItem {
  plan_id: Id
  gruppa_id: Id
  kalendar_id: Id
  gruppa_disciplina_name: string
}

/**
 * Available week from jurnal_nedelya_dostupnye procedure
 */
export interface AvailableWeek {
  week_number: number
  week_start: string
  week_end: string
  is_current: boolean
  is_vneplan: boolean
}

/**
 * Student row from jurnal_student_list procedure
 * Contains grade data for each vid zanyatiya (LK, PZ, LZ, etc.)
 */
export interface JurnalStudentRow {
  student_id: Id
  fio: string
  // Each vid zanyatiya has these 4 fields
  ps_id_lk: Id | null
  chasy_lk: number | null
  ball_lk: number | null
  komment_lk: string | null
  propusk_lk: number | null
  ps_id_pz: Id | null
  chasy_pz: number | null
  ball_pz: number | null
  komment_pz: string | null
  propusk_pz: number | null
  ps_id_lz: Id | null
  chasy_lz: number | null
  ball_lz: number | null
  komment_lz: string | null
  propusk_lz: number | null
  ps_id_srs: Id | null
  chasy_srs: number | null
  ball_srs: number | null
  komment_srs: string | null
  propusk_srs: number | null
  ps_id_srsp: Id | null
  chasy_srsp: number | null
  ball_srsp: number | null
  komment_srsp: string | null
  propusk_srsp: number | null
  ps_id_fz: Id | null
  chasy_fz: number | null
  ball_fz: number | null
  komment_fz: string | null
  propusk_fz: number | null
  ps_id_lpz: Id | null
  chasy_lpz: number | null
  ball_lpz: number | null
  komment_lpz: string | null
  propusk_lpz: number | null
  // Totals
  propusk_week: number | null
  propusk_total: number | null
  // For vneplan weeks
  spravka_plan_ids: Id[] | null
}

/**
 * R1/R2 student row with weekly averages
 */
export interface JurnalRatingRow {
  student_id: Id
  fio: string
  week_num: number
  /**
   * Средний балл. Тип НЕ number: это AVG() из PostgreSQL, то есть numeric,
   * а драйвер pg отдаёт numeric строкой ("4.50") — ровно как bigint
   * (см. комментарий к Id в shared/types/api.ts). Перед арифметикой
   * обязательно приводить через Number(), иначе .toFixed() падает.
   */
  avg_ball: number | string | null
  r1_weeks: number
  r2_start?: number
  r2_weeks?: number
}

/**
 * Week detail row (modal)
 */
export interface WeekDetailRow {
  den_name: string | null
  vid_short: string | null
  jurnal_ball: number | null
  sotrudnik_fio: string | null
  jurnal_data: string | null
}

/**
 * Exam/IA student row
 */
export interface ExamStudentRow {
  ps_id: Id
  fio: string
  jurnal_ball: number | null
  is_locked?: boolean
}

/**
 * Kalendar itog result
 */
export interface KalendarItog {
  period_nachalo: string
  period_konec: string
}

/**
 * Page data from GET /jurnal
 */
export interface JurnalPageData {
  semestr_list: SemestrItem[]
  den_list: DenItem[]
}

/**
 * Grade entry for saving
 */
export interface GradeEntry {
  id_plan_student: Id
  id_nedelya: number
  jurnal_ball: number | null
  id_den: number
  jurnal_propusk: number
  jurnal_komment: string | null
}

interface TkListArgs {
  id_semestr: Id
}

interface StudentListArgs {
  plan_id: Id
  gruppa_id: Id
  id_nedelya: number | null
  id_den: number | null
}

interface AvailableWeeksArgs {
  kalendar_id: Id
  plan_id: Id
  gruppa_id: Id
}

interface RatingArgs {
  plan_id: Id
  gruppa_id: Id
}

interface WeekDetailArgs {
  student_id: Id
  plan_id: Id
  week_num: number
}

interface ExamStudentArgs {
  plan_id: Id
  gruppa_id: Id
  jurnal_type?: number
  kalendar_id?: Id
}

interface KalendarItogArgs {
  kalendar_id: Id
}

interface SaveGradesArgs {
  grades: GradeEntry[]
  jurnal_type?: number
}

export const jurnalApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /jurnal - page data (through apiCompat)
    jurnalPage: build.query<PageResponse<JurnalPageData>, void>({
      query: () => '/jurnal',
      providesTags: ['Jurnal'],
    }),

    // POST /jurnal/tk - get discipline+group list for TK tab
    jurnalTkList: build.query<JurnalGruppaItem[], TkListArgs>({
      query: (body) => ({ url: '/jurnal/tk', method: 'POST', body }),
    }),

    // POST /jurnal/praktika - get discipline+group list for praktika tab
    jurnalPraktikaList: build.query<JurnalGruppaItem[], TkListArgs>({
      query: (body) => ({ url: '/jurnal/praktika', method: 'POST', body }),
    }),

    // POST /jurnal/itog - get discipline+group list for itog tab
    jurnalItogList: build.query<JurnalGruppaItem[], TkListArgs>({
      query: (body) => ({ url: '/jurnal/itog', method: 'POST', body }),
    }),

    // POST /jurnal/nedelya-dostupnye - get available weeks for a plan+gruppa
    jurnalAvailableWeeks: build.query<AvailableWeek[], AvailableWeeksArgs>({
      query: (body) => ({ url: '/jurnal/nedelya-dostupnye', method: 'POST', body }),
    }),

    // POST /jurnal/students - get student list with grades for a week/day
    jurnalStudents: build.query<JurnalStudentRow[], StudentListArgs>({
      query: (body) => ({ url: '/jurnal/students', method: 'POST', body }),
      providesTags: ['Jurnal'],
    }),

    // POST /jurnal/r1-students - get R1 rating table
    jurnalR1Students: build.query<JurnalRatingRow[], RatingArgs>({
      query: (body) => ({ url: '/jurnal/r1-students', method: 'POST', body }),
    }),

    // POST /jurnal/r2-students - get R2 rating table
    jurnalR2Students: build.query<JurnalRatingRow[], RatingArgs>({
      query: (body) => ({ url: '/jurnal/r2-students', method: 'POST', body }),
    }),

    // POST /jurnal/week-detail - get detail for a student's week
    jurnalWeekDetail: build.query<WeekDetailRow[], WeekDetailArgs>({
      query: (body) => ({ url: '/jurnal/week-detail', method: 'POST', body }),
    }),

    // POST /jurnal/exam-students - get exam/IA student list
    jurnalExamStudents: build.query<ExamStudentRow[], ExamStudentArgs>({
      query: (body) => ({ url: '/jurnal/exam-students', method: 'POST', body }),
      providesTags: ['Jurnal'],
    }),

    // POST /jurnal/kalendar-itog - get itog period dates
    jurnalKalendarItog: build.query<KalendarItog | null, KalendarItogArgs>({
      query: (body) => ({ url: '/jurnal/kalendar-itog', method: 'POST', body }),
    }),

    // POST /jurnal/save - save grades batch
    saveJurnalGrades: build.mutation<{ ok: boolean }, SaveGradesArgs>({
      query: (body) => ({ url: '/jurnal/save', method: 'POST', body }),
      invalidatesTags: ['Jurnal'],
    }),
  }),
})

export const {
  useJurnalPageQuery,
  useJurnalTkListQuery,
  useJurnalPraktikaListQuery,
  useJurnalItogListQuery,
  useJurnalAvailableWeeksQuery,
  useJurnalStudentsQuery,
  useJurnalR1StudentsQuery,
  useJurnalR2StudentsQuery,
  useJurnalWeekDetailQuery,
  useJurnalExamStudentsQuery,
  useJurnalKalendarItogQuery,
  useSaveJurnalGradesMutation,
} = jurnalApi
