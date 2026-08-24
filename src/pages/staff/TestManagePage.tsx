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
import Badge from '@/shared/ui/Badge'
import Icon from '@/shared/ui/Icon'
import Spinner from '@/shared/ui/Spinner'
import EmptyState from '@/shared/ui/EmptyState'
import PageHeader from '@/shared/ui/PageHeader'
import Pagination from '@/shared/ui/Pagination'
import { SearchInput } from '@/shared/ui/Field'
import type { Id } from '@/shared/types/api'

type FilterStatus = 'all' | 'active' | 'disabled'

const PAGE_SIZE = 25

// Рамка активного редактирования — одинакова у вопроса и у ответа.
const EDITABLE = 'rounded-control border-2 border-primary bg-surface p-2 outline-none'

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
  const filterButtons: { status: FilterStatus; label: string }[] = [
    { status: 'all', label: t('test_upload.filter_all') },
    { status: 'active', label: t('test_upload.question_active') },
    { status: 'disabled', label: t('test_upload.question_inactive') },
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
    <div className="flex flex-col gap-5">
      <PageHeader
        title={t('test_upload.manage')}
        description={`#${testId}`}
        busy={isFetching}
        actions={
          <Button variant="secondary" icon="chevronLeft" onClick={() => navigate('/staff/test-upload')}>
            {t('common.back')}
          </Button>
        }
      />

      {/* Плитки KPI: всего вопросов / активных / отключённых */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
          <p className="tabular text-2xl font-semibold">
            {data?.filteredTotal !== data?.total && (
              <span className="text-muted">{data?.filteredTotal} / </span>
            )}
            {data?.total ?? 0}
          </p>
          <p className="text-sm text-muted">{t('common.total')}</p>
        </div>
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
          <p className="tabular text-2xl font-semibold text-success">{data?.totalActive ?? 0}</p>
          <p className="text-sm text-muted">{t('test_upload.question_active')}</p>
        </div>
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
          <p className="tabular text-2xl font-semibold text-danger">{data?.totalDisabled ?? 0}</p>
          <p className="text-sm text-muted">{t('test_upload.question_inactive')}</p>
        </div>
      </div>

      {/* Тулбар: фильтр по статусу и поиск */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {filterButtons.map((btn) => (
            <Button
              key={btn.status}
              size="sm"
              variant={filterStatus === btn.status ? 'primary' : 'secondary'}
              onClick={() => setFilterStatus(btn.status)}
            >
              {btn.label}
            </Button>
          ))}
        </div>

        <div className="ml-auto w-full sm:w-64">
          <SearchInput
          clearLabel={t('common.clear_search')}
            label={t('common.search')}
            placeholder={t('common.search')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onClear={() => setSearchInput('')}
          />
        </div>
      </div>

      {/* Questions list */}
      <div className="flex flex-col gap-3">
        {questions.length === 0 ? (
          <div className="rounded-card border border-border bg-surface shadow-card">
            <EmptyState
              title={searchQuery ? t('common.nothing_found') : t('common.no_data')}
              description={searchQuery ? t('common.nothing_found_hint') : t('common.no_records_hint')}
              action={
                searchQuery ? (
                  <Button variant="secondary" onClick={() => setSearchInput('')}>
                    {t('ucheb_students.clear_search')}
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          questions.map((q, idx) => {
            const globalIndex = (page - 1) * PAGE_SIZE + idx + 1
            const isActive = q.test_question_status === 1
            const isEditing = editingQuestionId === q.test_question_id

            return (
              <div
                key={q.test_question_id}
                className={`rounded-card border border-border bg-surface p-4 shadow-card ${!isActive ? 'opacity-55' : ''}`}
              >
                {/* Header */}
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="tabular rounded-control bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted">
                      #{globalIndex}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon="pencil"
                      onClick={() => startEditQuestion(q.test_question_id)}
                      title={t('common.edit')}
                      aria-label={t('common.edit')}
                    />
                  </div>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => handleToggleQuestion(q.test_question_id, q.test_question_status)}
                      className="size-4 cursor-pointer accent-primary"
                    />
                    <Badge tone={isActive ? 'success' : 'neutral'}>
                      {isActive ? t('test_upload.question_active') : t('test_upload.question_inactive')}
                    </Badge>
                  </label>
                </div>

                {/* Question text */}
                <div
                  ref={(el) => {
                    if (el) questionRefs.current.set(q.test_question_id, el)
                  }}
                  contentEditable={isEditing}
                  onPaste={handlePaste}
                  className={`question-content mb-3 font-medium ${isEditing ? EDITABLE : ''}`}
                  dangerouslySetInnerHTML={{ __html: q.test_question_value }}
                />

                {/* Question edit actions */}
                {isEditing && (
                  <div className="mb-3 flex gap-2">
                    <Button size="sm" icon="check" onClick={() => saveQuestion(q.test_question_id)}>
                      {t('common.save')}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => cancelEditQuestion(q.test_question_id)}
                    >
                      {t('common.cancel')}
                    </Button>
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
          total={data?.filteredTotal}
          pageSize={PAGE_SIZE}
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
}: {
  answer: AnswerRow
  isEditing: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onToggle: () => void
  onPaste: (e: React.ClipboardEvent<HTMLDivElement>) => void
  answerRefs: React.MutableRefObject<Map<Id, HTMLDivElement>>
}) {
  const t = useT()
  const isCorrect = answer.test_answer_status === 1

  return (
    <div
      className={`relative rounded-control border-l-4 px-3 py-2 text-sm ${
        isCorrect ? 'border-success bg-success-soft font-medium text-fg' : 'border-border bg-surface-2'
      }`}
    >
      {/* Controls */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          icon="pencil"
          onClick={onEdit}
          title={t('common.edit')}
          aria-label={t('common.edit')}
        />
        <label className="flex cursor-pointer items-center" title={t('test_upload.correct')}>
          <input
            type="checkbox"
            checked={isCorrect}
            onChange={onToggle}
            aria-label={t('test_upload.correct')}
            className="size-4 cursor-pointer accent-success"
          />
        </label>
        {isCorrect && <Icon name="check" className="size-3.5 text-success" />}
      </div>

      {/* Answer text */}
      <div
        ref={(el) => {
          if (el) answerRefs.current.set(answer.test_answer_id, el)
        }}
        contentEditable={isEditing}
        onPaste={onPaste}
        className={`pr-24 ${isEditing ? EDITABLE : ''}`}
        dangerouslySetInnerHTML={{ __html: answer.test_answer_value }}
      />

      {/* Edit actions */}
      {isEditing && (
        <div className="mt-2 flex gap-2">
          <Button size="sm" icon="check" onClick={onSave}>
            {t('common.save')}
          </Button>
          <Button size="sm" variant="secondary" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        </div>
      )}
    </div>
  )
}
