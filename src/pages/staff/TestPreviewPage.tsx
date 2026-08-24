import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import { useTestUploadPreviewQuery, useTestUploadSaveMutation, type PreviewQuestion } from '@/features/testUpload/testUploadApi'
import { useT } from '@/shared/i18n/useT'
import Button from '@/shared/ui/Button'
import Icon from '@/shared/ui/Icon'
import Spinner from '@/shared/ui/Spinner'
import EmptyState from '@/shared/ui/EmptyState'
import PageHeader from '@/shared/ui/PageHeader'

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
      <div className="flex flex-col gap-5">
        <PageHeader title={t('test_upload.preview_title')} />
        <div className="rounded-card border border-border bg-surface shadow-card">
          <EmptyState
            title={t('common.no_data')}
            description="Нет данных для предпросмотра"
            action={
              <Button variant="secondary" icon="chevronLeft" onClick={() => navigate('/staff/test-upload')}>
                {t('common.back')}
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'correct', label: t('test_upload.correct'), count: correct.length },
    { id: 'incorrect', label: t('test_upload.incorrect'), count: incorrect.length },
  ]

  const visible = activeTab === 'correct' ? correct : incorrect

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={t('test_upload.preview_title')}
        actions={
          <>
            <Button variant="secondary" icon="chevronLeft" onClick={() => navigate('/staff/test-upload')}>
              {t('common.back')}
            </Button>
            {correct.length > 0 && (
              <Button onClick={handleSave} loading={isSaving} icon="check">
                {t('test_upload.save')} ({correct.length})
              </Button>
            )}
          </>
        }
      />

      {/* Плитки KPI: всего / правильных / неправильных */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
          <p className="tabular text-2xl font-semibold">{total}</p>
          <p className="text-sm text-muted">{t('test_upload.total')}</p>
        </div>
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
          <p className="tabular text-2xl font-semibold text-success">{correct.length}</p>
          <p className="text-sm text-muted">{t('test_upload.correct')}</p>
        </div>
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
          <p className="tabular text-2xl font-semibold text-danger">{incorrect.length}</p>
          <p className="text-sm text-muted">{t('test_upload.incorrect')}</p>
        </div>
      </div>

      {/* Переключатель списков — сегментированный контрол на общих кнопках */}
      <div className="inline-flex w-fit gap-1 rounded-control border border-border bg-surface-2 p-1">
        {tabs.map((tab) => {
          const isCurrent = activeTab === tab.id
          return (
            <Button
              key={tab.id}
              size="sm"
              variant={isCurrent ? 'primary' : 'ghost'}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon
                name={tab.id === 'correct' ? 'check' : 'close'}
                className={`size-3.5 ${
                  isCurrent ? '' : tab.id === 'correct' ? 'text-success' : 'text-danger'
                }`}
              />
              {tab.label}
              <span className="tabular">({tab.count})</span>
            </Button>
          )
        })}
      </div>

      {/* Questions list */}
      <div className="flex flex-col gap-3">
        {visible.length === 0 ? (
          <div className="rounded-card border border-border bg-surface shadow-card">
            <EmptyState title={t('common.no_data')} description={t('common.no_records_hint')} />
          </div>
        ) : (
          visible.map((q, idx) => (
            <QuestionCard key={idx} question={q} index={idx + 1} showError={activeTab === 'incorrect'} />
          ))
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
    <div className="rounded-card border border-border bg-surface p-4 shadow-card">
      {/* Number badge */}
      <div className="mb-2 inline-flex size-7 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-fg tabular">
        {index}
      </div>

      {/* Error reason */}
      {showError && question.errorReason && (
        <div className="mb-2 flex items-center gap-1.5 rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">
          <Icon name="alert" className="size-4" />
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
            className={`rounded-control border-l-4 px-3 py-2 text-sm ${
              answer.isTrue
                ? 'border-success bg-success-soft font-medium text-fg'
                : 'border-border bg-surface-2'
            }`}
            dangerouslySetInnerHTML={{ __html: answer.html }}
          />
        ))}
      </div>
    </div>
  )
}
