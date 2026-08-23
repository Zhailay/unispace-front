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
import { Select } from '@/shared/ui/Field'
import Button from '@/shared/ui/Button'
import Spinner from '@/shared/ui/Spinner'
import ConfirmDialog from '@/shared/ui/ConfirmDialog'
import type { Id } from '@/shared/types/api'

type TabId = 'teor' | 'exam'

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

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    )
  }

  const tabs: { id: TabId; labelKey: string }[] = [
    { id: 'teor', labelKey: 'vneplanovoe.tab_teor' },
    { id: 'exam', labelKey: 'vneplanovoe.tab_exam' },
  ]

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{t('nav.vneplanovoe')}</h1>

      {/* Main Card */}
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        {/* Header with tabs */}
        <div className="border-b border-border bg-surface px-4 pt-3">
          <div className="flex flex-wrap gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 px-3 py-2 text-sm transition-colors ${
                  activeTab === tab.id ? 'border-primary font-medium text-fg' : 'border-transparent text-muted hover:border-muted hover:text-fg'
                }`}
              >
                {t(tab.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="p-4">
          {/* Theoretical Tab */}
          {activeTab === 'teor' && (
            <div>
              {/* Semester filter */}
              <div className="mb-4 w-48">
                <label className="mb-1 block text-xs text-muted">{t('jurnal.semestr')}</label>
                <Select
                  value={teorSemestr}
                  onChange={(e) => {
                    setTeorSemestr(e.target.value)
                    setSelectedTeor(null)
                    setTeorWeek(null)
                    setTeorVid('')
                  }}
                >
                  <option value="">{t('jurnal.select_semestr')}</option>
                  {semestrList.map((s) => (
                    <option key={s.semestr_id} value={s.semestr_id}>
                      {s.semestr_nomer}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex gap-0">
                {/* Discipline list */}
                <div className="w-1/3 min-w-60 border-r border-border pr-4" style={{ minHeight: 200 }}>
                  {!teorSemestr ? (
                    <p className="py-4 text-center text-muted">{t('jurnal.select_filter_prompt')}</p>
                  ) : !teorList?.length ? (
                    <p className="py-4 text-center text-muted">{t('jurnal.select_filter_prompt')}</p>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      {teorList.map((item) => (
                        <button
                          key={`${item.plan_id}-${item.gruppa_id}`}
                          onClick={() => handleTeorSelect(item)}
                          className={`rounded px-3 py-2 text-left text-sm transition-colors ${
                            selectedTeor?.plan_id === item.plan_id && selectedTeor?.gruppa_id === item.gruppa_id
                              ? 'bg-primary text-primary-fg'
                              : 'hover:bg-bg'
                          }`}
                        >
                          {item.gruppa_disciplina_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Students table */}
                <div className="flex-1 pl-4">
                  {!selectedTeor ? (
                    <p className="py-8 text-center text-muted">{t('jurnal.select_filter_prompt')}</p>
                  ) : (
                    <>
                      <h6 className="mb-3 text-sm font-semibold">{selectedTeor.gruppa_disciplina_name}</h6>

                      {/* Filters */}
                      <div className="mb-3 flex flex-wrap items-end gap-3">
                        <div>
                          <label className="mb-1 block text-xs text-muted">{t('vneplanovoe.week')}</label>
                          <Select value={teorWeek?.toString() ?? ''} onChange={(e) => setTeorWeek(e.target.value ? Number(e.target.value) : null)} className="w-64">
                            {nedelyaList?.map((w) => (
                              <option key={w.week_number} value={w.week_number}>
                                {t('vneplanovoe.week')} {w.week_number}: {w.week_start} - {w.week_end}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-muted">{t('vneplanovoe.day')}</label>
                          <Select value={teorDay?.toString() ?? ''} onChange={(e) => setTeorDay(e.target.value ? Number(e.target.value) : null)} className="w-auto">
                            {denList.map((d) => (
                              <option key={d.den_id} value={d.den_id}>
                                {d.den_short}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-muted">{t('vneplanovoe.vid_zanyatiya')}</label>
                          <Select value={teorVid} onChange={(e) => setTeorVid(e.target.value)} className="w-auto">
                            {vidList?.map((v) => (
                              <option key={v.plan_sotrudnik_id} value={v.plan_sotrudnik_id}>
                                {v.vid_zanyatiya_name}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </div>

                      {/* Students table */}
                      {isTeorStudentsFetching ? (
                        <div className="flex justify-center py-4">
                          <Spinner />
                        </div>
                      ) : !teorStudents?.length ? (
                        <p className="py-4 text-center text-muted">{t('vneplanovoe.no_students')}</p>
                      ) : (
                        <>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                              <thead className="bg-surface">
                                <tr className="border-b border-border">
                                  <th className="px-2 py-2 text-center" style={{ width: 40 }}>
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4"
                                      checked={teorStudents.length > 0 && checkedTeor.size === teorStudents.length}
                                      onChange={(e) => handleTeorCheckAll(e.target.checked)}
                                    />
                                  </th>
                                  <th className="px-2 py-2 text-center" style={{ width: 46 }}>
                                    #
                                  </th>
                                  <th className="px-3 py-2 text-left">{t('vneplanovoe.fio')}</th>
                                  <th className="px-2 py-2 text-center" style={{ width: 150 }}>
                                    {t('vneplanovoe.date_start')}
                                  </th>
                                  <th className="px-2 py-2 text-center" style={{ width: 150 }}>
                                    {t('vneplanovoe.date_end')}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {teorStudents.map((student, i) => {
                                  const dates = teorDates.get(student.plan_student_id)
                                  return (
                                    <tr key={student.plan_student_id} className="border-b border-border">
                                      <td className="px-2 py-1 text-center">
                                        <input
                                          type="checkbox"
                                          className="h-4 w-4"
                                          checked={checkedTeor.has(student.plan_student_id)}
                                          onChange={(e) => handleTeorCheck(student.plan_student_id, e.target.checked)}
                                        />
                                      </td>
                                      <td className="px-2 py-1 text-center text-muted">{i + 1}</td>
                                      <td className="px-3 py-1">{student.student_fio}</td>
                                      <td className="px-2 py-1">
                                        <input
                                          type="date"
                                          className="w-full rounded border border-border bg-bg px-2 py-1 text-sm"
                                          value={dates?.nachalo ?? student.spravka_nachalo ?? ''}
                                          onChange={(e) => handleTeorDateChange(student.plan_student_id, 'nachalo', e.target.value)}
                                        />
                                      </td>
                                      <td className="px-2 py-1">
                                        <input
                                          type="date"
                                          className="w-full rounded border border-border bg-bg px-2 py-1 text-sm"
                                          value={dates?.konec ?? student.spravka_konec ?? ''}
                                          onChange={(e) => handleTeorDateChange(student.plan_student_id, 'konec', e.target.value)}
                                        />
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>

                          <div className="mt-4 flex gap-2">
                            <Button onClick={handleSaveTeor} loading={isSavingTeor}>
                              {t('vneplanovoe.create')}
                            </Button>
                            <Button variant="secondary" onClick={handleDeleteTeorClick} loading={isDeletingTeor}>
                              {t('vneplanovoe.delete')}
                            </Button>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Exam Tab */}
          {activeTab === 'exam' && (
            <div>
              {/* Semester filter */}
              <div className="mb-4 w-48">
                <label className="mb-1 block text-xs text-muted">{t('jurnal.semestr')}</label>
                <Select
                  value={examSemestr}
                  onChange={(e) => {
                    setExamSemestr(e.target.value)
                    setSelectedExam(null)
                  }}
                >
                  <option value="">{t('jurnal.select_semestr')}</option>
                  {semestrList.map((s) => (
                    <option key={s.semestr_id} value={s.semestr_id}>
                      {s.semestr_nomer}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex gap-0">
                {/* Discipline list */}
                <div className="w-1/3 min-w-60 border-r border-border pr-4" style={{ minHeight: 200 }}>
                  {!examSemestr ? (
                    <p className="py-4 text-center text-muted">{t('jurnal.select_filter_prompt')}</p>
                  ) : !examList?.length ? (
                    <p className="py-4 text-center text-muted">{t('jurnal.select_filter_prompt')}</p>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      {examList.map((item) => (
                        <button
                          key={`${item.plan_id}-${item.gruppa_id}`}
                          onClick={() => handleExamSelect(item)}
                          className={`rounded px-3 py-2 text-left text-sm transition-colors ${
                            selectedExam?.plan_id === item.plan_id && selectedExam?.gruppa_id === item.gruppa_id
                              ? 'bg-primary text-primary-fg'
                              : 'hover:bg-bg'
                          }`}
                        >
                          {item.gruppa_disciplina_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Students table */}
                <div className="flex-1 pl-4">
                  {!selectedExam ? (
                    <p className="py-8 text-center text-muted">{t('jurnal.select_filter_prompt')}</p>
                  ) : (
                    <>
                      <h6 className="mb-3 text-sm font-semibold">{selectedExam.gruppa_disciplina_name}</h6>

                      {/* Students table */}
                      {isExamStudentsFetching ? (
                        <div className="flex justify-center py-4">
                          <Spinner />
                        </div>
                      ) : !examStudents?.length ? (
                        <p className="py-4 text-center text-muted">{t('vneplanovoe.no_students')}</p>
                      ) : (
                        <>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                              <thead className="bg-surface">
                                <tr className="border-b border-border">
                                  <th className="px-2 py-2 text-center" style={{ width: 40 }}>
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4"
                                      checked={examStudents.length > 0 && checkedExam.size === examStudents.length}
                                      onChange={(e) => handleExamCheckAll(e.target.checked)}
                                    />
                                  </th>
                                  <th className="px-2 py-2 text-center" style={{ width: 46 }}>
                                    #
                                  </th>
                                  <th className="px-3 py-2 text-left">{t('vneplanovoe.fio')}</th>
                                  <th className="px-2 py-2 text-center" style={{ width: 150 }}>
                                    {t('vneplanovoe.date_start')}
                                  </th>
                                  <th className="px-2 py-2 text-center" style={{ width: 150 }}>
                                    {t('vneplanovoe.date_end')}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {examStudents.map((student, i) => {
                                  const dates = examDates.get(student.plan_student_id)
                                  return (
                                    <tr key={student.plan_student_id} className="border-b border-border">
                                      <td className="px-2 py-1 text-center">
                                        <input
                                          type="checkbox"
                                          className="h-4 w-4"
                                          checked={checkedExam.has(student.plan_student_id)}
                                          onChange={(e) => handleExamCheck(student.plan_student_id, e.target.checked)}
                                        />
                                      </td>
                                      <td className="px-2 py-1 text-center text-muted">{i + 1}</td>
                                      <td className="px-3 py-1">{student.student_fio}</td>
                                      <td className="px-2 py-1">
                                        <input
                                          type="date"
                                          className="w-full rounded border border-border bg-bg px-2 py-1 text-sm"
                                          value={dates?.nachalo ?? student.spravka_nachalo ?? ''}
                                          onChange={(e) => handleExamDateChange(student.plan_student_id, 'nachalo', e.target.value)}
                                        />
                                      </td>
                                      <td className="px-2 py-1">
                                        <input
                                          type="date"
                                          className="w-full rounded border border-border bg-bg px-2 py-1 text-sm"
                                          value={dates?.konec ?? student.spravka_konec ?? ''}
                                          onChange={(e) => handleExamDateChange(student.plan_student_id, 'konec', e.target.value)}
                                        />
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>

                          <div className="mt-4 flex gap-2">
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
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title={t('common.delete')}
        message={t('vneplanovoe.confirm_delete')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
      />
    </div>
  )
}
