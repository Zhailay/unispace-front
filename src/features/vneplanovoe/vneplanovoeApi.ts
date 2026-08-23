import { baseApi } from '@/app/api/baseApi'
import type { Id, PageResponse } from '@/shared/types/api'

/**
 * Semester item from semestr table
 */
export interface SemestrItem {
  semestr_id: Id
  semestr_nomer: string
}

/**
 * Day item from den_spisok procedure
 */
export interface DenItem {
  den_id: Id
  den_nomer: number
  den_short: string
}

/**
 * Page data from GET /vneplanovoe (through apiCompat)
 */
export interface VneplanovoePageData {
  semestr_list: SemestrItem[]
  den_list: DenItem[]
}

/**
 * Discipline + Group item for theoretical list (jurnal_gruppa_spisok_vneplan_teoret)
 */
export interface VneplanovoeTeorItem {
  kalendar_id: Id
  plan_id: Id
  gruppa_id: Id
  gruppa_disciplina_name: string
}

/**
 * Week item from jurnal_nedelya_spisok
 */
export interface NedelyaItem {
  week_number: number
  week_start: string
  week_end: string
}

/**
 * Vid zanyatiya item from vid_zanyatiya_spisok_vneplan_teoret
 */
export interface VidZanyatiyaItem {
  plan_sotrudnik_id: Id
  vid_zanyatiya_name: string
}

/**
 * Student row for vneplan teoret (jurnal_student_spisok_vneplan_teoret)
 */
export interface VneplanovoeStudentRow {
  student_id: Id
  plan_student_id: Id
  student_fio: string
  spravka_nachalo: string | null
  spravka_konec: string | null
}

/**
 * Student row for vneplan exam (jurnal_student_spisok_vneplan_ekzamen)
 */
export interface VneplanovoeExamStudentRow {
  student_id: Id
  plan_student_id: Id
  student_fio: string
  spravka_nachalo: string | null
  spravka_konec: string | null
}

// Request types
interface TeorListArgs {
  id_semestr: Id
}

interface ExamListArgs {
  id_semestr: Id
}

interface NedelyaSpisokArgs {
  kalendar_id: Id
}

interface VidZanyatiyaArgs {
  plan_id: Id
}

interface StudentsArgs {
  gruppa_id: Id
  plan_sotrudnik_id: Id
  id_nedelya: number | null
  id_den: number | null
}

interface ExamStudentsArgs {
  gruppa_id: Id
  plan_id: Id
}

interface SaveSpravkaArgs {
  plan_student_ids: Id[]
  id_nedelya: number
  id_den: number
  nachalo_list: string[]
  konec_list: string[]
}

interface DeleteSpravkaArgs {
  plan_student_ids: Id[]
  id_nedelya: number
  id_den: number
}

interface SaveExamSpravkaArgs {
  plan_student_ids: Id[]
  nachalo_list: string[]
  konec_list: string[]
}

export const vneplanovoeApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /vneplanovoe - page data (through apiCompat)
    vneplanovoePage: build.query<PageResponse<VneplanovoePageData>, void>({
      query: () => '/vneplanovoe',
      providesTags: ['Vneplanovoe'],
    }),

    // POST /vneplanovoe/list - get discipline+group list for theoretical tab
    vneplanovoeTeorList: build.query<VneplanovoeTeorItem[], TeorListArgs>({
      query: (body) => ({ url: '/vneplanovoe/list', method: 'POST', body }),
    }),

    // POST /vneplanovoe/exam-list - get discipline+group list for exam tab
    vneplanovoeExamList: build.query<VneplanovoeTeorItem[], ExamListArgs>({
      query: (body) => ({ url: '/vneplanovoe/exam-list', method: 'POST', body }),
    }),

    // POST /vneplanovoe/nedelya-spisok - get available weeks for a kalendar
    vneplanovoeNedelyaSpisok: build.query<NedelyaItem[], NedelyaSpisokArgs>({
      query: (body) => ({ url: '/vneplanovoe/nedelya-spisok', method: 'POST', body }),
    }),

    // POST /vneplanovoe/vid-zanyatiya - get vid zanyatiya list for a plan
    vneplanovoeVidZanyatiya: build.query<VidZanyatiyaItem[], VidZanyatiyaArgs>({
      query: (body) => ({ url: '/vneplanovoe/vid-zanyatiya', method: 'POST', body }),
    }),

    // POST /vneplanovoe/students - get students for theoretical tab
    vneplanovoeStudents: build.query<VneplanovoeStudentRow[], StudentsArgs>({
      query: (body) => ({ url: '/vneplanovoe/students', method: 'POST', body }),
      providesTags: ['Vneplanovoe'],
    }),

    // POST /vneplanovoe/exam-students-vn - get students for exam tab
    vneplanovoeExamStudents: build.query<VneplanovoeExamStudentRow[], ExamStudentsArgs>({
      query: (body) => ({ url: '/vneplanovoe/exam-students-vn', method: 'POST', body }),
      providesTags: ['Vneplanovoe'],
    }),

    // POST /vneplanovoe/save - save spravka for theoretical
    saveVneplanovoeSpravka: build.mutation<{ ok: boolean }, SaveSpravkaArgs>({
      query: (body) => ({ url: '/vneplanovoe/save', method: 'POST', body }),
      invalidatesTags: ['Vneplanovoe'],
    }),

    // POST /vneplanovoe/delete-spravka - delete spravka
    deleteVneplanovoeSpravka: build.mutation<{ ok: boolean }, DeleteSpravkaArgs>({
      query: (body) => ({ url: '/vneplanovoe/delete-spravka', method: 'POST', body }),
      invalidatesTags: ['Vneplanovoe'],
    }),

    // POST /vneplanovoe/save-exam - save spravka for exam
    saveVneplanovoeExamSpravka: build.mutation<{ ok: boolean }, SaveExamSpravkaArgs>({
      query: (body) => ({ url: '/vneplanovoe/save-exam', method: 'POST', body }),
      invalidatesTags: ['Vneplanovoe'],
    }),
  }),
})

export const {
  useVneplanovoePageQuery,
  useVneplanovoeTeorListQuery,
  useVneplanovoeExamListQuery,
  useVneplanovoeNedelyaSpisokQuery,
  useVneplanovoeVidZanyatiyaQuery,
  useVneplanovoeStudentsQuery,
  useVneplanovoeExamStudentsQuery,
  useSaveVneplanovoeSpravkaMutation,
  useDeleteVneplanovoeSpravkaMutation,
  useSaveVneplanovoeExamSpravkaMutation,
} = vneplanovoeApi
