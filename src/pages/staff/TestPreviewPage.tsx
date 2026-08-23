import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import { useTestUploadPreviewQuery, useTestUploadSaveMutation, type PreviewQuestion } from '@/features/testUpload/testUploadApi'
import { useT } from '@/shared/i18n/useT'
import Button from '@/shared/ui/Button'
import Spinner from '@/shared/ui/Spinner'

type TabId = 'correct' | 'incorrect'

/**
 * TestPreviewPage: Preview parsed questions before saving.
 * Matches behavior from unispace/src/views/ucheb/test_upload/preview.hbs (109 lines)
 *
 * Features:
 * - Show statistics: total, correct, incorrect questions
 * - Two tabs: correct questions and questions with errors
 * - Each question shows HTML content with answers
 * - Save button to commit to database
 */
export default function TestPreviewPage() {
  const t = useT()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<TabId>('correct')

  // Fetch preview data from session
  const { data: pageData, isLoading, isError } = useTestUploadPreviewQuery()

  // Save mutation
  const [saveTest, { isLoading: isSaving }] = useTestUploadSaveMutation()

  const previewData = pageData?.data
  const correct = previewData?.correct ?? []
  const incorrect = previewData?.incorrect ?? []
  const total = previewData?.total ?? 0

  const handleSave = async () => {
    try {
      // Save endpoint redirects, but we handle via API
      const result = await saveTest().unwrap()
      if ('ok' in result && result.ok && result.testId) {
        dispatch(toastPushed('success', `Тест сохранён: ${correct.length} вопросов`))
        navigate(`/staff/test-upload/manage/${result.testId}`)
      } else if ('error' in result) {
        dispatch(toastPushed('error', result.error))
      }
    } catch {
      dispatch(toastPushed('error', t('common.error')))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    )
  }

  if (isError || !previewData) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <p className="text-muted">Нет данных для предпросмотра</p>
        <Button onClick={() => navigate('/staff/test-upload')}>{t('common.back')}</Button>
      </div>
    )
  }

  const tabs: { id: TabId; label: string; count: number; color: string }[] = [
    { id: 'correct', label: t('test_upload.correct'), count: correct.length, color: 'text-green-600' },
    { id: 'incorrect', label: t('test_upload.incorrect'), count: incorrect.length, color: 'text-red-600' },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <h1 className="text-xl font-semibold">{t('test_upload.preview_title')}</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-xs text-muted">{t('test_upload.total')}</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>
        <div className="rounded-lg border-l-4 border-green-500 border-l-green-500 bg-surface p-4">
          <p className="text-xs text-muted">{t('test_upload.correct')}</p>
          <p className="text-2xl font-bold text-green-600">{correct.length}</p>
        </div>
        <div className="rounded-lg border-l-4 border-red-500 border-l-red-500 bg-surface p-4">
          <p className="text-xs text-muted">{t('test_upload.incorrect')}</p>
          <p className="text-2xl font-bold text-red-600">{incorrect.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-4 py-2 text-sm transition-colors ${
                activeTab === tab.id ? 'border-primary font-medium text-fg' : 'border-transparent text-muted hover:border-muted hover:text-fg'
              }`}
            >
              <span className={tab.color}>{tab.id === 'correct' ? '✓' : '✗'}</span> {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Questions list */}
      <div className="flex flex-col gap-3">
        {activeTab === 'correct' && (
          <>
            {correct.length === 0 ? (
              <p className="py-8 text-center text-muted">{t('common.no_data')}</p>
            ) : (
              correct.map((q, idx) => <QuestionCard key={idx} question={q} index={idx + 1} />)
            )}
          </>
        )}
        {activeTab === 'incorrect' && (
          <>
            {incorrect.length === 0 ? (
              <p className="py-8 text-center text-muted">{t('common.no_data')}</p>
            ) : (
              incorrect.map((q, idx) => <QuestionCard key={idx} question={q} index={idx + 1} showError />)
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button variant="secondary" onClick={() => navigate('/staff/test-upload')}>
          {t('common.back')}
        </Button>
        {correct.length > 0 && (
          <Button onClick={handleSave} loading={isSaving}>
            {t('test_upload.save')} ({correct.length})
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * QuestionCard component for displaying a single question with answers
 */
function QuestionCard({ question, index, showError }: { question: PreviewQuestion; index: number; showError?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      {/* Number badge */}
      <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-fg">{index}</div>

      {/* Error reason */}
      {showError && question.errorReason && (
        <div className="mb-2 flex items-center gap-1 text-sm text-red-600">
          <span>⚠</span>
          {question.errorReason}
        </div>
      )}

      {/* Question HTML */}
      <div
        className="question-content mb-3 font-medium"
        dangerouslySetInnerHTML={{ __html: question.html }}
      />

      {/* Answers */}
      <div className="flex flex-col gap-1">
        {question.answers.map((answer, idx) => (
          <div
            key={idx}
            className={`rounded px-3 py-2 text-sm ${
              answer.isTrue
                ? 'border-l-4 border-green-500 bg-green-50 font-medium dark:bg-green-900/20'
                : 'border-l-4 border-border bg-bg'
            }`}
            dangerouslySetInnerHTML={{ __html: answer.html }}
          />
        ))}
      </div>
    </div>
  )
}
