import { baseApi } from '@/app/api/baseApi'
import type { Id, PageResponse } from '@/shared/types/api'
import type { Lang } from '@/shared/i18n/lang'

// ==================== Departments ====================

/**
 * Department row from backend. Fields mapped by DepartmentsProcedures._mapRow.
 * id, kz, ru, en, nomer, secondId, vidId, status, code
 */
export interface DepartmentRow {
  id: Id
  kz: string
  ru: string
  en: string
  nomer: number | null
  secondId: Id
  vidId: Id
  status: boolean
  code?: number | null
  // Populated by controller
  vidName?: string
  parentName?: string
}

export interface DepartmentTree {
  roots: DepartmentRow[]
  orphans: DepartmentRow[]
}

export interface DepartmentsPageData {
  departments: DepartmentRow[]
  treeJson: string
  allDepartments: DepartmentRow[]
  vidList: VidPodrazdelenieRow[]
  meta: { total: number; active: number }
  search: string | null
}

export interface VidPodrazdelenieRow {
  id: Id
  kz: string
  ru: string
  en: string
}

export interface DepartmentInput {
  name_kz: string
  name_ru: string
  name_en: string
  type_id?: string
  parent_id?: string
  order?: string
  is_active?: 'on' | ''
}

export function departmentName(row: DepartmentRow, lang: Lang): string {
  if (lang === 'kk') return row.kz
  if (lang === 'en') return row.en
  return row.ru
}

export function vidName(row: VidPodrazdelenieRow, lang: Lang): string {
  if (lang === 'kk') return row.kz
  if (lang === 'en') return row.en
  return row.ru
}

// ==================== Positions ====================

/**
 * Position row from backend. Fields mapped by PositionsProcedures._mapRow.
 */
export interface PositionRow {
  id: Id
  kz: string
  ru: string
  en: string
  vidPersonalId: Id
  code?: number | null
  // Populated by controller
  vidPersonalName?: string
}

export interface PositionsPageData {
  positions: PositionRow[]
  vidPersonalList: VidPersonalRow[]
  meta: { total: number }
  search: string | null
}

export interface VidPersonalRow {
  id: Id
  kz: string
  ru: string
  en: string
}

export interface PositionInput {
  name_kz: string
  name_ru: string
  name_en: string
  staff_type_id?: string
}

export function positionName(row: PositionRow, lang: Lang): string {
  if (lang === 'kk') return row.kz
  if (lang === 'en') return row.en
  return row.ru
}

// ==================== Employees ====================

/**
 * Employee row from backend. Fields mapped by EmployeesProcedures._mapRow.
 */
export interface EmployeeRow {
  id: Id
  podrazdelenieId: Id
  doljnostId: Id
  shtatnostId: Id
  sotrudnikId: Id
  formaZamescheniyaId: Id
  status: boolean
  iin: string
  familiya: string
  imya: string
  otchestvo: string | null
  code?: number | null
  // Populated by controller
  podrazdelenieName?: string
  doljnostName?: string
  formaZamescheniyaName?: string
  shtatnostName?: string
}

export interface EmployeesPageData {
  employees: EmployeeRow[]
  departments: DepartmentRow[]
  positions: PositionRow[]
  formaList: FormaZamescheniyaRow[]
  shtatnostList: ShtatnostRow[]
  meta: { total: number; active: number }
  search: string | null
}

export interface FormaZamescheniyaRow {
  id: Id
  kz: string
  ru: string
  en: string
}

export interface ShtatnostRow {
  id: Id
  kz: string
  ru: string
  en: string
}

export interface EmployeeInput {
  iin: string
  lastname: string
  firstname: string
  middlename?: string
  department_id?: string
  position_id?: string
  replacement_form_id?: string
  staffing_id?: string
  is_active?: 'on' | ''
}

// ==================== API Responses ====================

interface KadrMutationResponse {
  ok: boolean
  code?: number
  message?: string
}

// ==================== API Endpoints ====================

export const kadrApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ---------- Departments ----------
    departmentsPage: build.query<PageResponse<DepartmentsPageData>, { search?: string }>({
      query: ({ search }) => ({
        url: '/kadr/departments',
        params: search ? { search } : undefined,
      }),
      providesTags: ['Department'],
    }),

    createDepartment: build.mutation<KadrMutationResponse, DepartmentInput>({
      query: (body) => ({ url: '/kadr/departments', method: 'POST', body }),
      invalidatesTags: ['Department'],
    }),

    updateDepartment: build.mutation<KadrMutationResponse, DepartmentInput & { id: Id }>({
      query: ({ id, ...body }) => ({
        url: `/kadr/departments/${id}/update`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Department'],
    }),

    deleteDepartment: build.mutation<KadrMutationResponse, Id>({
      query: (id) => ({ url: `/kadr/departments/${id}/delete`, method: 'POST' }),
      invalidatesTags: ['Department'],
    }),

    // ---------- Positions ----------
    positionsPage: build.query<PageResponse<PositionsPageData>, { search?: string }>({
      query: ({ search }) => ({
        url: '/kadr/positions',
        params: search ? { search } : undefined,
      }),
      providesTags: ['Position'],
    }),

    createPosition: build.mutation<KadrMutationResponse, PositionInput>({
      query: (body) => ({ url: '/kadr/positions', method: 'POST', body }),
      invalidatesTags: ['Position'],
    }),

    updatePosition: build.mutation<KadrMutationResponse, PositionInput & { id: Id }>({
      query: ({ id, ...body }) => ({
        url: `/kadr/positions/${id}/update`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Position'],
    }),

    deletePosition: build.mutation<KadrMutationResponse, Id>({
      query: (id) => ({ url: `/kadr/positions/${id}/delete`, method: 'POST' }),
      invalidatesTags: ['Position'],
    }),

    // ---------- Employees ----------
    employeesPage: build.query<PageResponse<EmployeesPageData>, { search?: string }>({
      query: ({ search }) => ({
        url: '/kadr/employees',
        params: search ? { search } : undefined,
      }),
      providesTags: ['Employee'],
    }),

    createEmployee: build.mutation<KadrMutationResponse, EmployeeInput>({
      query: (body) => ({ url: '/kadr/employees', method: 'POST', body }),
      invalidatesTags: ['Employee'],
    }),

    updateEmployee: build.mutation<KadrMutationResponse, EmployeeInput & { id: Id }>({
      query: ({ id, ...body }) => ({
        url: `/kadr/employees/${id}/update`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Employee'],
    }),

    deleteEmployee: build.mutation<KadrMutationResponse, Id>({
      query: (id) => ({ url: `/kadr/employees/${id}/delete`, method: 'POST' }),
      invalidatesTags: ['Employee'],
    }),
  }),
})

export const {
  useDepartmentsPageQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  usePositionsPageQuery,
  useCreatePositionMutation,
  useUpdatePositionMutation,
  useDeletePositionMutation,
  useEmployeesPageQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} = kadrApi
