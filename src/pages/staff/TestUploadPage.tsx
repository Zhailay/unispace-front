import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  useTestUploadPageQuery,
  useTestUploadDisciplinesQuery,
  useDeleteTestMutation,
  type DisciplinaItem,
  type TestRow,
} from '@/features/testUpload/testUploadApi'
import { useRtfUpload } from '@/features/testUpload/useRtfUpload'
import { useT } from '@/shared/i18n/useT'
import { Input, Select } from '@/shared/ui/Field'
import Button from '@/shared/ui/Button'
import Icon from '@/shared/ui/Icon'
import Spinner from '@/shared/ui/Spinner'
import Modal from '@/shared/ui/Modal'
import ConfirmDialog from '@/shared/ui/ConfirmDialog'
import DataTable, { type Column } from '@/shared/ui/DataTable'
import PageHeader from '@/shared/ui/PageHeader'
import RowActions from '@/shared/ui/RowActions'
import type { Id } from '@/shared/types/api'

const FORM_ID = 'test-upload-form'

/**
 * TestUploadPage: Main page for test upload management.
 * Matches behavior from unispace/src/views/ucheb/test_upload/index.hbs (282 lines)
 *
 * Features:
 * - List of uploaded tests by current user
 * - Modal for uploading new RTF files with cascade semester -> discipline
 * - Progress bar during upload and parsing
 * - Delete test functionality
 */
export default function TestUploadPage() {
  const t = useT()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<Id | null>(null)

  // Form state
  const [filterSemestr, setFilterSemestr] = useState<Id>('')
  const [selectedDisciplina, setSelectedDisciplina] = useState<DisciplinaItem | null>(null)
  const [idYazyk, setIdYazyk] = useState('1')
  const [idNedelya, setIdNedelya] = useState('1')
  const [testType, setTestType] = useState('1')
  const [disableSymbolCheck, setDisableSymbolCheck] = useState(false)
  // Имя выбранного файла — только для отображения в дропзоне, на загрузку не влияет.
  const [fileName, setFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Data queries
  const { data: pageData, isLoading: isPageLoading, refetch } = useTestUploadPageQuery()
  const semestrList = pageData?.data?.semestr_list ?? []
  const tests = pageData?.data?.tests ?? []

  // Disciplines cascade
  const { data: disciplines } = useTestUploadDisciplinesQuery({ id_semestr: filterSemestr }, { skip: !filterSemestr })

  // Upload hook
  const { isUploading, progress, status, error, upload, reset, abort } = useRtfUpload()

  // Mutations
  const [deleteTest, { isLoading: isDeleting }] = useDeleteTestMutation()

  // Reset form when modal closes
  useEffect(() => {
    if (!modalOpen) {
      setFilterSemestr('')
      setSelectedDisciplina(null)
      setIdYazyk('1')
      setIdNedelya('1')
      setTestType('1')
      setDisableSymbolCheck(false)
      setFileName('')
      reset()
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [modalOpen, reset])

  const handleSemestrChange = (value: Id) => {
    setFilterSemestr(value)
    setSelectedDisciplina(null)
  }

  const handleDisciplinaChange = (planId: Id) => {
    const item = disciplines?.find((d) => d.plan_id === planId) ?? null
    setSelectedDisciplina(item)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDisciplina) {
      dispatch(toastPushed('error', 'Выберите дисциплину'))
      return
    }

    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      dispatch(toastPushed('error', t('test_upload.errors.no_file')))
      return
    }

    const formData = new FormData()
    formData.append('id_disciplina', selectedDisciplina.disciplina_id)
    formData.append('id_yazyk', idYazyk)
    formData.append('id_nedelya', idNedelya)
    formData.append('test_type', testType)
    formData.append('rtfFile', file)
    if (disableSymbolCheck) {
      formData.append('disable_symbol_check', 'on')
    }

    const result = await upload(formData)

    if (result?.ok && result.redirect) {
      // Navigate to preview page
      navigate('/staff/test-upload/preview')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const result = await deleteTest(deleteId).unwrap()
      if (result.ok) {
        dispatch(toastPushed('success', t('success.deleted')))
        refetch()
      } else {
        dispatch(toastPushed('error', t('common.error')))
      }
    } catch {
      dispatch(toastPushed('error', t('common.error')))
    } finally {
      setDeleteId(null)
    }
  }

  // Форма скрыта, пока идёт загрузка/разбор — вместо неё показываем прогресс.
  const showForm = !isUploading && !status

  const columns: Column<TestRow>[] = [
    {
      key: 'id',
      header: '#',
      className: 'tabular w-px whitespace-nowrap text-muted',
      render: (row) => row.test_id,
    },
    {
      key: 'disciplina',
      header: t('test_upload.disciplina'),
      className: 'font-medium',
      render: (row) => row.disciplina_name,
    },
    { key: 'yazyk', header: t('test_upload.yazyk'), render: (row) => row.yazyk_name },
    {
      key: 'nedelya',
      header: t('test_upload.nedelya'),
      align: 'center',
      className: 'tabular',
      render: (row) => row.id_nedelya,
    },
    { key: 'type', header: t('test_upload.test_type'), render: (row) => row.test_type },
    {
      key: 'questions',
      header: t('test_upload.questions_count'),
      align: 'center',
      className: 'tabular',
      render: (row) => row.questions_count,
    },
    {
      key: 'actions',
      header: t('common.actions'),
      align: 'right',
      className: 'w-px',
      render: (row) => (
        <RowActions
          onEdit={() => navigate(`/staff/test-upload/manage/${row.test_id}`)}
          onDelete={() => setDeleteId(row.test_id)}
          deleting={isDeleting && deleteId === row.test_id}
        />
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={t('test_upload.title')}
        count={tests.length}
        busy={isPageLoading}
        actions={
          <Button icon="upload" onClick={() => setModalOpen(true)}>
            {t('test_upload.create')}
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={tests}
        rowKey={(row) => String(row.test_id)}
        loading={isPageLoading}
        emptyMessage={t('common.no_data')}
        emptyDescription={t('common.no_records_hint')}
        emptyAction={
          <Button icon="upload" onClick={() => setModalOpen(true)}>
            {t('test_upload.create')}
          </Button>
        }
      />

      {/* Upload Modal */}
      <Modal
        open={modalOpen}
        onClose={() => !isUploading && setModalOpen(false)}
        title={t('test_upload.create')}
        footer={
          showForm ? (
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" form={FORM_ID} icon="upload">
                {t('test_upload.parse')}
              </Button>
            </div>
          ) : undefined
        }
      >
        <form id={FORM_ID} onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Form fields (hidden during upload) */}
          {showForm && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Semester */}
                <Select
                  label={t('test_upload.academic_period')}
                  value={filterSemestr}
                  onChange={(e) => handleSemestrChange(e.target.value)}
                  required
                >
                  <option value="">—</option>
                  {semestrList.map((s) => (
                    <option key={s.semestr_id} value={s.semestr_id}>
                      {s.semestr_nomer}
                    </option>
                  ))}
                </Select>

                {/* Discipline */}
                <Select
                  label={t('test_upload.disciplina')}
                  value={selectedDisciplina?.plan_id ?? ''}
                  onChange={(e) => handleDisciplinaChange(e.target.value)}
                  required
                  disabled={!filterSemestr}
                >
                  <option value="">—</option>
                  {disciplines?.map((d) => (
                    <option key={d.plan_id} value={d.plan_id}>
                      {d.gruppa_disciplina_name}
                    </option>
                  ))}
                </Select>

                {/* Language */}
                <Select
                  label={t('test_upload.yazyk')}
                  value={idYazyk}
                  onChange={(e) => setIdYazyk(e.target.value)}
                  required
                >
                  <option value="1">Русский</option>
                  <option value="2">Қазақша</option>
                  <option value="3">English</option>
                </Select>

                {/* Week */}
                <Input
                  label={t('test_upload.nedelya')}
                  type="number"
                  min={1}
                  max={20}
                  className="tabular"
                  value={idNedelya}
                  onChange={(e) => setIdNedelya(e.target.value)}
                  required
                />
              </div>

              {/* Test Type (hidden - defaults to 1 Тренажёр) */}
              <input type="hidden" value={testType} />

              {/* RTF File */}
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-fg">{t('test_upload.rtf_file')}</span>
                {/* Дропзона: рамка + иконка, чтобы поле файла не выбивалось из общего вида. */}
                <div
                  className="flex flex-col items-center gap-2 rounded-card border border-dashed
                    border-border bg-surface-2 px-4 py-5 text-center transition-colors
                    hover:border-border-strong"
                >
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <Icon name="upload" className="size-5" />
                  </span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".rtf"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
                    className="max-w-full text-sm text-muted
                      file:mr-3 file:cursor-pointer file:rounded-control file:border-0
                      file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium
                      file:text-fg hover:file:bg-border"
                    required
                  />
                  {fileName && <p className="max-w-full truncate text-xs text-fg">{fileName}</p>}
                </div>
                <p className="text-xs text-muted">
                  Маркеры: <code className="rounded bg-surface-2 px-1">#####</code> — вопрос,{' '}
                  <code className="rounded bg-surface-2 px-1">?????</code> — ответ,{' '}
                  <code className="rounded bg-surface-2 px-1">?????N</code> — N правильных в следующем блоке
                </p>
              </div>

              {/* Disable symbol check */}
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={disableSymbolCheck}
                  onChange={(e) => setDisableSymbolCheck(e.target.checked)}
                  className="size-4 cursor-pointer accent-primary"
                />
                <span className="text-sm">{t('test_upload.disable_symbol_check')}</span>
              </label>

              {/* Error message */}
              {error && (
                <div className="flex items-start gap-2 rounded-control border border-danger bg-danger-soft px-3 py-2 text-sm text-danger">
                  <Icon name="alert" className="mt-0.5 size-4" />
                  <span>{error}</span>
                </div>
              )}
            </>
          )}

          {/* Progress view */}
          {(isUploading || status) && (
            <div className="flex flex-col items-center gap-4 py-4">
              {isUploading && <Spinner className="size-10 border-4" />}
              <h5 className="text-center font-medium">{status}</h5>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="tabular text-sm text-muted">{progress}%</p>
              {isUploading && (
                <Button type="button" variant="secondary" onClick={abort}>
                  {t('common.cancel')}
                </Button>
              )}
            </div>
          )}
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        title={t('common.delete')}
        message="Удалить тест?"
        confirmText={t('common.delete')}
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
        loading={isDeleting}
      />
    </div>
  )
}
