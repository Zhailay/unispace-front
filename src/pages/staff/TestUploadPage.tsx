import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  useTestUploadPageQuery,
  useTestUploadDisciplinesQuery,
  useDeleteTestMutation,
  type DisciplinaItem,
} from '@/features/testUpload/testUploadApi'
import { useRtfUpload } from '@/features/testUpload/useRtfUpload'
import { useT } from '@/shared/i18n/useT'
import { Select } from '@/shared/ui/Field'
import Button from '@/shared/ui/Button'
import Spinner from '@/shared/ui/Spinner'
import Modal from '@/shared/ui/Modal'
import ConfirmDialog from '@/shared/ui/ConfirmDialog'
import type { Id } from '@/shared/types/api'

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

  if (isPageLoading) {
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
        <h1 className="text-xl font-semibold">{t('test_upload.title')}</h1>
        <Button onClick={() => setModalOpen(true)}>{t('test_upload.create')}</Button>
      </div>

      {/* Tests table */}
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-bg">
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left font-medium">#</th>
                <th className="px-3 py-2 text-left font-medium">{t('test_upload.disciplina')}</th>
                <th className="px-3 py-2 text-left font-medium">{t('test_upload.yazyk')}</th>
                <th className="px-3 py-2 text-center font-medium">{t('test_upload.nedelya')}</th>
                <th className="px-3 py-2 text-left font-medium">{t('test_upload.test_type')}</th>
                <th className="px-3 py-2 text-center font-medium">{t('test_upload.questions_count')}</th>
                <th className="px-3 py-2 text-center font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {tests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-muted">
                    {t('common.no_data')}
                  </td>
                </tr>
              ) : (
                tests.map((test) => (
                  <tr key={test.test_id} className="border-b border-border">
                    <td className="px-3 py-2">{test.test_id}</td>
                    <td className="px-3 py-2">{test.disciplina_name}</td>
                    <td className="px-3 py-2">{test.yazyk_name}</td>
                    <td className="px-3 py-2 text-center">{test.id_nedelya}</td>
                    <td className="px-3 py-2">{test.test_type}</td>
                    <td className="px-3 py-2 text-center">{test.questions_count}</td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => navigate(`/staff/test-upload/manage/${test.test_id}`)}
                          className="rounded px-2 py-1 text-xs text-primary hover:bg-bg"
                        >
                          {t('common.edit')}
                        </button>
                        <button
                          onClick={() => setDeleteId(test.test_id)}
                          className="rounded px-2 py-1 text-xs text-danger hover:bg-bg"
                        >
                          {t('common.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      <Modal open={modalOpen} onClose={() => !isUploading && setModalOpen(false)} title={t('test_upload.create')}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Form fields (hidden during upload) */}
          {!isUploading && !status && (
            <>
              <div className="grid grid-cols-2 gap-4">
                {/* Semester */}
                <div>
                  <label className="mb-1 block text-xs text-muted">{t('test_upload.academic_period')}</label>
                  <Select value={filterSemestr} onChange={(e) => handleSemestrChange(e.target.value)} required>
                    <option value="">—</option>
                    {semestrList.map((s) => (
                      <option key={s.semestr_id} value={s.semestr_id}>
                        {s.semestr_nomer}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Discipline */}
                <div>
                  <label className="mb-1 block text-xs text-muted">{t('test_upload.disciplina')}</label>
                  <Select
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
                </div>

                {/* Language */}
                <div>
                  <label className="mb-1 block text-xs text-muted">{t('test_upload.yazyk')}</label>
                  <Select value={idYazyk} onChange={(e) => setIdYazyk(e.target.value)} required>
                    <option value="1">Русский</option>
                    <option value="2">Қазақша</option>
                    <option value="3">English</option>
                  </Select>
                </div>

                {/* Week */}
                <div>
                  <label className="mb-1 block text-xs text-muted">{t('test_upload.nedelya')}</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    className="w-full rounded border border-border bg-bg px-3 py-2 text-sm"
                    value={idNedelya}
                    onChange={(e) => setIdNedelya(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Test Type (hidden - defaults to 1 Тренажёр) */}
              <input type="hidden" value={testType} />

              {/* RTF File */}
              <div>
                <label className="mb-1 block text-xs text-muted">{t('test_upload.rtf_file')}</label>
                <input type="file" ref={fileInputRef} accept=".rtf" className="w-full rounded border border-border bg-bg px-3 py-2 text-sm" required />
                <p className="mt-1 text-xs text-muted">
                  Маркеры: <code className="rounded bg-bg px-1">#####</code> — вопрос, <code className="rounded bg-bg px-1">?????</code> — ответ,{' '}
                  <code className="rounded bg-bg px-1">?????N</code> — N правильных в следующем блоке
                </p>
              </div>

              {/* Disable symbol check */}
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={disableSymbolCheck} onChange={(e) => setDisableSymbolCheck(e.target.checked)} className="h-4 w-4" />
                <span className="text-sm">{t('test_upload.disable_symbol_check')}</span>
              </label>

              {/* Error message */}
              {error && <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">{error}</div>}

              {/* Buttons */}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit">{t('test_upload.parse')}</Button>
              </div>
            </>
          )}

          {/* Progress view */}
          {(isUploading || status) && (
            <div className="flex flex-col items-center gap-4 py-4">
              {isUploading && (
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              )}
              <h5 className="text-center font-medium">{status}</h5>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-muted">{progress}%</p>
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
