import { useState, useEffect, useMemo } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  useVneplanovoePageQuery,
  useVneplanovoeTeorListQuery,
  useVneplanovoeExamListQuery,
  useVneplanovoeNedelyaSpisokQuery,
  useVneplanovoeVidZanyatiyaQuery,
  useVneplanovoeStudentsQuery,
  useVneplanovoeExamStudentsQuery,
  useSaveVneplanovoeSpravkaMutation,
  useDeleteVneplanovoeSpravkaMutation,
  useSaveVneplanovoeExamSpravkaMutation,
  type VneplanovoeTeorItem,
} from '@/features/vneplanovoe/vneplanovoeApi'
import { useT } from '@/shared/i18n/useT'
import { Input, Select } from '@/shared/ui/Field'
import Button from '@/shared/ui/Button'
import Spinner from '@/shared/ui/Spinner'
import ConfirmDialog from '@/shared/ui/ConfirmDialog'
import PageHeader from '@/shared/ui/PageHeader'
import EmptyState from '@/shared/ui/EmptyState'
import type { Id } from '@/shared/types/api'

type TabId = 'teor' | 'exam'

// Табы раздела: активный подсвечиваем мягкой заливкой бренда, а не рамкой —
// так строка табов читается одинаково во всех разделах.
const TAB_BASE =
  'rounded-control px-3 py-1.5 text-sm cursor-pointer transition-colors' +
  ' focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
const TAB_ACTIVE = 'bg-primary-soft text-primary font-medium'
const TAB_IDLE = 'text-muted hover:bg-surface-2 hover:text-fg'

// Чекбокса-примитива в дизайн-системе нет — держим классы в одном месте.
const CHECKBOX = 'size-4 cursor-pointer rounded border-border accent-primary'

/**
 * VneplanovoePage: Unscheduled exams/retakes management.
 * Matches behavior from unispace/src/views/ucheb/vneplanovoe.hbs (391 lines)
 *
 * Two tabs:
 * - Theoretical (Теоретическое обучение / Проф. практика) - for managing spravka with weeks/days
 * - Exam (Экзамен) - for managing exam spravka without weeks/days
 */
export default function VneplanovoePage() {
  const t = useT()
  const dispatch = useAppDispatch()

  // Tab state
  const [activeTab, setActiveTab] = useState<TabId>('teor')

  // Semester filters for each tab
  const [teorSemestr, setTeorSemestr] = useState<Id>('')
  const [examSemestr, setExamSemestr] = useState<Id>('')

  // Selected discipline+group
  const [selectedTeor, setSelectedTeor] = useState<VneplanovoeTeorItem | null>(null)
  const [selectedExam, setSelectedExam] = useState<VneplanovoeTeorItem | null>(null)

  // Week/day/vid for theoretical tab
  const [teorWeek, setTeorWeek] = useState<number | null>(null)
  const [teorDay, setTeorDay] = useState<number | null>(null)
  const [teorVid, setTeorVid] = useState<Id>('')

  // Checkbox state for students: Map<plan_student_id, checked>
  const [checkedTeor, setCheckedTeor] = useState<Set<Id>>(new Set())
  const [checkedExam, setCheckedExam] = useState<Set<Id>>(new Set())

  // Date inputs for students: Map<plan_student_id, { nachalo, konec }>
  const [teorDates, setTeorDates] = useState<Map<Id, { nachalo: string; konec: string }>>(new Map())
  const [examDates, setExamDates] = useState<Map<Id, { nachalo: string; konec: string }>>(new Map())

  // Delete confirmation dialog
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Load page data (semestr list, den list)
  const { data: pageData, isLoading: isPageLoading } = useVneplanovoePageQuery()
  const semestrList = pageData?.data?.semestr_list ?? []
  const denList = useMemo(() => pageData?.data?.den_list ?? [], [pageData?.data?.den_list])

  // Theoretical tab data
  const { data: teorList } = useVneplanovoeTeorListQuery({ id_semestr: teorSemestr }, { skip: !teorSemestr })

  const { data: nedelyaList } = useVneplanovoeNedelyaSpisokQuery(
    { kalendar_id: selectedTeor?.kalendar_id ?? '' },
    { skip: !selectedTeor?.kalendar_id },
  )

  const { data: vidList } = useVneplanovoeVidZanyatiyaQuery({ plan_id: selectedTeor?.plan_id ?? '' }, { skip: !selectedTeor?.plan_id })

  const {
    data: teorStudents,
    refetch: refetchTeorStudents,
    isFetching: isTeorStudentsFetching,
  } = useVneplanovoeStudentsQuery(
    {
      gruppa_id: selectedTeor?.gruppa_id ?? '',
      plan_sotrudnik_id: teorVid,
      id_nedelya: teorWeek,
      id_den: teorDay,
    },
    { skip: !selectedTeor?.gruppa_id || !teorVid },
  )

  // Exam tab data
  const { data: examList } = useVneplanovoeExamListQuery({ id_semestr: examSemestr }, { skip: !examSemestr })

  const {
    data: examStudents,
    refetch: refetchExamStudents,
    isFetching: isExamStudentsFetching,
  } = useVneplanovoeExamStudentsQuery(
    { gruppa_id: selectedExam?.gruppa_id ?? '', plan_id: selectedExam?.plan_id ?? '' },
    { skip: !selectedExam?.gruppa_id || !selectedExam?.plan_id },
  )

  // Mutations
  const [saveTeorSpravka, { isLoading: isSavingTeor }] = useSaveVneplanovoeSpravkaMutation()
  const [deleteTeorSpravka, { isLoading: isDeletingTeor }] = useDeleteVneplanovoeSpravkaMutation()
  const [saveExamSpravka, { isLoading: isSavingExam }] = useSaveVneplanovoeExamSpravkaMutation()

  // Initialize week/day/vid when data loads
  useEffect(() => {
    if (nedelyaList?.length && teorWeek === null) {
      setTeorWeek(nedelyaList[0].week_number)
    }
  }, [nedelyaList, teorWeek])

  useEffect(() => {
    if (denList.length && teorDay === null) {
      const todayNomer = new Date().getDay() || 7
      const day = denList.find((d) => d.den_nomer === todayNomer)
      if (day) setTeorDay(Number(day.den_id))
    }
  }, [denList, teorDay])

  useEffect(() => {
    if (vidList?.length && !teorVid) {
      setTeorVid(vidList[0].plan_sotrudnik_id)
    }
  }, [vidList, teorVid])

  // Reset state when theoretical selection changes
  const handleTeorSelect = (item: VneplanovoeTeorItem) => {
    setSelectedTeor(item)
    setTeorWeek(null)
    setTeorVid('')
    setCheckedTeor(new Set())
    setTeorDates(new Map())
  }

  // Reset state when exam selection changes
  const handleExamSelect = (item: VneplanovoeTeorItem) => {
    setSelectedExam(item)
    setCheckedExam(new Set())
    setExamDates(new Map())
  }

  // Handle check all for theoretical
  const handleTeorCheckAll = (checked: boolean) => {
    if (checked && teorStudents) {
      setCheckedTeor(new Set(teorStudents.map((s) => s.plan_student_id)))
    } else {
      setCheckedTeor(new Set())
    }
  }

  // Handle check all for exam
  const handleExamCheckAll = (checked: boolean) => {
    if (checked && examStudents) {
      setCheckedExam(new Set(examStudents.map((s) => s.plan_student_id)))
    } else {
      setCheckedExam(new Set())
    }
  }

  // Handle individual checkbox for theoretical
  const handleTeorCheck = (planStudentId: Id, checked: boolean) => {
    setCheckedTeor((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(planStudentId)
      } else {
        next.delete(planStudentId)
      }
      return next
    })
  }

  // Handle individual checkbox for exam
  const handleExamCheck = (planStudentId: Id, checked: boolean) => {
    setCheckedExam((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(planStudentId)
      } else {
        next.delete(planStudentId)
      }
      return next
    })
  }

  // Handle date change for theoretical
  const handleTeorDateChange = (planStudentId: Id, field: 'nachalo' | 'konec', value: string) => {
    setTeorDates((prev) => {
      const next = new Map(prev)
      const current = next.get(planStudentId) ?? { nachalo: '', konec: '' }
      current[field] = value
      next.set(planStudentId, current)
      return next
    })
  }

  // Handle date change for exam
  const handleExamDateChange = (planStudentId: Id, field: 'nachalo' | 'konec', value: string) => {
    setExamDates((prev) => {
      const next = new Map(prev)
      const current = next.get(planStudentId) ?? { nachalo: '', konec: '' }
      current[field] = value
      next.set(planStudentId, current)
      return next
    })
  }

  // Save theoretical spravka
  const handleSaveTeor = async () => {
    if (teorWeek === null || teorDay === null) {
      dispatch(toastPushed('error', t('vneplanovoe.select_week_day')))
      return
    }

    const selectedIds = Array.from(checkedTeor)
    if (!selectedIds.length) {
      dispatch(toastPushed('error', t('vneplanovoe.select_students')))
      return
    }

    const nachaloList: string[] = []
    const konecList: string[] = []

    selectedIds.forEach((id) => {
      const dates = teorDates.get(id) ?? { nachalo: '', konec: '' }
      const student = teorStudents?.find((s) => s.plan_student_id === id)
      nachaloList.push(dates.nachalo || student?.spravka_nachalo || '')
      konecList.push(dates.konec || student?.spravka_konec || '')
    })

    try {
      const result = await saveTeorSpravka({
        plan_student_ids: selectedIds,
        id_nedelya: teorWeek,
        id_den: teorDay,
        nachalo_list: nachaloList,
        konec_list: konecList,
      }).unwrap()

      if (result.ok) {
        dispatch(toastPushed('success', t('common.saved')))
        setCheckedTeor(new Set())
        setTeorDates(new Map())
        refetchTeorStudents()
      } else {
        dispatch(toastPushed('error', t('common.error')))
      }
    } catch {
      dispatch(toastPushed('error', t('common.error')))
    }
  }

  // Delete theoretical spravka - show confirmation dialog
  const handleDeleteTeorClick = () => {
    if (teorWeek === null || teorDay === null) {
      dispatch(toastPushed('error', t('vneplanovoe.select_week_day')))
      return
    }

    const selectedIds = Array.from(checkedTeor)
    if (!selectedIds.length) {
      dispatch(toastPushed('error', t('vneplanovoe.select_students')))
      return
    }

    setShowDeleteConfirm(true)
  }

  // Confirm delete theoretical spravka
  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false)

    // Guard against state changes between dialog open and confirm
    if (teorWeek === null || teorDay === null) return

    try {
      const result = await deleteTeorSpravka({
        plan_student_ids: Array.from(checkedTeor),
        id_nedelya: teorWeek,
        id_den: teorDay,
      }).unwrap()

      if (result.ok) {
        dispatch(toastPushed('success', t('common.deleted')))
        setCheckedTeor(new Set())
        setTeorDates(new Map())
        refetchTeorStudents()
      } else {
        dispatch(toastPushed('error', t('common.error')))
      }
    } catch {
      dispatch(toastPushed('error', t('common.error')))
    }
  }

  // Save exam spravka
  const handleSaveExam = async () => {
    const selectedIds = Array.from(checkedExam)
    if (!selectedIds.length) {
      dispatch(toastPushed('error', t('vneplanovoe.select_students')))
      return
    }

    const nachaloList: string[] = []
    const konecList: string[] = []

    selectedIds.forEach((id) => {
      const dates = examDates.get(id) ?? { nachalo: '', konec: '' }
      const student = examStudents?.find((s) => s.plan_student_id === id)
      nachaloList.push(dates.nachalo || student?.spravka_nachalo || '')
      konecList.push(dates.konec || student?.spravka_konec || '')
    })

    try {
      const result = await saveExamSpravka({
        plan_student_ids: selectedIds,
        nachalo_list: nachaloList,
        konec_list: konecList,
      }).unwrap()

      if (result.ok) {
        dispatch(toastPushed('success', t('common.saved')))
        setCheckedExam(new Set())
        setExamDates(new Map())
        refetchExamStudents()
      } else {
        dispatch(toastPushed('error', t('common.error')))
      }
    } catch {
      dispatch(toastPushed('error', t('common.error')))
    }
  }

  // Пока грузятся справочники, показываем только шапку со спиннером.
  if (isPageLoading) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title={t('nav.vneplanovoe')} busy />
      </div>
    )
  }

  const tabs: { id: TabId; labelKey: string }[] = [
    { id: 'teor', labelKey: 'vneplanovoe.tab_teor' },
    { id: 'exam', labelKey: 'vneplanovoe.tab_exam' },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={t('nav.vneplanovoe')} />

      {/* Строка табов */}
      <div className="flex flex-wrap gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`${TAB_BASE} ${activeTab === tab.id ? TAB_ACTIVE : TAB_IDLE}`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Theoretical Tab */}
      {activeTab === 'teor' && (
        <>
          <div className="rounded-card border border-border bg-surface p-4 shadow-card">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <Select
                label={t('jurnal.semestr')}
                value={teorSemestr}
                onChange={(e) => {
                  setTeorSemestr(e.target.value)
                  setSelectedTeor(null)
                  setTeorWeek(null)
                  setTeorVid('')
                }}
                className="tabular"
              >
                <option value="">{t('jurnal.select_semestr')}</option>
                {semestrList.map((s) => (
                  <option key={s.semestr_id} value={s.semestr_id}>
                    {s.semestr_nomer}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
            {/* Discipline list */}
            <div className="rounded-card border border-border bg-surface p-2 shadow-card">
              {!teorSemestr || !teorList?.length ? (
                <EmptyState icon="search" title={t('jurnal.select_filter_prompt')} />
              ) : (
                <div className="flex flex-col gap-1">
                  {teorList.map((item) => {
                    const isSelected =
                      selectedTeor?.plan_id === item.plan_id && selectedTeor?.gruppa_id === item.gruppa_id
                    return (
                      <Button
                        key={`${item.plan_id}-${item.gruppa_id}`}
                        variant={isSelected ? 'primary' : 'ghost'}
                        onClick={() => handleTeorSelect(item)}
                        title={item.gruppa_disciplina_name}
                        className="w-full justify-start text-left"
                      >
                        <span className="min-w-0 truncate">{item.gruppa_disciplina_name}</span>
                      </Button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Students */}
            <div className="flex min-w-0 flex-col gap-4">
              {!selectedTeor ? (
                <div className="rounded-card border border-border bg-surface shadow-card">
                  <EmptyState icon="search" title={t('jurnal.select_filter_prompt')} />
                </div>
              ) : (
                <>
                  <div className="rounded-card border border-border bg-surface p-4 shadow-card">
                    <h2 className="mb-3 text-sm font-semibold">{selectedTeor.gruppa_disciplina_name}</h2>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <Select
                        label={t('vneplanovoe.week')}
                        value={teorWeek?.toString() ?? ''}
                        onChange={(e) => setTeorWeek(e.target.value ? Number(e.target.value) : null)}
                        className="tabular"
                      >
                        {nedelyaList?.map((w) => (
                          <option key={w.week_number} value={w.week_number}>
                            {t('vneplanovoe.week')} {w.week_number}: {w.week_start} - {w.week_end}
                          </option>
                        ))}
                      </Select>

                      <Select
                        label={t('vneplanovoe.day')}
                        value={teorDay?.toString() ?? ''}
                        onChange={(e) => setTeorDay(e.target.value ? Number(e.target.value) : null)}
                      >
                        {denList.map((d) => (
                          <option key={d.den_id} value={d.den_id}>
                            {d.den_short}
                          </option>
                        ))}
                      </Select>

                      <Select
                        label={t('vneplanovoe.vid_zanyatiya')}
                        value={teorVid}
                        onChange={(e) => setTeorVid(e.target.value)}
                      >
                        {vidList?.map((v) => (
                          <option key={v.plan_sotrudnik_id} value={v.plan_sotrudnik_id}>
                            {v.vid_zanyatiya_name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  {isTeorStudentsFetching ? (
                    <div className="flex justify-center py-8">
                      <Spinner />
                    </div>
                  ) : !teorStudents?.length ? (
                    <div className="rounded-card border border-border bg-surface shadow-card">
                      <EmptyState title={t('vneplanovoe.no_students')} />
                    </div>
                  ) : (
                    <>
                      <SpravkaTable
                        students={teorStudents}
                        checked={checkedTeor}
                        dates={teorDates}
                        onCheckAll={handleTeorCheckAll}
                        onCheck={handleTeorCheck}
                        onDateChange={handleTeorDateChange}
                      />

                      <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="secondary" icon="trash" onClick={handleDeleteTeorClick} loading={isDeletingTeor}>
                          {t('vneplanovoe.delete')}
                        </Button>
                        <Button onClick={handleSaveTeor} loading={isSavingTeor}>
                          {t('vneplanovoe.create')}
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Exam Tab */}
      {activeTab === 'exam' && (
        <>
          <div className="rounded-card border border-border bg-surface p-4 shadow-card">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <Select
                label={t('jurnal.semestr')}
                value={examSemestr}
                onChange={(e) => {
                  setExamSemestr(e.target.value)
                  setSelectedExam(null)
                }}
                className="tabular"
              >
                <option value="">{t('jurnal.select_semestr')}</option>
                {semestrList.map((s) => (
                  <option key={s.semestr_id} value={s.semestr_id}>
                    {s.semestr_nomer}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
            {/* Discipline list */}
            <div className="rounded-card border border-border bg-surface p-2 shadow-card">
              {!examSemestr || !examList?.length ? (
                <EmptyState icon="search" title={t('jurnal.select_filter_prompt')} />
              ) : (
                <div className="flex flex-col gap-1">
                  {examList.map((item) => {
                    const isSelected =
                      selectedExam?.plan_id === item.plan_id && selectedExam?.gruppa_id === item.gruppa_id
                    return (
                      <Button
                        key={`${item.plan_id}-${item.gruppa_id}`}
                        variant={isSelected ? 'primary' : 'ghost'}
                        onClick={() => handleExamSelect(item)}
                        title={item.gruppa_disciplina_name}
                        className="w-full justify-start text-left"
                      >
                        <span className="min-w-0 truncate">{item.gruppa_disciplina_name}</span>
                      </Button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Students */}
            <div className="flex min-w-0 flex-col gap-4">
              {!selectedExam ? (
                <div className="rounded-card border border-border bg-surface shadow-card">
                  <EmptyState icon="search" title={t('jurnal.select_filter_prompt')} />
                </div>
              ) : (
                <>
                  <h2 className="text-sm font-semibold">{selectedExam.gruppa_disciplina_name}</h2>

                  {isExamStudentsFetching ? (
                    <div className="flex justify-center py-8">
                      <Spinner />
                    </div>
                  ) : !examStudents?.length ? (
                    <div className="rounded-card border border-border bg-surface shadow-card">
                      <EmptyState title={t('vneplanovoe.no_students')} />
                    </div>
                  ) : (
                    <>
                      <SpravkaTable
                        students={examStudents}
                        checked={checkedExam}
                        dates={examDates}
                        onCheckAll={handleExamCheckAll}
                        onCheck={handleExamCheck}
                        onDateChange={handleExamDateChange}
                      />

                      <div className="flex justify-end">
                        <Button onClick={handleSaveExam} loading={isSavingExam}>
                          {t('vneplanovoe.create')}
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title={t('common.delete')}
        message={t('vneplanovoe.confirm_delete')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        loading={isDeletingTeor}
      />
    </div>
  )
}

interface SpravkaStudent {
  plan_student_id: Id
  student_fio: string
  spravka_nachalo?: string | null
  spravka_konec?: string | null
}

interface SpravkaTableProps {
  students: SpravkaStudent[]
  checked: Set<Id>
  dates: Map<Id, { nachalo: string; konec: string }>
  onCheckAll: (checked: boolean) => void
  onCheck: (planStudentId: Id, checked: boolean) => void
  onDateChange: (planStudentId: Id, field: 'nachalo' | 'konec', value: string) => void
}

/**
 * Таблица студентов со сроками справки — одинаковая для обеих вкладок,
 * поэтому вынесена в общий компонент, а не продублирована.
 */
function SpravkaTable({ students, checked, dates, onCheckAll, onCheck, onDateChange }: SpravkaTableProps) {
  const t = useT()
  const allChecked = students.length > 0 && checked.size === students.length

  return (
    // Скроллим таблицу внутри контейнера, страница вбок не едет.
    <div className="table-scroll rounded-card border border-border bg-surface shadow-card">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-surface-2 text-muted">
          <tr>
            <th scope="col" className="w-px border-b border-border px-4 py-2.5 text-center">
              <input
                type="checkbox"
                className={CHECKBOX}
                checked={allChecked}
                onChange={(e) => onCheckAll(e.target.checked)}
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
              {t('vneplanovoe.fio')}
            </th>
            <th
              scope="col"
              className="border-b border-border px-4 py-2.5 text-left text-xs
                font-semibold tracking-wide uppercase whitespace-nowrap"
            >
              {t('vneplanovoe.date_start')}
            </th>
            <th
              scope="col"
              className="border-b border-border px-4 py-2.5 text-left text-xs
                font-semibold tracking-wide uppercase whitespace-nowrap"
            >
              {t('vneplanovoe.date_end')}
            </th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, i) => {
            const rowDates = dates.get(student.plan_student_id)
            return (
              <tr
                key={student.plan_student_id}
                className="border-b border-border transition-colors last:border-0 hover:bg-surface-2"
              >
                <td className="px-4 py-2 text-center align-middle">
                  <input
                    type="checkbox"
                    className={CHECKBOX}
                    checked={checked.has(student.plan_student_id)}
                    onChange={(e) => onCheck(student.plan_student_id, e.target.checked)}
                    aria-label={student.student_fio}
                  />
                </td>
                <td className="tabular px-4 py-2 align-middle text-muted">{i + 1}</td>
                <td className="px-4 py-2 align-middle whitespace-nowrap">{student.student_fio}</td>
                <td className="px-4 py-2 align-middle">
                  <div className="w-40">
                    <Input
                      type="date"
                      className="tabular"
                      aria-label={t('vneplanovoe.date_start')}
                      value={rowDates?.nachalo ?? student.spravka_nachalo ?? ''}
                      onChange={(e) => onDateChange(student.plan_student_id, 'nachalo', e.target.value)}
                    />
                  </div>
                </td>
                <td className="px-4 py-2 align-middle">
                  <div className="w-40">
                    <Input
                      type="date"
                      className="tabular"
                      aria-label={t('vneplanovoe.date_end')}
                      value={rowDates?.konec ?? student.spravka_konec ?? ''}
                      onChange={(e) => onDateChange(student.plan_student_id, 'konec', e.target.value)}
                    />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
