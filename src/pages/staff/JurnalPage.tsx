import { useState, useMemo, useCallback, useEffect, Fragment } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  useJurnalPageQuery,
  useJurnalTkListQuery,
  useJurnalPraktikaListQuery,
  useJurnalItogListQuery,
  useJurnalAvailableWeeksQuery,
  useJurnalStudentsQuery,
  useJurnalR1StudentsQuery,
  useJurnalR2StudentsQuery,
  useJurnalWeekDetailQuery,
  useJurnalExamStudentsQuery,
  useJurnalKalendarItogQuery,
  useSaveJurnalGradesMutation,
  type JurnalGruppaItem,
  type JurnalStudentRow,
  type AvailableWeek,
  type GradeEntry,
} from '@/features/jurnal/jurnalApi'
import Modal from '@/shared/ui/Modal'
import type { Id } from '@/shared/types/api'
import { useT } from '@/shared/i18n/useT'
import Button from '@/shared/ui/Button'
import { Select } from '@/shared/ui/Field'
import Spinner from '@/shared/ui/Spinner'

type TabId = 'tk' | 'r1' | 'r2' | 'exam' | 'pp' | 'ia'

/** Vid zanyatiya columns configuration */
const VID_COLS = [
  { key: 'ps_id_lk', chasyKey: 'chasy_lk', ballKey: 'ball_lk', kommentKey: 'komment_lk', propuskKey: 'propusk_lk', label: 'LK' },
  { key: 'ps_id_pz', chasyKey: 'chasy_pz', ballKey: 'ball_pz', kommentKey: 'komment_pz', propuskKey: 'propusk_pz', label: 'PZ' },
  { key: 'ps_id_lz', chasyKey: 'chasy_lz', ballKey: 'ball_lz', kommentKey: 'komment_lz', propuskKey: 'propusk_lz', label: 'LZ' },
  { key: 'ps_id_srs', chasyKey: 'chasy_srs', ballKey: 'ball_srs', kommentKey: 'komment_srs', propuskKey: 'propusk_srs', label: 'SRS' },
  { key: 'ps_id_srsp', chasyKey: 'chasy_srsp', ballKey: 'ball_srsp', kommentKey: 'komment_srsp', propuskKey: 'propusk_srsp', label: 'SRSP' },
  { key: 'ps_id_fz', chasyKey: 'chasy_fz', ballKey: 'ball_fz', kommentKey: 'komment_fz', propuskKey: 'propusk_fz', label: 'FZ' },
  { key: 'ps_id_lpz', chasyKey: 'chasy_lpz', ballKey: 'ball_lpz', kommentKey: 'komment_lpz', propuskKey: 'propusk_lpz', label: 'LPZ' },
] as const

type VidColKey = (typeof VID_COLS)[number]['key']
type VidColBallKey = (typeof VID_COLS)[number]['ballKey']
type VidColKommentKey = (typeof VID_COLS)[number]['kommentKey']
type VidColPropuskKey = (typeof VID_COLS)[number]['propuskKey']

/**
 * JurnalPage: Academic journal/gradebook.
 * Matches behavior from unispace/src/views/ucheb/jurnal.hbs (921 lines)
 */
export default function JurnalPage() {
  const t = useT()
  const dispatch = useAppDispatch()

  // Tab state
  const [activeTab, setActiveTab] = useState<TabId>('tk')

  // Semester filter (shared by all tabs)
  const [filterSemestr, setFilterSemestr] = useState<Id>('')

  // Selected discipline+group per tab
  const [selectedTk, setSelectedTk] = useState<JurnalGruppaItem | null>(null)
  const [selectedPp, setSelectedPp] = useState<JurnalGruppaItem | null>(null)
  const [selectedIa, setSelectedIa] = useState<JurnalGruppaItem | null>(null)
  const [selectedExam, setSelectedExam] = useState<JurnalGruppaItem | null>(null)
  const [selectedR1, setSelectedR1] = useState<JurnalGruppaItem | null>(null)
  const [selectedR2, setSelectedR2] = useState<JurnalGruppaItem | null>(null)

  // Week and day for TK/PP
  const [tkWeek, setTkWeek] = useState<number | null>(null)
  const [tkDay, setTkDay] = useState<number | null>(null)
  const [ppWeek, setPpWeek] = useState<number | null>(null)
  const [ppDay, setPpDay] = useState<number | null>(null)

  // Grade edits state: Map<ps_id, { ball, komment, propusk }>
  const [gradeEdits, setGradeEdits] = useState<Map<Id, { ball: number | null; komment: string; propusk: number }>>(new Map())

  // Week detail modal state
  const [weekDetailOpen, setWeekDetailOpen] = useState(false)
  const [weekDetailParams, setWeekDetailParams] = useState<{ studentId: Id; planId: Id; weekNum: number; fio: string } | null>(null)

  // Load page data (semestr list, den list)
  const { data: pageData, isLoading: isPageLoading } = useJurnalPageQuery()

  const semestrList = pageData?.data?.semestr_list ?? []
  const denList = useMemo(() => pageData?.data?.den_list ?? [], [pageData?.data?.den_list])

  // TK list
  const { data: tkList } = useJurnalTkListQuery({ id_semestr: filterSemestr }, { skip: !filterSemestr })

  // Praktika list
  const { data: ppList } = useJurnalPraktikaListQuery({ id_semestr: filterSemestr }, { skip: !filterSemestr || activeTab !== 'pp' })

  // Itog list (for IA tab)
  const { data: iaList } = useJurnalItogListQuery({ id_semestr: filterSemestr }, { skip: !filterSemestr || activeTab !== 'ia' })

  // Available weeks for TK
  const { data: tkWeeks } = useJurnalAvailableWeeksQuery(
    { kalendar_id: selectedTk?.kalendar_id ?? '', plan_id: selectedTk?.plan_id ?? '', gruppa_id: selectedTk?.gruppa_id ?? '' },
    { skip: !selectedTk },
  )

  // Available weeks for PP
  const { data: ppWeeks } = useJurnalAvailableWeeksQuery(
    { kalendar_id: selectedPp?.kalendar_id ?? '', plan_id: selectedPp?.plan_id ?? '', gruppa_id: selectedPp?.gruppa_id ?? '' },
    { skip: !selectedPp },
  )

  // Students for TK
  const { data: tkStudents, refetch: refetchTkStudents } = useJurnalStudentsQuery(
    { plan_id: selectedTk?.plan_id ?? '', gruppa_id: selectedTk?.gruppa_id ?? '', id_nedelya: tkWeek, id_den: tkDay },
    { skip: !selectedTk || tkWeek === null || tkDay === null },
  )

  // Students for PP
  const { data: ppStudents, refetch: refetchPpStudents } = useJurnalStudentsQuery(
    { plan_id: selectedPp?.plan_id ?? '', gruppa_id: selectedPp?.gruppa_id ?? '', id_nedelya: ppWeek, id_den: ppDay },
    { skip: !selectedPp || ppWeek === null || ppDay === null },
  )

  // R1 students
  const { data: r1Students } = useJurnalR1StudentsQuery(
    { plan_id: selectedR1?.plan_id ?? '', gruppa_id: selectedR1?.gruppa_id ?? '' },
    { skip: !selectedR1 },
  )

  // R2 students
  const { data: r2Students } = useJurnalR2StudentsQuery(
    { plan_id: selectedR2?.plan_id ?? '', gruppa_id: selectedR2?.gruppa_id ?? '' },
    { skip: !selectedR2 },
  )

  // Exam students
  const { data: examStudents, refetch: refetchExamStudents } = useJurnalExamStudentsQuery(
    { plan_id: selectedExam?.plan_id ?? '', gruppa_id: selectedExam?.gruppa_id ?? '', kalendar_id: selectedExam?.kalendar_id },
    { skip: !selectedExam },
  )

  // IA students
  const { data: iaStudents, refetch: refetchIaStudents } = useJurnalExamStudentsQuery(
    { plan_id: selectedIa?.plan_id ?? '', gruppa_id: selectedIa?.gruppa_id ?? '', jurnal_type: 1 },
    { skip: !selectedIa },
  )

  // Kalendar itog for exam
  const { data: examKalendarItog } = useJurnalKalendarItogQuery(
    { kalendar_id: selectedExam?.kalendar_id ?? '' },
    { skip: !selectedExam?.kalendar_id },
  )

  // Kalendar itog for IA
  const { data: iaKalendarItog } = useJurnalKalendarItogQuery(
    { kalendar_id: selectedIa?.kalendar_id ?? '' },
    { skip: !selectedIa?.kalendar_id },
  )

  // Week detail
  const { data: weekDetail, isFetching: isWeekDetailFetching } = useJurnalWeekDetailQuery(
    { student_id: weekDetailParams?.studentId ?? '', plan_id: weekDetailParams?.planId ?? '', week_num: weekDetailParams?.weekNum ?? 0 },
    { skip: !weekDetailParams },
  )

  const [saveGrades, { isLoading: isSaving }] = useSaveJurnalGradesMutation()

  // Initialize week/day when weeks load
  useEffect(() => {
    if (tkWeeks?.length && tkWeek === null) {
      const current = tkWeeks.find((w) => w.is_current) ?? tkWeeks[0]
      setTkWeek(current.week_number)
      // Default to today's day of week
      const todayNomer = new Date().getDay() || 7
      const day = denList.find((d) => d.den_nomer === todayNomer)
      if (day) setTkDay(Number(day.den_id))
    }
  }, [tkWeeks, tkWeek, denList])

  useEffect(() => {
    if (ppWeeks?.length && ppWeek === null) {
      const current = ppWeeks.find((w) => w.is_current) ?? ppWeeks[0]
      setPpWeek(current.week_number)
      const todayNomer = new Date().getDay() || 7
      const day = denList.find((d) => d.den_nomer === todayNomer)
      if (day) setPpDay(Number(day.den_id))
    }
  }, [ppWeeks, ppWeek, denList])

  // Reset state when semester changes
  const handleSemestrChange = (value: Id) => {
    setFilterSemestr(value)
    setSelectedTk(null)
    setSelectedPp(null)
    setSelectedIa(null)
    setSelectedExam(null)
    setSelectedR1(null)
    setSelectedR2(null)
    setTkWeek(null)
    setTkDay(null)
    setPpWeek(null)
    setPpDay(null)
    setGradeEdits(new Map())
  }

  // Handle grade edit
  const handleGradeEdit = useCallback((psId: Id, field: 'ball' | 'komment' | 'propusk', value: number | string | null) => {
    setGradeEdits((prev) => {
      const next = new Map(prev)
      const current = next.get(psId) ?? { ball: null, komment: '', propusk: 0 }
      if (field === 'ball') {
        current.ball = value as number | null
      } else if (field === 'komment') {
        current.komment = value as string
      } else {
        current.propusk = value as number
      }
      next.set(psId, current)
      return next
    })
  }, [])

  // Save handler for TK/PP
  const handleSaveTk = async (context: 'tk' | 'pp') => {
    const week = context === 'pp' ? ppWeek : tkWeek
    const day = context === 'pp' ? ppDay : tkDay

    if (week === null || day === null) {
      dispatch(toastPushed('error', t('jurnal.select_filter_prompt')))
      return
    }

    const grades: GradeEntry[] = []
    gradeEdits.forEach((edit, psId) => {
      if (edit.ball !== null || edit.propusk > 0) {
        grades.push({
          id_plan_student: psId,
          id_nedelya: week,
          jurnal_ball: edit.ball,
          id_den: day,
          jurnal_propusk: edit.propusk,
          jurnal_komment: edit.komment || null,
        })
      }
    })

    if (grades.length === 0) {
      dispatch(toastPushed('error', t('jurnal.select_filter_prompt')))
      return
    }

    try {
      await saveGrades({ grades, jurnal_type: 1 }).unwrap()
      dispatch(toastPushed('success', t('reg.success_save')))
      setGradeEdits(new Map())

      if (context === 'pp') {
        refetchPpStudents()
      } else {
        refetchTkStudents()
      }
    } catch {
      dispatch(toastPushed('error', t('common.error')))
    }
  }

  // Save handler for Exam/IA
  const handleSaveExam = async (context: 'exam' | 'ia') => {
    const grades: GradeEntry[] = []
    gradeEdits.forEach((edit, psId) => {
      grades.push({
        id_plan_student: psId,
        id_nedelya: 1,
        jurnal_ball: edit.ball,
        id_den: 1,
        jurnal_propusk: 0,
        jurnal_komment: null,
      })
    })

    if (grades.length === 0) {
      dispatch(toastPushed('error', t('jurnal.select_filter_prompt')))
      return
    }

    try {
      await saveGrades({ grades, jurnal_type: context === 'exam' ? 2 : 1 }).unwrap()
      dispatch(toastPushed('success', t('reg.success_save')))
      setGradeEdits(new Map())

      if (context === 'exam') {
        refetchExamStudents()
      } else {
        refetchIaStudents()
      }
    } catch {
      dispatch(toastPushed('error', t('common.error')))
    }
  }

  // Open week detail modal
  const handleWeekCellClick = (studentId: Id, planId: Id, weekNum: number, fio: string) => {
    setWeekDetailParams({ studentId, planId, weekNum, fio })
    setWeekDetailOpen(true)
  }

  // Get active columns (only those with data)
  const getActiveCols = (students: JurnalStudentRow[] | undefined) => {
    if (!students?.length) return []
    return VID_COLS.filter((col) => students.some((row) => row[col.key as VidColKey]))
  }

  // Build R1/R2 table data
  const buildRatingData = (data: typeof r1Students, isR2 = false) => {
    if (!data?.length) return { students: {}, studentOrder: [] as Id[], weekCount: 0, weekStart: 1 }

    const students: Record<Id, { fio: string; weeks: Record<number, number | null> }> = {}
    const studentOrder: Id[] = []

    data.forEach((row) => {
      if (!students[row.student_id]) {
        students[row.student_id] = { fio: row.fio, weeks: {} }
        studentOrder.push(row.student_id)
      }
      students[row.student_id].weeks[row.week_num] = row.avg_ball
    })

    const weekCount = isR2 ? (data[0]?.r2_weeks ?? 0) : (data[0]?.r1_weeks ?? 0)
    const weekStart = isR2 ? (data[0]?.r2_start ?? 1) : 1

    return { students, studentOrder, weekCount, weekStart }
  }

  // Check if week is vneplan
  const isWeekVneplan = (weeks: AvailableWeek[] | undefined, weekNum: number | null) => {
    if (!weeks || weekNum === null) return false
    return weeks.find((w) => w.week_number === weekNum)?.is_vneplan ?? false
  }

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    )
  }

  const tabs: { id: TabId; labelKey: string }[] = [
    { id: 'tk', labelKey: 'jurnal.tab_tk' },
    { id: 'r1', labelKey: 'jurnal.tab_r1' },
    { id: 'r2', labelKey: 'jurnal.tab_r2' },
    { id: 'exam', labelKey: 'jurnal.tab_exam' },
    { id: 'pp', labelKey: 'jurnal.tab_pp' },
    { id: 'ia', labelKey: 'jurnal.tab_ia' },
  ]

  const tkActiveCols = getActiveCols(tkStudents)
  const ppActiveCols = getActiveCols(ppStudents)
  const r1Data = buildRatingData(r1Students)
  const r2Data = buildRatingData(r2Students, true)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{t('jurnal.menu_name')}</h1>

      {/* Main Card */}
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        {/* Header with semester filter and tabs */}
        <div className="border-b border-border bg-surface px-4 pt-3">
          <div className="mb-4 w-48">
            <label className="mb-1 block text-xs text-muted">{t('jurnal.semestr')}</label>
            <Select value={filterSemestr} onChange={(e) => handleSemestrChange(e.target.value)}>
              <option value="">{t('jurnal.select_semestr')}</option>
              {semestrList.map((s) => (
                <option key={s.semestr_id} value={s.semestr_id}>
                  {s.semestr_nomer}
                </option>
              ))}
            </Select>
          </div>

          {/* Tabs */}
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
          {/* TK Tab */}
          {activeTab === 'tk' && (
            <div className="flex gap-0">
              {/* Discipline list */}
              <div className="w-1/3 min-w-60 border-r border-border pr-4" style={{ minHeight: 200 }}>
                {!filterSemestr ? (
                  <p className="py-4 text-center text-muted">{t('jurnal.select_filter_prompt')}</p>
                ) : !tkList?.length ? (
                  <p className="py-4 text-center text-muted">{t('jurnal.select_filter_prompt')}</p>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    {tkList.map((item) => (
                      <button
                        key={`${item.plan_id}-${item.gruppa_id}`}
                        onClick={() => {
                          setSelectedTk(item)
                          setTkWeek(null)
                          setGradeEdits(new Map())
                        }}
                        className={`rounded px-3 py-2 text-left text-sm transition-colors ${
                          selectedTk?.plan_id === item.plan_id && selectedTk?.gruppa_id === item.gruppa_id
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

              {/* Grade table */}
              <div className="flex-1 pl-4">
                {!selectedTk ? (
                  <p className="py-8 text-center text-muted">{t('jurnal.select_filter_prompt')}</p>
                ) : (
                  <>
                    {/* Week and day selectors */}
                    <div className="mb-3 flex items-center gap-3">
                      <Select
                        value={tkWeek?.toString() ?? ''}
                        onChange={(e) => setTkWeek(e.target.value ? Number(e.target.value) : null)}
                        className="w-64"
                      >
                        {tkWeeks?.map((w) => (
                          <option key={w.week_number} value={w.week_number}>
                            {t('jurnal.tab_tk')} {w.week_number}: {w.week_start} - {w.week_end}
                            {w.is_vneplan ? ' (vneplan)' : ''}
                          </option>
                        ))}
                      </Select>
                      <Select value={tkDay?.toString() ?? ''} onChange={(e) => setTkDay(e.target.value ? Number(e.target.value) : null)} className="w-32">
                        {denList.map((d) => (
                          <option key={d.den_id} value={d.den_id}>
                            {d.den_short}
                          </option>
                        ))}
                      </Select>
                    </div>

                    {/* Grade table */}
                    {tkStudents?.length ? (
                      <GradeTable
                        students={tkStudents}
                        activeCols={tkActiveCols}
                        isVneplan={isWeekVneplan(tkWeeks, tkWeek)}
                        gradeEdits={gradeEdits}
                        onEdit={handleGradeEdit}
                      />
                    ) : (
                      <p className="py-8 text-center text-muted">{t('jurnal.select_filter_prompt')}</p>
                    )}

                    {tkStudents?.length ? (
                      <div className="mt-4 flex justify-end">
                        <Button onClick={() => handleSaveTk('tk')} loading={isSaving}>
                          {t('reg.save')}
                        </Button>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          )}

          {/* R1 Tab */}
          {activeTab === 'r1' && (
            <div className="flex gap-0">
              <div className="w-1/3 min-w-60 border-r border-border pr-4" style={{ minHeight: 200 }}>
                {!filterSemestr || !tkList?.length ? (
                  <p className="py-4 text-center text-muted">{t('jurnal.select_filter_prompt')}</p>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    {tkList.map((item) => (
                      <button
                        key={`${item.plan_id}-${item.gruppa_id}`}
                        onClick={() => setSelectedR1(item)}
                        className={`rounded px-3 py-2 text-left text-sm transition-colors ${
                          selectedR1?.plan_id === item.plan_id && selectedR1?.gruppa_id === item.gruppa_id
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
              <div className="flex-1 pl-4">
                {!selectedR1 || !r1Data.studentOrder.length ? (
                  <p className="py-8 text-center text-muted">{t('jurnal.select_filter_prompt')}</p>
                ) : (
                  <RatingTable
                    students={r1Data.students}
                    studentOrder={r1Data.studentOrder}
                    weekCount={r1Data.weekCount}
                    weekStart={r1Data.weekStart}
                    planId={selectedR1.plan_id}
                    onCellClick={handleWeekCellClick}
                  />
                )}
              </div>
            </div>
          )}

          {/* R2 Tab */}
          {activeTab === 'r2' && (
            <div className="flex gap-0">
              <div className="w-1/3 min-w-60 border-r border-border pr-4" style={{ minHeight: 200 }}>
                {!filterSemestr || !tkList?.length ? (
                  <p className="py-4 text-center text-muted">{t('jurnal.select_filter_prompt')}</p>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    {tkList.map((item) => (
                      <button
                        key={`${item.plan_id}-${item.gruppa_id}`}
                        onClick={() => setSelectedR2(item)}
                        className={`rounded px-3 py-2 text-left text-sm transition-colors ${
                          selectedR2?.plan_id === item.plan_id && selectedR2?.gruppa_id === item.gruppa_id
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
              <div className="flex-1 pl-4">
                {!selectedR2 || !r2Data.studentOrder.length ? (
                  <p className="py-8 text-center text-muted">{t('jurnal.select_filter_prompt')}</p>
                ) : (
                  <RatingTable
                    students={r2Data.students}
                    studentOrder={r2Data.studentOrder}
                    weekCount={r2Data.weekCount}
                    weekStart={r2Data.weekStart}
                    planId={selectedR2.plan_id}
                    onCellClick={handleWeekCellClick}
                  />
                )}
              </div>
            </div>
          )}

          {/* Exam Tab */}
          {activeTab === 'exam' && (
            <div className="flex gap-0">
              <div className="w-1/3 min-w-60 border-r border-border pr-4" style={{ minHeight: 200 }}>
                {!filterSemestr || !tkList?.length ? (
                  <p className="py-4 text-center text-muted">{t('jurnal.select_filter_prompt')}</p>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    {tkList.map((item) => (
                      <button
                        key={`${item.plan_id}-${item.gruppa_id}`}
                        onClick={() => {
                          setSelectedExam(item)
                          setGradeEdits(new Map())
                        }}
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
              <div className="flex-1 pl-4">
                {!selectedExam ? (
                  <p className="py-8 text-center text-muted">{t('jurnal.select_filter_prompt')}</p>
                ) : (
                  <>
                    {examKalendarItog && (
                      <p className="mb-3 text-sm">
                        ({examKalendarItog.period_nachalo} - {examKalendarItog.period_konec})
                      </p>
                    )}
                    <ExamTable students={examStudents ?? []} gradeEdits={gradeEdits} onEdit={handleGradeEdit} />
                    {examStudents?.length && !examStudents[0]?.is_locked ? (
                      <div className="mt-4 flex justify-end" style={{ maxWidth: 480 }}>
                        <Button onClick={() => handleSaveExam('exam')} loading={isSaving}>
                          {t('reg.save')}
                        </Button>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          )}

          {/* PP Tab */}
          {activeTab === 'pp' && (
            <div className="flex gap-0">
              <div className="w-1/3 min-w-60 border-r border-border pr-4" style={{ minHeight: 200 }}>
                {!filterSemestr || !ppList?.length ? (
                  <p className="py-4 text-center text-muted">{t('jurnal.select_filter_prompt')}</p>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    {ppList.map((item) => (
                      <button
                        key={`${item.plan_id}-${item.gruppa_id}`}
                        onClick={() => {
                          setSelectedPp(item)
                          setPpWeek(null)
                          setGradeEdits(new Map())
                        }}
                        className={`rounded px-3 py-2 text-left text-sm transition-colors ${
                          selectedPp?.plan_id === item.plan_id && selectedPp?.gruppa_id === item.gruppa_id
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
              <div className="flex-1 pl-4">
                {!selectedPp ? (
                  <p className="py-8 text-center text-muted">{t('jurnal.select_filter_prompt')}</p>
                ) : (
                  <>
                    <div className="mb-3 flex items-center gap-3">
                      <Select
                        value={ppWeek?.toString() ?? ''}
                        onChange={(e) => setPpWeek(e.target.value ? Number(e.target.value) : null)}
                        className="w-64"
                      >
                        {ppWeeks?.map((w) => (
                          <option key={w.week_number} value={w.week_number}>
                            {t('jurnal.tab_pp')} {w.week_number}: {w.week_start} - {w.week_end}
                            {w.is_vneplan ? ' (vneplan)' : ''}
                          </option>
                        ))}
                      </Select>
                      <Select value={ppDay?.toString() ?? ''} onChange={(e) => setPpDay(e.target.value ? Number(e.target.value) : null)} className="w-32">
                        {denList.map((d) => (
                          <option key={d.den_id} value={d.den_id}>
                            {d.den_short}
                          </option>
                        ))}
                      </Select>
                    </div>

                    {ppStudents?.length ? (
                      <GradeTable
                        students={ppStudents}
                        activeCols={ppActiveCols}
                        isVneplan={isWeekVneplan(ppWeeks, ppWeek)}
                        gradeEdits={gradeEdits}
                        onEdit={handleGradeEdit}
                      />
                    ) : (
                      <p className="py-8 text-center text-muted">{t('jurnal.select_filter_prompt')}</p>
                    )}

                    {ppStudents?.length ? (
                      <div className="mt-4 flex justify-end">
                        <Button onClick={() => handleSaveTk('pp')} loading={isSaving}>
                          {t('reg.save')}
                        </Button>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          )}

          {/* IA Tab */}
          {activeTab === 'ia' && (
            <div className="flex gap-0">
              <div className="w-1/3 min-w-60 border-r border-border pr-4" style={{ minHeight: 200 }}>
                {!filterSemestr || !iaList?.length ? (
                  <p className="py-4 text-center text-muted">{t('jurnal.select_filter_prompt')}</p>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    {iaList.map((item) => (
                      <button
                        key={`${item.plan_id}-${item.gruppa_id}`}
                        onClick={() => {
                          setSelectedIa(item)
                          setGradeEdits(new Map())
                        }}
                        className={`rounded px-3 py-2 text-left text-sm transition-colors ${
                          selectedIa?.plan_id === item.plan_id && selectedIa?.gruppa_id === item.gruppa_id
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
              <div className="flex-1 pl-4">
                {!selectedIa ? (
                  <p className="py-8 text-center text-muted">{t('jurnal.select_filter_prompt')}</p>
                ) : (
                  <>
                    {iaKalendarItog && (
                      <p className="mb-3 text-sm">
                        ({iaKalendarItog.period_nachalo} - {iaKalendarItog.period_konec})
                      </p>
                    )}
                    <ExamTable students={iaStudents ?? []} gradeEdits={gradeEdits} onEdit={handleGradeEdit} />
                    {iaStudents?.length ? (
                      <div className="mt-4 flex justify-end" style={{ maxWidth: 480 }}>
                        <Button onClick={() => handleSaveExam('ia')} loading={isSaving}>
                          {t('reg.save')}
                        </Button>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Week Detail Modal */}
      <Modal open={weekDetailOpen} onClose={() => setWeekDetailOpen(false)} title={weekDetailParams ? `${weekDetailParams.fio} - Week ${weekDetailParams.weekNum}` : ''}>
        {isWeekDetailFetching ? (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        ) : !weekDetail?.length ? (
          <p className="py-4 text-center text-muted">No data</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-surface">
                <tr>
                  <th className="px-3 py-2 text-left">Day</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-center">Grade</th>
                  <th className="px-3 py-2 text-left">Teacher</th>
                  <th className="px-3 py-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {weekDetail.map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-3 py-2">{row.den_name ?? ''}</td>
                    <td className="px-3 py-2">{row.vid_short ?? ''}</td>
                    <td className="px-3 py-2 text-center">{row.jurnal_ball ?? ''}</td>
                    <td className="px-3 py-2">{row.sotrudnik_fio ?? ''}</td>
                    <td className="px-3 py-2">{row.jurnal_data ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  )
}

// Grade Table component for TK/PP
interface GradeTableProps {
  students: JurnalStudentRow[]
  activeCols: Array<(typeof VID_COLS)[number]>
  isVneplan: boolean
  gradeEdits: Map<Id, { ball: number | null; komment: string; propusk: number }>
  onEdit: (psId: Id, field: 'ball' | 'komment' | 'propusk', value: number | string | null) => void
}

function GradeTable({ students, activeCols, isVneplan, gradeEdits, onEdit }: GradeTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-surface">
          <tr className="border-b border-border">
            <th rowSpan={2} className="border-r border-border px-2 py-2 text-center align-middle" style={{ width: 36 }}>
              #
            </th>
            <th rowSpan={2} className="border-r border-border px-3 py-2 text-left align-middle" style={{ minWidth: 200 }}>
              FIO
            </th>
            {activeCols.map((col) => (
              <th key={col.key} colSpan={4} className="border-r border-border px-2 py-1 text-center">
                {col.label}
              </th>
            ))}
            <th colSpan={2} className="px-2 py-1 text-center">
              Absences
            </th>
          </tr>
          <tr className="border-b border-border">
            {activeCols.map((col) => (
              <Fragment key={col.key}>
                <th className="px-1 py-1 text-center text-xs" style={{ minWidth: 40 }}>
                  Task
                </th>
                <th className="px-1 py-1 text-center text-xs" style={{ minWidth: 50 }}>
                  Grade
                </th>
                <th className="px-1 py-1 text-center text-xs" style={{ minWidth: 80 }}>
                  Comment
                </th>
                <th className="border-r border-border px-1 py-1 text-center text-xs" style={{ minWidth: 60 }}>
                  Hours
                </th>
              </Fragment>
            ))}
            <th className="px-2 py-1 text-center text-xs" style={{ minWidth: 50 }}>
              Week
            </th>
            <th className="px-2 py-1 text-center text-xs" style={{ minWidth: 50 }}>
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {students.map((row, i) => {
            const spravkaIds = new Set((row.spravka_plan_ids ?? []).map(String))
            const hasAny = spravkaIds.size > 0
            const rowBg = isVneplan ? (hasAny ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-gray-100 text-muted dark:bg-gray-800') : ''

            return (
              <tr key={row.student_id} className={`border-b border-border ${rowBg}`}>
                <td className="border-r border-border px-2 py-1 text-center text-muted">{i + 1}</td>
                <td className="border-r border-border px-3 py-1">{row.fio}</td>
                {activeCols.map((col) => {
                  const psId = row[col.key as VidColKey] as Id | null
                  if (!psId) {
                    return (
                      <td key={col.key} colSpan={4} className="border-r border-border px-2 py-1 text-center text-muted">
                        -
                      </td>
                    )
                  }

                  const colLocked = isVneplan && !spravkaIds.has(String(psId))
                  if (colLocked) {
                    return (
                      <td key={col.key} colSpan={4} className="border-r border-border px-2 py-1 text-center text-muted">
                        -
                      </td>
                    )
                  }

                  const chasy = (students.find((r) => r[col.chasyKey as keyof JurnalStudentRow]) as JurnalStudentRow | undefined)?.[col.chasyKey as keyof JurnalStudentRow] as
                    | number
                    | null
                  const currentBall = row[col.ballKey as VidColBallKey] as number | null
                  const currentKomment = row[col.kommentKey as VidColKommentKey] as string | null
                  const currentPropusk = row[col.propuskKey as VidColPropuskKey] as number | null

                  const edit = gradeEdits.get(psId)
                  const ball = edit?.ball !== undefined ? edit.ball : currentBall
                  const komment = edit?.komment !== undefined ? edit.komment : (currentKomment ?? '')
                  const propusk = edit?.propusk !== undefined ? edit.propusk : (currentPropusk ?? 0)

                  return (
                    <Fragment key={col.key}>
                      <td className="px-1 py-1">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={ball ?? ''}
                          onChange={(e) => onEdit(psId, 'ball', e.target.value ? Number(e.target.value) : null)}
                          className="w-12 rounded border border-border bg-bg px-1 py-0.5 text-center text-sm"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="text"
                          value={komment}
                          onChange={(e) => onEdit(psId, 'komment', e.target.value)}
                          className="w-20 rounded border border-border bg-bg px-1 py-0.5 text-sm"
                        />
                      </td>
                      <td className="border-r border-border px-1 py-1 text-nowrap">
                        <input
                          type="number"
                          min={0}
                          max={1}
                          value={propusk}
                          onChange={(e) => onEdit(psId, 'propusk', Number(e.target.value) || 0)}
                          className="w-10 rounded border border-border bg-bg px-1 py-0.5 text-center text-sm"
                        />
                        /{chasy ?? ''}
                      </td>
                    </Fragment>
                  )
                })}
                <td className="px-2 py-1 text-center">{row.propusk_week ?? ''}</td>
                <td className="px-2 py-1 text-center">{row.propusk_total ?? ''}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// Rating Table component for R1/R2
interface RatingTableProps {
  students: Record<Id, { fio: string; weeks: Record<number, number | null> }>
  studentOrder: Id[]
  weekCount: number
  weekStart: number
  planId: Id
  onCellClick: (studentId: Id, planId: Id, weekNum: number, fio: string) => void
}

function RatingTable({ students, studentOrder, weekCount, weekStart, planId, onCellClick }: RatingTableProps) {
  const weeks = Array.from({ length: weekCount }, (_, i) => weekStart + i)

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-surface">
          <tr className="border-b border-border">
            <th className="border-r border-border px-2 py-2 text-center" style={{ width: 36 }}>
              #
            </th>
            <th className="border-r border-border px-3 py-2 text-left" style={{ minWidth: 200 }}>
              FIO
            </th>
            {weeks.map((w) => (
              <th key={w} className="border-r border-border px-2 py-2 text-center" style={{ minWidth: 50 }}>
                {w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {studentOrder.map((sid, i) => {
            const st = students[sid]
            return (
              <tr key={sid} className="border-b border-border">
                <td className="border-r border-border px-2 py-1 text-center text-muted">{i + 1}</td>
                <td className="border-r border-border px-3 py-1">{st.fio}</td>
                {weeks.map((w) => {
                  const avg = st.weeks[w]
                  const val = avg != null ? avg.toFixed(1) : ''
                  return (
                    <td
                      key={w}
                      className="cursor-pointer border-r border-border px-2 py-1 text-center hover:bg-bg"
                      onClick={() => onCellClick(sid, planId, w, st.fio)}
                    >
                      {val}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// Exam/IA Table component
interface ExamTableProps {
  students: Array<{ ps_id: Id; fio: string; jurnal_ball: number | null; is_locked?: boolean }>
  gradeEdits: Map<Id, { ball: number | null; komment: string; propusk: number }>
  onEdit: (psId: Id, field: 'ball' | 'komment' | 'propusk', value: number | string | null) => void
}

function ExamTable({ students, gradeEdits, onEdit }: ExamTableProps) {
  const isLocked = students[0]?.is_locked ?? false

  return (
    <div className="overflow-x-auto" style={{ maxWidth: 480 }}>
      <table className="w-full border-collapse text-sm">
        <thead className="bg-surface">
          <tr className="border-b border-border">
            <th className="border-r border-border px-2 py-2 text-center" style={{ width: 32 }}>
              #
            </th>
            <th className="border-r border-border px-3 py-2 text-left">FIO</th>
            <th className="px-2 py-2 text-center" style={{ width: 70 }}>
              Grade
            </th>
          </tr>
        </thead>
        <tbody>
          {students.map((row, i) => {
            if (!row.ps_id) return null
            const edit = gradeEdits.get(row.ps_id)
            const ball = edit?.ball !== undefined ? edit.ball : row.jurnal_ball

            return (
              <tr key={row.ps_id} className="border-b border-border">
                <td className="border-r border-border px-2 py-1 text-center text-muted">{i + 1}</td>
                <td className="border-r border-border px-3 py-1">{row.fio}</td>
                <td className="px-2 py-1 text-center">
                  {isLocked ? (
                    <span className="text-muted">{ball ?? '-'}</span>
                  ) : (
                    <input
                      type="number"
                      min={0}
                      value={ball ?? ''}
                      onChange={(e) => onEdit(row.ps_id, 'ball', e.target.value ? Number(e.target.value) : null)}
                      className="w-14 rounded border border-border bg-bg px-1 py-0.5 text-center text-sm"
                    />
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

