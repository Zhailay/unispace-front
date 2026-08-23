import { baseApi } from '@/app/api/baseApi'
import type { Id, PageResponse } from '@/shared/types/api'

/**
 * Semester item for cascade dropdown
 */
export interface SemestrItem {
  semestr_id: Id
  semestr_nomer: string
}

/**
 * Test type (hardcoded on backend, no table)
 */
export interface TestType {
  id: number
  name: string
}

/**
 * Discipline/Group item from jurnal_gruppa_spisok (reused by test_upload)
 */
export interface DisciplinaItem {
  plan_id: Id
  disciplina_id: Id
  gruppa_id: Id
  kalendar_id: Id
  gruppa_disciplina_name: string
}

/**
 * Test row from test_list_by_sotrudnik
 */
export interface TestRow {
  test_id: Id
  disciplina_name: string
  yazyk_name: string
  id_nedelya: number
  test_type: string
  questions_count: number
}

/**
 * Page data from GET /test-upload (via apiCompat)
 */
export interface TestUploadPageData {
  semestr_list: SemestrItem[]
  test_types: TestType[]
  tests: TestRow[]
}

/**
 * Parse result from POST /test-upload/parse
 */
export interface ParseResult {
  ok: boolean
  total: number
  correct: number
  incorrect: number
  redirect: string
  error?: string
}

/**
 * Preview question (correct/incorrect) from session
 */
export interface PreviewQuestion {
  html: string
  answers: PreviewAnswer[]
  errorReason?: string
}

export interface PreviewAnswer {
  html: string
  isTrue: boolean
}

/**
 * Preview data from GET /test-upload/preview (via apiCompat)
 */
export interface PreviewPageData {
  correct: PreviewQuestion[]
  incorrect: PreviewQuestion[]
  total: number
}

/**
 * Question row from paginated endpoint
 */
export interface QuestionRow {
  test_question_id: Id
  test_question_value: string
  test_question_status: number
  answers: AnswerRow[]
}

export interface AnswerRow {
  test_answer_id: Id
  test_answer_value: string
  test_answer_status: number
}

/**
 * Paginated questions response
 */
export interface QuestionsPaginatedResponse {
  questions: QuestionRow[]
  total: number
  totalActive: number
  totalDisabled: number
  filteredTotal: number
  page: number
  totalPages: number
}

/**
 * Raspisanie (schedule) row
 */
export interface RaspisanieRow {
  raspisanie_id: Id
  gruppa_name: string
  start: string
}

// Request types
interface DisciplinesArgs {
  id_semestr: Id
}

interface QuestionsArgs {
  id_test: Id
  page?: number
  limit?: number
  status?: 'all' | 'active' | 'disabled'
  search?: string
}

interface ToggleQuestionArgs {
  id: Id
  status: number
}

interface UpdateQuestionArgs {
  id: Id
  value: string
}

interface UpdateAnswerArgs {
  id: Id
  value?: string
  status?: number
}

interface ConvertFormulaArgs {
  rtf: string
}

interface SaveConfigArgs {
  id_test: Id
  max_minute: number
  max_question: number
}

interface SaveRaspisanieArgs {
  id_test: Id
  id_plan: Id
  id_gruppa_student: Id
  start: string
}

export const testUploadApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // GET /test-upload - page data with test list
    testUploadPage: build.query<PageResponse<TestUploadPageData>, void>({
      query: () => '/test-upload',
      providesTags: ['Test'],
    }),

    // POST /test-upload/disciplines - get disciplines for semester cascade
    testUploadDisciplines: build.query<DisciplinaItem[], DisciplinesArgs>({
      query: (body) => ({ url: '/test-upload/disciplines', method: 'POST', body }),
    }),

    // GET /test-upload/preview - preview parsed questions from session
    testUploadPreview: build.query<PageResponse<PreviewPageData>, void>({
      query: () => '/test-upload/preview',
    }),

    // POST /test-upload/save - save parsed test to DB
    testUploadSave: build.mutation<{ ok: boolean; testId?: Id } | { error: string }, void>({
      query: () => ({ url: '/test-upload/save', method: 'POST' }),
      invalidatesTags: ['Test'],
    }),

    // GET /test-upload/manage/:id/questions - paginated questions
    testQuestionsPaginated: build.query<QuestionsPaginatedResponse, QuestionsArgs>({
      query: ({ id_test, page = 1, limit = 25, status = 'all', search = '' }) => ({
        url: `/test-upload/manage/${id_test}/questions`,
        params: { page, limit, status, search },
      }),
      providesTags: ['Test'],
    }),

    // POST /test-upload/question/toggle - toggle question active/disabled
    toggleQuestion: build.mutation<{ ok: boolean }, ToggleQuestionArgs>({
      query: (body) => ({ url: '/test-upload/question/toggle', method: 'POST', body }),
      invalidatesTags: ['Test'],
    }),

    // POST /test-upload/question/update - update question text
    updateQuestion: build.mutation<{ ok: boolean }, UpdateQuestionArgs>({
      query: (body) => ({ url: '/test-upload/question/update', method: 'POST', body }),
      invalidatesTags: ['Test'],
    }),

    // POST /test-upload/answer/update - update answer text and/or status
    updateAnswer: build.mutation<{ ok: boolean }, UpdateAnswerArgs>({
      query: (body) => ({ url: '/test-upload/answer/update', method: 'POST', body }),
      invalidatesTags: ['Test'],
    }),

    // POST /test-upload/convert-formula - convert RTF formula to HTML
    convertFormula: build.mutation<{ ok: boolean; html: string }, ConvertFormulaArgs>({
      query: (body) => ({ url: '/test-upload/convert-formula', method: 'POST', body }),
    }),

    // DELETE /test-upload/:id - delete test
    deleteTest: build.mutation<{ ok: boolean }, Id>({
      query: (id) => ({ url: `/test-upload/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Test'],
    }),

    // POST /test-upload/config/:id - save test config
    saveTestConfig: build.mutation<{ ok: boolean }, SaveConfigArgs>({
      query: ({ id_test, ...body }) => ({ url: `/test-upload/config/${id_test}`, method: 'POST', body }),
    }),

    // GET /test-upload/raspisanie/:id - list raspisanie
    testRaspisanie: build.query<RaspisanieRow[], Id>({
      query: (id) => `/test-upload/raspisanie/${id}`,
    }),

    // POST /test-upload/raspisanie/:id - save raspisanie
    saveTestRaspisanie: build.mutation<{ ok: boolean; id: Id }, SaveRaspisanieArgs>({
      query: ({ id_test, ...body }) => ({ url: `/test-upload/raspisanie/${id_test}`, method: 'POST', body }),
    }),
  }),
})

export const {
  useTestUploadPageQuery,
  useTestUploadDisciplinesQuery,
  useTestUploadPreviewQuery,
  useTestUploadSaveMutation,
  useTestQuestionsPaginatedQuery,
  useToggleQuestionMutation,
  useUpdateQuestionMutation,
  useUpdateAnswerMutation,
  useConvertFormulaMutation,
  useDeleteTestMutation,
  useSaveTestConfigMutation,
  useTestRaspisanieQuery,
  useSaveTestRaspisanieMutation,
} = testUploadApi
