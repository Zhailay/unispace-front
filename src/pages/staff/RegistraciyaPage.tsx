import { useState, useMemo, useCallback } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  useRegistraciyaPageQuery,
  useRegistraciyaGruppaQuery,
  useRegistraciyaDisciplinaQuery,
  useRegistraciyaVidZanyatiyaQuery,
  useRegistraciyaStudentsQuery,
  useRegistraciyaTableQuery,
  useSaveRegistraciyaMutation,
  useDeleteRegistraciyaMutation,
  type GruppaRegItem,
  type RegistraciyaTableRow,
} from '@/features/registraciya/registraciyaApi'
import ConfirmDialog from '@/shared/ui/ConfirmDialog'
import type { Id } from '@/shared/types/api'
import { useT } from '@/shared/i18n/useT'
import Button from '@/shared/ui/Button'
import { Select } from '@/shared/ui/Field'
import PageHeader from '@/shared/ui/PageHeader'
import EmptyState from '@/shared/ui/EmptyState'

// Чекбокс живёт только внутри этой таблицы, отдельного примитива в
// дизайн-системе нет — держим классы в одном месте, чтобы не разъезжались.
const CHECKBOX = 'size-4 cursor-pointer rounded border-border accent-primary'

/**
 * RegistraciyaPage: Student registration to disciplines (teacher assignment).
 * Matches behavior from unispace/src/views/ucheb/registraciya.hbs (404 lines)
 */
export default function RegistraciyaPage() {
  const t = useT()
  const dispatch = useAppDispatch()

  // Filter state - Row 1
  const [filterSpec, setFilterSpec] = useState<Id>('')
  const [filterGod, setFilterGod] = useState<Id>('')
  const [filterFormaObuch, setFilterFormaObuch] = useState<Id>('')
  const [filterGruppa, setFilterGruppa] = useState<Id>('')
  const [filterTeacher, setFilterTeacher] = useState<Id>('')

  // Filter state - Row 2
  const [filterSemestr, setFilterSemestr] = useState<Id>('')
  const [filterKurs, setFilterKurs] = useState<Id>('')
  const [filterDisciplina, setFilterDisciplina] = useState<Id>('')
  const [filterVidZanyatiya, setFilterVidZanyatiya] = useState<Id>('')

  // Selected students
  const [selectedStudents, setSelectedStudents] = useState<Set<Id>>(new Set())

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  // Track selected gruppa details (id_kontingent, id_otdelenie, gruppa_id)
  const [selectedGruppaData, setSelectedGruppaData] = useState<GruppaRegItem | null>(null)

  // Load page data (dropdown lists)
  const { data: pageData, isLoading: isPageLoading } = useRegistraciyaPageQuery()

  // Load groups when spec/god/forma_obuch are all selected
  const canLoadGruppa = !!filterSpec && !!filterGod && !!filterFormaObuch
  const { data: gruppaData } = useRegistraciyaGruppaQuery(
    { id_spec: filterSpec, id_god: filterGod, id_forma_obuch: filterFormaObuch },
    { skip: !canLoadGruppa },
  )

  // Load disciplines when gruppa + semestr are selected
  const canLoadDisciplina = !!selectedGruppaData?.id_kontingent && !!filterSemestr
  const { data: disciplinaData } = useRegistraciyaDisciplinaQuery(
    {
      id_kontingent: selectedGruppaData?.id_kontingent ?? '',
      id_semestr: filterSemestr,
      id_kurs: filterKurs || null,
    },
    { skip: !canLoadDisciplina },
  )

  // Load vid zanyatiya when disciplina is selected
  const canLoadVidZanyatiya = !!filterDisciplina
  const { data: vidZanyatiyaData } = useRegistraciyaVidZanyatiyaQuery(
    { id_plan: filterDisciplina },
    { skip: !canLoadVidZanyatiya },
  )

  // Load students when gruppa is selected (for initial list)
  const canLoadStudents = !!selectedGruppaData?.gruppa_id
  const { data: studentsData } = useRegistraciyaStudentsQuery(
    { id_gruppa: selectedGruppaData?.gruppa_id ?? '' },
    { skip: !canLoadStudents },
  )

  // Load registration table when disciplina + gruppa are selected
  const canLoadTable = !!filterDisciplina && !!selectedGruppaData?.gruppa_id
  const { data: tableData, refetch: refetchTable } = useRegistraciyaTableQuery(
    { id_plan: filterDisciplina, id_gruppa: selectedGruppaData?.gruppa_id ?? '' },
    { skip: !canLoadTable },
  )

  const [saveRegistraciya, { isLoading: isSaving }] = useSaveRegistraciyaMutation()
  const [deleteRegistraciya, { isLoading: isDeleting }] = useDeleteRegistraciyaMutation()

  // Extract dropdown lists from page data
  const specList = pageData?.data?.spec_list ?? []
  const godList = pageData?.data?.god_list ?? []
  const formaObuchList = pageData?.data?.forma_obuch_list ?? []
  const kursList = pageData?.data?.kurs_list ?? []
  const semestrList = pageData?.data?.semestr_list ?? []
  const teacherList = pageData?.data?.teacher_list ?? []
  const gruppaList = gruppaData?.data ?? []
  const disciplinaList = disciplinaData?.data ?? []
  const vidZanyatiyaList = vidZanyatiyaData?.data ?? []

  // Use registration table if available, otherwise use student list
  const tableRows: RegistraciyaTableRow[] = useMemo(() => {
    if (canLoadTable && tableData?.data?.length) {
      return tableData.data
    }
    if (studentsData?.data?.length) {
      return studentsData.data.map((s) => ({
        student_id: s.student_id,
        student_fio: s.student_fio,
        l_fio: null,
        pz_fio: null,
        lz_fio: null,
        srs_fio: null,
        srsp_fio: null,
        fz_fio: null,
        lpz_fio: null,
      }))
    }
    return []
  }, [canLoadTable, tableData?.data, studentsData?.data])

  const hasData = tableRows.length > 0

  // Reset dependent filters when parent changes
  const handleSpecChange = (value: Id) => {
    setFilterSpec(value)
    setFilterGruppa('')
    setSelectedGruppaData(null)
    setFilterDisciplina('')
    setFilterVidZanyatiya('')
    setSelectedStudents(new Set())
  }

  const handleGodChange = (value: Id) => {
    setFilterGod(value)
    setFilterGruppa('')
    setSelectedGruppaData(null)
    setFilterDisciplina('')
    setFilterVidZanyatiya('')
    setSelectedStudents(new Set())
  }

  const handleFormaObuchChange = (value: Id) => {
    setFilterFormaObuch(value)
    setFilterGruppa('')
    setSelectedGruppaData(null)
    setFilterDisciplina('')
    setFilterVidZanyatiya('')
    setSelectedStudents(new Set())
  }

  const handleGruppaChange = (value: Id) => {
    setFilterGruppa(value)
    const gruppa = gruppaList.find((g) => g.id_kontingent === value) ?? null
    setSelectedGruppaData(gruppa)
    setFilterDisciplina('')
    setFilterVidZanyatiya('')
    setSelectedStudents(new Set())
  }

  const handleSemestrChange = (value: Id) => {
    setFilterSemestr(value)
    setFilterDisciplina('')
    setFilterVidZanyatiya('')
    setSelectedStudents(new Set())
  }

  const handleKursChange = (value: Id) => {
    setFilterKurs(value)
    setFilterDisciplina('')
    setFilterVidZanyatiya('')
    setSelectedStudents(new Set())
  }

  const handleDisciplinaChange = (value: Id) => {
    setFilterDisciplina(value)
    setFilterVidZanyatiya('')
    setSelectedStudents(new Set())
  }

  const handleVidZanyatiyaChange = (value: Id) => {
    setFilterVidZanyatiya(value)
  }

  // Checkbox handlers
  const handleCheckAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedStudents(new Set(tableRows.map((r) => r.student_id)))
      } else {
        setSelectedStudents(new Set())
      }
    },
    [tableRows],
  )

  const handleCheckStudent = useCallback((studentId: Id, checked: boolean) => {
    setSelectedStudents((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(studentId)
      } else {
        next.delete(studentId)
      }
      return next
    })
  }, [])

  const handleSelectAll = () => handleCheckAll(true)
  const handleDeselectAll = () => handleCheckAll(false)

  // Save handler
  const handleSave = async () => {
    if (!filterVidZanyatiya || !filterTeacher || !filterDisciplina || !selectedGruppaData?.id_otdelenie) {
      dispatch(toastPushed('error', t('reg.select_filter_prompt')))
      return
    }
    if (selectedStudents.size === 0) {
      dispatch(toastPushed('error', t('reg.no_records')))
      return
    }

    const result = await saveRegistraciya({
      id_plan_vid_zanyatiya: filterVidZanyatiya,
      id_sotrudnik: filterTeacher,
      id_plan: filterDisciplina,
      id_otdelenie: selectedGruppaData.id_otdelenie,
      student_ids: Array.from(selectedStudents),
    }).unwrap()

    dispatch(toastPushed(result.ok ? 'success' : 'error', result.error ?? (result.ok ? t('reg.success_save') : t('reg.error_connection'))))

    if (result.ok) {
      refetchTable()
      setSelectedStudents(new Set())
    }
  }

  // Delete handler
  const handleDeleteClick = () => {
    if (!filterVidZanyatiya) {
      dispatch(toastPushed('error', t('reg.select_filter_prompt')))
      return
    }
    if (selectedStudents.size === 0) {
      dispatch(toastPushed('error', t('reg.no_records')))
      return
    }
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    setDeleteConfirmOpen(false)
    if (!filterVidZanyatiya) return

    const result = await deleteRegistraciya({
      id_plan_vid_zanyatiya: filterVidZanyatiya,
      student_ids: Array.from(selectedStudents),
    }).unwrap()

    dispatch(toastPushed(result.ok ? 'success' : 'error', result.error ?? (result.ok ? t('reg.success_delete') : t('reg.error_connection'))))

    if (result.ok) {
      refetchTable()
      setSelectedStudents(new Set())
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false)
  }

  const allChecked = hasData && selectedStudents.size === tableRows.length

  // Пока грузятся списки фильтров, показываем только шапку со спиннером.
  if (isPageLoading) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title={t('reg.menu_name')} busy />
      </div>
    )
  }

  // Колонки видов занятий: заголовок и поле ответа процедуры.
  const vidColumns: { key: keyof RegistraciyaTableRow; label: string }[] = [
    { key: 'l_fio', label: t('reg.vid_l') },
    { key: 'pz_fio', label: t('reg.vid_pz') },
    { key: 'lz_fio', label: t('reg.vid_lz') },
    { key: 'srs_fio', label: t('reg.vid_srs') },
    { key: 'srsp_fio', label: t('reg.vid_srsp') },
    { key: 'fz_fio', label: t('reg.vid_fz') },
    { key: 'lpz_fio', label: t('reg.vid_lpz') },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={t('reg.menu_name')}
        count={hasData ? tableRows.length : undefined}
        actions={
          <>
            <Button onClick={handleSave} loading={isSaving} disabled={!hasData}>
              {t('reg.save')}
            </Button>
            <Button variant="danger" icon="trash" onClick={handleDeleteClick} loading={isDeleting} disabled={!hasData}>
              {t('reg.delete')}
            </Button>
          </>
        }
      />

      {/* Карточка фильтров: каскад «специальность, группа, дисциплина, вид занятия». */}
      <div className="rounded-card border border-border bg-surface p-4 shadow-card">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Select
            label={t('reg.specialty')}
            value={filterSpec}
            onChange={(e) => handleSpecChange(e.target.value)}
          >
            <option value="">{t('reg.select_spec')}</option>
            {specList.map((item) => (
              <option key={item.spec_id} value={item.spec_id}>
                {item.spec_name}
              </option>
            ))}
          </Select>

          <Select
            label={t('reg.god')}
            value={filterGod}
            onChange={(e) => handleGodChange(e.target.value)}
            className="tabular"
          >
            <option value="">{t('reg.select_god')}</option>
            {godList.map((item) => (
              <option key={item.god_id} value={item.god_id}>
                {item.god_value}
              </option>
            ))}
          </Select>

          <Select
            label={t('reg.forma_obuch')}
            value={filterFormaObuch}
            onChange={(e) => handleFormaObuchChange(e.target.value)}
          >
            <option value="">{t('reg.select_forma_obuch')}</option>
            {formaObuchList.map((item) => (
              <option key={item.forma_obuch_id} value={item.forma_obuch_id}>
                {item.forma_obuch_name}
              </option>
            ))}
          </Select>

          <Select
            label={t('reg.gruppa')}
            value={filterGruppa}
            onChange={(e) => handleGruppaChange(e.target.value)}
            disabled={!canLoadGruppa || gruppaList.length === 0}
          >
            <option value="">{t('reg.select_gruppa')}</option>
            {gruppaList.map((item) => (
              <option key={item.id_kontingent} value={item.id_kontingent}>
                {item.gruppa_name}
              </option>
            ))}
          </Select>

          <Select
            label={t('reg.teacher')}
            value={filterTeacher}
            onChange={(e) => setFilterTeacher(e.target.value)}
          >
            <option value="">{t('reg.select_teacher')}</option>
            {teacherList.map((item) => (
              <option key={item.sotrudnik_id} value={item.sotrudnik_id}>
                {item.sotrudnik_fio}
              </option>
            ))}
          </Select>

          <Select
            label={t('reg.semestr')}
            value={filterSemestr}
            onChange={(e) => handleSemestrChange(e.target.value)}
            className="tabular"
          >
            <option value="">{t('reg.select_semestr')}</option>
            {semestrList.map((item) => (
              <option key={item.semestr_id} value={item.semestr_id}>
                {item.semestr_nomer}
              </option>
            ))}
          </Select>

          <Select
            label={t('reg.kurs')}
            value={filterKurs}
            onChange={(e) => handleKursChange(e.target.value)}
            className="tabular"
          >
            <option value="">{t('reg.select_kurs')}</option>
            {kursList.map((item) => (
              <option key={item.kurs_id} value={item.kurs_id}>
                {item.kurs_nomer}
              </option>
            ))}
          </Select>

          <Select
            label={t('reg.disciplina')}
            value={filterDisciplina}
            onChange={(e) => handleDisciplinaChange(e.target.value)}
            disabled={!canLoadDisciplina || disciplinaList.length === 0}
          >
            <option value="">{t('reg.select_disciplina')}</option>
            {disciplinaList.map((item) => (
              <option key={item.plan_id} value={item.plan_id}>
                {item.disciplina_name}
              </option>
            ))}
          </Select>

          <Select
            label={t('reg.vid_zanyatiya')}
            value={filterVidZanyatiya}
            onChange={(e) => handleVidZanyatiyaChange(e.target.value)}
            disabled={!canLoadVidZanyatiya || vidZanyatiyaList.length === 0}
          >
            <option value="">{t('reg.select_vid')}</option>
            {vidZanyatiyaList.map((item) => (
              <option key={item.plan_vid_zanyatiya_id} value={item.plan_vid_zanyatiya_id}>
                {item.vid_zanyatiya_name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button size="sm" variant="secondary" onClick={handleDeselectAll} disabled={!hasData}>
          {t('reg.deselect_all')}
        </Button>
        <Button size="sm" variant="secondary" icon="check" onClick={handleSelectAll} disabled={!hasData}>
          {t('reg.select_all')}
        </Button>
      </div>

      {!hasData ? (
        <div className="rounded-card border border-border bg-surface shadow-card">
          <EmptyState icon="search" title={t('reg.select_filter_prompt')} />
        </div>
      ) : (
        // Таблица широкая (7 видов занятий) — скроллим её саму, а не страницу.
        <div className="table-scroll rounded-card border border-border bg-surface shadow-card">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-surface-2 text-muted">
              <tr>
                <th scope="col" className="w-px border-b border-border px-4 py-2.5 text-center">
                  <input
                    type="checkbox"
                    className={CHECKBOX}
                    checked={allChecked}
                    onChange={(e) => handleCheckAll(e.target.checked)}
                    disabled={!hasData}
                    aria-label={t('reg.select_all')}
                  />
                </th>
                <th
                  scope="col"
                  className="w-px border-b border-border px-4 py-2.5 text-left text-xs
                    font-semibold tracking-wide uppercase whitespace-nowrap"
                >
                  {t('reg.num')}
                </th>
                <th
                  scope="col"
                  className="border-b border-border px-4 py-2.5 text-left text-xs
                    font-semibold tracking-wide uppercase whitespace-nowrap"
                >
                  {t('reg.fio')}
                </th>
                {vidColumns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className="border-b border-border px-4 py-2.5 text-center text-xs
                      font-semibold tracking-wide uppercase whitespace-nowrap"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, index) => (
                <tr
                  key={row.student_id}
                  className="border-b border-border transition-colors last:border-0 hover:bg-surface-2"
                >
                  <td className="px-4 py-2.5 text-center align-middle">
                    <input
                      type="checkbox"
                      className={CHECKBOX}
                      checked={selectedStudents.has(row.student_id)}
                      onChange={(e) => handleCheckStudent(row.student_id, e.target.checked)}
                      aria-label={row.student_fio}
                    />
                  </td>
                  <td className="tabular px-4 py-2.5 align-middle text-muted">{index + 1}</td>
                  <td className="px-4 py-2.5 align-middle whitespace-nowrap">{row.student_fio}</td>
                  {vidColumns.map((col) => (
                    <td key={col.key} className="px-4 py-2.5 text-center align-middle">
                      {row[col.key] ?? ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirmOpen}
        title={t('common.delete')}
        message={t('reg.confirm_delete')}
        confirmText={t('reg.yes')}
        cancelText={t('reg.no')}
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
      />
    </div>
  )
}
