import { baseApi } from '@/app/api/baseApi'
import type { Id, LegacyResponse, PageResponse, SpisokRow } from '@/shared/types/api'

/**
 * Row from public.student_full(4, ...).
 * Fields verified against students.hbs template data-attributes.
 */
export interface StudentRow {
  out_code: number | null
  out_student_id: Id
  out_student_iin: string
  out_student_familiya: string
  out_student_imya: string
  out_student_otchestvo: string
  out_student_email: string | null
  out_student_password_login: string | null
  out_gruppa_student_status: number | null
  out_id_gruppa: Id | null
  out_id_kurs: Id | null
  out_id_god: Id | null
  out_id_spec: Id | null
  out_id_forma_obuch: Id | null
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

export interface GruppaSpisokItem extends SpisokRow {
  gruppa_id: Id
  gruppa_name: string
}

/** Page data returned by GET /students (through apiCompat) */
export interface StudentsPageData {
  spec_list: SpecItem[]
  forma_obuch_list: FormaObuchItem[]
  god_list: GodItem[]
  kurs_list: KursItem[]
}

export interface StudentInput {
  student_imya: string
  student_otchestvo: string
  student_familiya: string
  student_iin: string
  student_email: string
  student_password: string
  id_gruppa: Id
  id_kurs: Id
  gruppa_student_status: number
}

export interface StudentUpdateInput {
  student_id: Id
  student_imya: string
  student_otchestvo: string
  student_familiya: string
  student_iin: string
  student_email: string
  id_gruppa: Id
  id_kurs: Id
  gruppa_student_status: number
}

export interface ChangePasswordInput {
  student_id: Id
  student_password_value: string
}

export interface GroupsFilterInput {
  id_god: Id
  id_spec: Id
  id_forma_obuch: Id
}

interface ListArgs {
  search?: string
  limit?: number
  offset?: number
}

export const studentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /students - page data with dropdown lists (through apiCompat)
    studentsPage: build.query<PageResponse<StudentsPageData>, void>({
      query: () => '/students',
      providesTags: ['Student'],
    }),

    // POST /students/tb - list with search, pagination
    studentsList: build.query<LegacyResponse<StudentRow[]>, ListArgs>({
      query: (body) => ({ url: '/students/tb', method: 'POST', body }),
      providesTags: ['Student'],
    }),

    // POST /students/groups - get groups filtered by god, spec, forma_obuch
    studentsGroups: build.query<LegacyResponse<GruppaSpisokItem[]>, GroupsFilterInput>({
      query: (body) => ({ url: '/students/groups', method: 'POST', body }),
    }),

    // POST /students/insert - create student
    createStudent: build.mutation<LegacyResponse<{ login?: string }>, StudentInput>({
      query: (body) => ({ url: '/students/insert', method: 'POST', body }),
      invalidatesTags: ['Student'],
    }),

    // PUT /students - update student
    updateStudent: build.mutation<LegacyResponse, StudentUpdateInput>({
      query: (body) => ({ url: '/students', method: 'PUT', body }),
      invalidatesTags: ['Student'],
    }),

    // DELETE /students - delete student
    deleteStudent: build.mutation<LegacyResponse, Id>({
      query: (student_id) => ({ url: '/students', method: 'DELETE', body: { student_id } }),
      invalidatesTags: ['Student'],
    }),

    // POST /students/change_password - change student password
    changeStudentPassword: build.mutation<LegacyResponse, ChangePasswordInput>({
      query: (body) => ({ url: '/students/change_password', method: 'POST', body }),
      invalidatesTags: ['Student'],
    }),
  }),
})

export const {
  useStudentsPageQuery,
  useStudentsListQuery,
  useStudentsGroupsQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  useChangeStudentPasswordMutation,
} = studentsApi
