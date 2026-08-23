import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  useTestQuestionsPaginatedQuery,
  useToggleQuestionMutation,
  useUpdateQuestionMutation,
  useUpdateAnswerMutation,
  useConvertFormulaMutation,
  type AnswerRow,
} from '@/features/testUpload/testUploadApi'
import { useT } from '@/shared/i18n/useT'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import Button from '@/shared/ui/Button'
import Spinner from '@/shared/ui/Spinner'
import Pagination from '@/shared/ui/Pagination'
import type { Id } from '@/shared/types/api'

type FilterStatus = 'all' | 'active' | 'disabled'

const PAGE_SIZE = 25

/**
 * TestManagePage: Manage questions for an uploaded test.
 * Matches behavior from unispace/src/views/ucheb/test_upload/manage.hbs (393 lines)
 *
 * Features:
 * - Paginated list of questions with search and filter
 * - Toggle question active/disabled
 * - Edit question and answer text (contenteditable)
 * - Paste images and RTF formulas via clipboard
 * - Toggle answer correct/incorrect
 */
export default function TestManagePage() {
  const t = useT()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const testId = id ?? ''

  // Filters
  const [page, setPage] = useState(1)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [searchInput, setSearchInput] = useState('')
  const searchQuery = useDebouncedValue(searchInput, 500)

  // Reset page when filter/search changes
  useEffect(() => {
    setPage(1)
  }, [filterStatus, searchQuery])

  // Fetch questions
  const { data, isLoading, isFetching, refetch } = useTestQuestionsPaginatedQuery(
    { id_test: testId, page, limit: PAGE_SIZE, status: filterStatus, search: searchQuery },
    { skip: !testId },
  )

  // Mutations
  const [toggleQuestion] = useToggleQuestionMutation()
  const [updateQuestion] = useUpdateQuestionMutation()
  const [updateAnswer] = useUpdateAnswerMutation()
  const [convertFormula] = useConvertFormulaMutation()

  // Editing state
  const [editingQuestionId, setEditingQuestionId] = useState<Id | null>(null)
  const [editingAnswerId, setEditingAnswerId] = useState<Id | null>(null)
  const questionRefs = useRef<Map<Id, HTMLDivElement>>(new Map())
  const answerRefs = useRef<Map<Id, HTMLDivElement>>(new Map())
  const originalContent = useRef<Map<Id, string>>(new Map())

  const questions = data?.questions ?? []
  const totalPages = data?.totalPages ?? 1

  // Filter buttons
  const filterButtons: { status: FilterStatus; label: string; variant: 'secondary' | 'success' | 'danger' }[] = [
    { status: 'all', label: t('test_upload.filter_all'), variant: 'secondary' },
    { status: 'active', label: t('test_upload.question_active'), variant: 'success' },
    { status: 'disabled', label: t('test_upload.question_inactive'), variant: 'danger' },
  ]

  // Toggle question
  const handleToggleQuestion = async (questionId: Id, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1
    try {
      await toggleQuestion({ id: questionId, status: newStatus }).unwrap()
      refetch()
    } catch {
      dispatch(toastPushed('error', t('common.error')))
    }
  }

  // Start editing question
  const startEditQuestion = (questionId: Id) => {
    const el = questionRefs.current.get(questionId)
    if (el) {
      originalContent.current.set(questionId, el.innerHTML)
      setEditingQuestionId(questionId)
      el.focus()
    }
  }

  // Save question
  const saveQuestion = async (questionId: Id) => {
    const el = questionRefs.current.get(questionId)
    if (!el) return

    try {
      await updateQuestion({ id: questionId, value: el.innerHTML }).unwrap()
      originalContent.current.delete(questionId)
      setEditingQuestionId(null)
    } catch {
      dispatch(toastPushed('error', t('common.error')))
    }
  }

  // Cancel editing question
  const cancelEditQuestion = (questionId: Id) => {
    const el = questionRefs.current.get(questionId)
    const original = originalContent.current.get(questionId)
    if (el && original !== undefined) {
      el.innerHTML = original
    }
    originalContent.current.delete(questionId)
    setEditingQuestionId(null)
  }

  // Start editing answer
  const startEditAnswer = (answerId: Id) => {
    const el = answerRefs.current.get(answerId)
    if (el) {
      originalContent.current.set(answerId, el.innerHTML)
      setEditingAnswerId(answerId)
      el.focus()
    }
  }

  // Save answer
  const saveAnswer = async (answerId: Id, currentStatus: number) => {
    const el = answerRefs.current.get(answerId)
    if (!el) return

    try {
      await updateAnswer({ id: answerId, value: el.innerHTML, status: currentStatus }).unwrap()
      originalContent.current.delete(answerId)
      setEditingAnswerId(null)
    } catch {
      dispatch(toastPushed('error', t('common.error')))
    }
  }

  // Cancel editing answer
  const cancelEditAnswer = (answerId: Id) => {
    const el = answerRefs.current.get(answerId)
    const original = originalContent.current.get(answerId)
    if (el && original !== undefined) {
      el.innerHTML = original
    }
    originalContent.current.delete(answerId)
    setEditingAnswerId(null)
  }

  // Toggle answer correct/incorrect
  const handleToggleAnswer = async (answerId: Id, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1
    const el = answerRefs.current.get(answerId)
    const value = el?.innerHTML ?? ''

    try {
      await updateAnswer({ id: answerId, value, status: newStatus }).unwrap()
      refetch()
    } catch {
      dispatch(toastPushed('error', t('common.error')))
    }
  }

  // Handle paste for images and RTF formulas
  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLDivElement>) => {
      const cd = e.clipboardData
      if (!cd) return

      // Check for image paste
      const items = cd.items
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          e.preventDefault()
          const blob = item.getAsFile()
          if (!blob) return

          if (blob.size > 5 * 1024 * 1024) {
            dispatch(toastPushed('error', 'Изображение слишком большое (макс. 5 МБ)'))
            return
          }

          const reader = new FileReader()
          reader.onload = (ev) => {
            const dataUrl = ev.target?.result
            if (typeof dataUrl === 'string') {
              document.execCommand('insertHTML', false, `<img src="${dataUrl}" style="max-width:100%;height:auto;" />`)
            }
          }
          reader.readAsDataURL(blob)
          return
        }
      }

      // Check for RTF paste (formula from Word)
      if (cd.types.includes('text/rtf')) {
        const rtf = cd.getData('text/rtf')
        if (rtf && rtf.startsWith('{\\rtf')) {
          e.preventDefault()

          // Insert placeholder
          const placeholderId = `formula-${Date.now()}`
          document.execCommand('insertHTML', false, `<span id="${placeholderId}" style="color:#6c757d;"><i>Конвертация формулы...</i></span>`)

          try {
            const result = await convertFormula({ rtf }).unwrap()
            const placeholder = document.getElementById(placeholderId)
            if (placeholder && result.ok && result.html) {
              placeholder.outerHTML = result.html
            } else if (placeholder) {
              placeholder.outerHTML = '<em style="color:red;">Ошибка конвертации</em>'
            }
          } catch {
            const placeholder = document.getElementById(placeholderId)
            if (placeholder) {
              placeholder.outerHTML = '<em style="color:red;">Ошибка конвертации</em>'
            }
          }
        }
      }
    },
    [convertFormula, dispatch],
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {t('test_upload.manage')} <span className="text-muted">#{testId}</span>
        </h1>
        <Button variant="secondary" onClick={() => navigate('/staff/test-upload')}>
          {t('common.back')}
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface px-4 py-2">
        {/* Stats */}
        <span className="text-sm text-muted">
          {data?.filteredTotal !== data?.total && `${data?.filteredTotal} / `}
          {data?.total} | {t('test_upload.question_active')}: {data?.totalActive} | {t('test_upload.question_inactive')}: {data?.totalDisabled}
        </span>

        {/* Filter buttons */}
        <div className="flex gap-1">
          {filterButtons.map((btn) => (
            <button
              key={btn.status}
              onClick={() => setFilterStatus(btn.status)}
              className={`rounded px-3 py-1 text-sm transition-colors ${
                filterStatus === btn.status
                  ? btn.variant === 'success'
                    ? 'bg-green-600 text-white'
                    : btn.variant === 'danger'
                      ? 'bg-red-600 text-white'
                      : 'bg-primary text-primary-fg'
                  : 'border border-border bg-bg hover:bg-surface'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder={`${t('common.search')}...`}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="ml-auto w-64 rounded border border-border bg-bg px-3 py-1 text-sm"
        />
      </div>

      {/* Loading overlay */}
      {isFetching && !isLoading && (
        <div className="flex justify-center py-2">
          <Spinner />
        </div>
      )}

      {/* Questions list */}
      <div className="flex flex-col gap-3">
        {questions.length === 0 ? (
          <p className="py-8 text-center text-muted">{t('common.no_data')}</p>
        ) : (
          questions.map((q, idx) => {
            const globalIndex = (page - 1) * PAGE_SIZE + idx + 1
            const isActive = q.test_question_status === 1
            const isEditing = editingQuestionId === q.test_question_id

            return (
              <div
                key={q.test_question_id}
                className={`rounded-lg border border-border bg-surface p-4 ${!isActive ? 'opacity-55' : ''}`}
              >
                {/* Header */}
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-muted/20 px-2 py-0.5 text-xs font-medium">#{globalIndex}</span>
                    <button
                      onClick={() => startEditQuestion(q.test_question_id)}
                      className="rounded p-1 text-primary hover:bg-bg"
                      title={t('common.edit')}
                    >
                      <PenIcon />
                    </button>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => handleToggleQuestion(q.test_question_id, q.test_question_status)}
                      className="h-4 w-4"
                    />
                    <span className="text-xs text-muted">{isActive ? t('test_upload.question_active') : t('test_upload.question_inactive')}</span>
                  </label>
                </div>

                {/* Question text */}
                <div
                  ref={(el) => {
                    if (el) questionRefs.current.set(q.test_question_id, el)
                  }}
                  contentEditable={isEditing}
                  onPaste={handlePaste}
                  className={`question-content mb-3 font-medium ${isEditing ? 'rounded border-2 border-primary bg-white p-2 outline-none dark:bg-gray-900' : ''}`}
                  dangerouslySetInnerHTML={{ __html: q.test_question_value }}
                />

                {/* Question edit actions */}
                {isEditing && (
                  <div className="mb-3 flex gap-2">
                    <button
                      onClick={() => saveQuestion(q.test_question_id)}
                      className="rounded bg-primary px-2 py-1 text-xs text-primary-fg hover:opacity-90"
                    >
                      {t('common.save')}
                    </button>
                    <button
                      onClick={() => cancelEditQuestion(q.test_question_id)}
                      className="rounded border border-border bg-surface px-2 py-1 text-xs hover:bg-bg"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                )}

                {/* Answers */}
                <div className="flex flex-col gap-1">
                  {q.answers.map((a) => (
                    <AnswerItem
                      key={a.test_answer_id}
                      answer={a}
                      isEditing={editingAnswerId === a.test_answer_id}
                      onEdit={() => startEditAnswer(a.test_answer_id)}
                      onSave={() => saveAnswer(a.test_answer_id, a.test_answer_status)}
                      onCancel={() => cancelEditAnswer(a.test_answer_id)}
                      onToggle={() => handleToggleAnswer(a.test_answer_id, a.test_answer_status)}
                      onPaste={handlePaste}
                      answerRefs={answerRefs}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={page - 1}
          lastPage={totalPages - 1}
          onPageChange={(p) => {
            setPage(p + 1)
            window.scrollTo(0, 0)
          }}
        />
      )}
    </div>
  )
}

/**
 * AnswerItem component
 */
function AnswerItem({
  answer,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onToggle,
  onPaste,
  answerRefs,
  t,
}: {
  answer: AnswerRow
  isEditing: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onToggle: () => void
  onPaste: (e: React.ClipboardEvent<HTMLDivElement>) => void
  answerRefs: React.MutableRefObject<Map<Id, HTMLDivElement>>
  t: (key: string) => string
}) {
  const isCorrect = answer.test_answer_status === 1

  return (
    <div
      className={`relative rounded px-3 py-2 text-sm ${
        isCorrect ? 'border-l-4 border-green-500 bg-green-50 font-medium dark:bg-green-900/20' : 'border-l-4 border-border bg-bg'
      }`}
    >
      {/* Controls */}
      <div className="absolute right-2 top-2 flex items-center gap-1">
        <button onClick={onEdit} className="rounded p-1 text-primary hover:bg-surface" title={t('common.edit')}>
          <PenIcon />
        </button>
        <label className="flex items-center">
          <input type="checkbox" checked={isCorrect} onChange={onToggle} className="h-4 w-4" />
        </label>
      </div>

      {/* Answer text */}
      <div
        ref={(el) => {
          if (el) answerRefs.current.set(answer.test_answer_id, el)
        }}
        contentEditable={isEditing}
        onPaste={onPaste}
        className={`pr-16 ${isEditing ? 'rounded border-2 border-primary bg-white p-2 outline-none dark:bg-gray-900' : ''}`}
        dangerouslySetInnerHTML={{ __html: answer.test_answer_value }}
      />

      {/* Edit actions */}
      {isEditing && (
        <div className="mt-2 flex gap-2">
          <button
            onClick={onSave}
            className="rounded bg-primary px-2 py-1 text-xs text-primary-fg hover:opacity-90"
          >
            {t('common.save')}
          </button>
          <button
            onClick={onCancel}
            className="rounded border border-border bg-surface px-2 py-1 text-xs hover:bg-bg"
          >
            {t('common.cancel')}
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Pen icon component
 */
function PenIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  )
}
