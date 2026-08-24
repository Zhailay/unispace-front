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
import { Input, Select } from '@/shared/ui/Field'
import Spinner from '@/shared/ui/Spinner'
import PageHeader from '@/shared/ui/PageHeader'
import EmptyState from '@/shared/ui/EmptyState'

type TabId = 'tk' | 'r1' | 'r2' | 'exam' | 'pp' | 'ia'

// Табы раздела: активный подсвечиваем мягкой заливкой бренда, а не рамкой —
// так строка табов читается одинаково во всех разделах.
const TAB_BASE =
  'rounded-control px-3 py-1.5 text-sm cursor-pointer transition-colors' +
  ' focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
const TAB_ACTIVE = 'bg-primary-soft text-primary font-medium'
const TAB_IDLE = 'text-muted hover:bg-surface-2 hover:text-fg'

// Общие классы шапки широких таблиц журнала — повторяются в трёх таблицах.
const TH = 'border-b border-border px-3 py-2 text-xs font-semibold tracking-wide uppercase whitespace-nowrap'

/**
 * Vid zanyatiya columns configuration.
 * Заголовки — ключи переводов, а не латиница: t() доступен только внутри
 * компонента, поэтому на модульном уровне храним ключ, а не готовую строку.
 */
const VID_COLS = [
  { key: 'ps_id_lk', chasyKey: 'chasy_lk', ballKey: 'ball_lk', kommentKey: 'komment_lk', propuskKey: 'propusk_lk', labelKey: 'reg.vid_l' },
  { key: 'ps_id_pz', chasyKey: 'chasy_pz', ballKey: 'ball_pz', kommentKey: 'komment_pz', propuskKey: 'propusk_pz', labelKey: 'reg.vid_pz' },
  { key: 'ps_id_lz', chasyKey: 'chasy_lz', ballKey: 'ball_lz', kommentKey: 'komment_lz', propuskKey: 'propusk_lz', labelKey: 'reg.vid_lz' },
  { key: 'ps_id_srs', chasyKey: 'chasy_srs', ballKey: 'ball_srs', kommentKey: 'komment_srs', propuskKey: 'propusk_srs', labelKey: 'reg.vid_srs' },
  { key: 'ps_id_srsp', chasyKey: 'chasy_srsp', ballKey: 'ball_srsp', kommentKey: 'komment_srsp', propuskKey: 'propusk_srsp', labelKey: 'reg.vid_srsp' },
  { key: 'ps_id_fz', chasyKey: 'chasy_fz', ballKey: 'ball_fz', kommentKey: 'komment_fz', propuskKey: 'propusk_fz', labelKey: 'reg.vid_fz' },
  { key: 'ps_id_lpz', chasyKey: 'chasy_lpz', ballKey: 'ball_lpz', kommentKey: 'komment_lpz', propuskKey: 'propusk_lpz', labelKey: 'reg.vid_lpz' },
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
      dispatch(toastPushed('error', t('jurnal.no_grades_to_save') || t('common.error')))
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
      dispatch(toastPushed('error', t('jurnal.no_grades_to_save') || t('common.error')))
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

  // Пока грузятся справочники, показываем только шапку со спиннером.
  if (isPageLoading) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title={t('jurnal.menu_name')} busy />
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
    <div className="flex flex-col gap-5">
      <PageHeader title={t('jurnal.menu_name')} />

      {/* Карточка фильтров: без академического периода списки не грузятся. */}
      <div className="rounded-card border border-border bg-surface p-4 shadow-card">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Select
            label={t('jurnal.semestr')}
            value={filterSemestr}
            onChange={(e) => handleSemestrChange(e.target.value)}
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

      {/* TK Tab */}
      {activeTab === 'tk' && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <DisciplineList
            items={tkList}
            ready={Boolean(filterSemestr)}
            selected={selectedTk}
            onSelect={(item) => {
              setSelectedTk(item)
              setTkWeek(null)
              setGradeEdits(new Map())
            }}
          />

          <div className="flex min-w-0 flex-col gap-4">
            {!selectedTk ? (
              <PromptCard />
            ) : (
              <>
                <div className="rounded-card border border-border bg-surface p-4 shadow-card">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Select
                      label={t('vneplanovoe.week')}
                      value={tkWeek?.toString() ?? ''}
                      onChange={(e) => setTkWeek(e.target.value ? Number(e.target.value) : null)}
                      className="tabular"
                    >
                      {tkWeeks?.map((w) => (
                        <option key={w.week_number} value={w.week_number}>
                          {t('jurnal.tab_tk')} {w.week_number}: {w.week_start} - {w.week_end}
                          {w.is_vneplan ? ` (${t('jurnal.tab_spravka')})` : ''}
                        </option>
                      ))}
                    </Select>

                    <Select
                      label={t('vneplanovoe.day')}
                      value={tkDay?.toString() ?? ''}
                      onChange={(e) => setTkDay(e.target.value ? Number(e.target.value) : null)}
                    >
                      {denList.map((d) => (
                        <option key={d.den_id} value={d.den_id}>
                          {d.den_short}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {tkStudents?.length ? (
                  <>
                    <GradeTable
                      students={tkStudents}
                      activeCols={tkActiveCols}
                      isVneplan={isWeekVneplan(tkWeeks, tkWeek)}
                      gradeEdits={gradeEdits}
                      onEdit={handleGradeEdit}
                    />
                    <div className="flex justify-end">
                      <Button onClick={() => handleSaveTk('tk')} loading={isSaving}>
                        {t('reg.save')}
                      </Button>
                    </div>
                  </>
                ) : (
                  <PromptCard />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* R1 Tab */}
      {activeTab === 'r1' && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <DisciplineList
            items={tkList}
            ready={Boolean(filterSemestr)}
            selected={selectedR1}
            onSelect={setSelectedR1}
          />
          <div className="flex min-w-0 flex-col gap-4">
            {!selectedR1 || !r1Data.studentOrder.length ? (
              <PromptCard />
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
        <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <DisciplineList
            items={tkList}
            ready={Boolean(filterSemestr)}
            selected={selectedR2}
            onSelect={setSelectedR2}
          />
          <div className="flex min-w-0 flex-col gap-4">
            {!selectedR2 || !r2Data.studentOrder.length ? (
              <PromptCard />
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
        <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <DisciplineList
            items={tkList}
            ready={Boolean(filterSemestr)}
            selected={selectedExam}
            onSelect={(item) => {
              setSelectedExam(item)
              setGradeEdits(new Map())
            }}
          />
          <div className="flex min-w-0 flex-col gap-4">
            {!selectedExam ? (
              <PromptCard />
            ) : (
              <>
                {examKalendarItog && (
                  <p className="tabular text-sm text-muted">
                    {examKalendarItog.period_nachalo} — {examKalendarItog.period_konec}
                  </p>
                )}
                <div className="max-w-lg">
                  <ExamTable students={examStudents ?? []} gradeEdits={gradeEdits} onEdit={handleGradeEdit} />
                </div>
                {examStudents?.length && !examStudents.some((s) => s.is_locked) ? (
                  <div className="flex max-w-lg justify-end">
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
        <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <DisciplineList
            items={ppList}
            ready={Boolean(filterSemestr)}
            selected={selectedPp}
            onSelect={(item) => {
              setSelectedPp(item)
              setPpWeek(null)
              setGradeEdits(new Map())
            }}
          />
          <div className="flex min-w-0 flex-col gap-4">
            {!selectedPp ? (
              <PromptCard />
            ) : (
              <>
                <div className="rounded-card border border-border bg-surface p-4 shadow-card">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Select
                      label={t('vneplanovoe.week')}
                      value={ppWeek?.toString() ?? ''}
                      onChange={(e) => setPpWeek(e.target.value ? Number(e.target.value) : null)}
                      className="tabular"
                    >
                      {ppWeeks?.map((w) => (
                        <option key={w.week_number} value={w.week_number}>
                          {t('jurnal.tab_pp')} {w.week_number}: {w.week_start} - {w.week_end}
                          {w.is_vneplan ? ` (${t('jurnal.tab_spravka')})` : ''}
                        </option>
                      ))}
                    </Select>

                    <Select
                      label={t('vneplanovoe.day')}
                      value={ppDay?.toString() ?? ''}
                      onChange={(e) => setPpDay(e.target.value ? Number(e.target.value) : null)}
                    >
                      {denList.map((d) => (
                        <option key={d.den_id} value={d.den_id}>
                          {d.den_short}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {ppStudents?.length ? (
                  <>
                    <GradeTable
                      students={ppStudents}
                      activeCols={ppActiveCols}
                      isVneplan={isWeekVneplan(ppWeeks, ppWeek)}
                      gradeEdits={gradeEdits}
                      onEdit={handleGradeEdit}
                    />
                    <div className="flex justify-end">
                      <Button onClick={() => handleSaveTk('pp')} loading={isSaving}>
                        {t('reg.save')}
                      </Button>
                    </div>
                  </>
                ) : (
                  <PromptCard />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* IA Tab */}
      {activeTab === 'ia' && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <DisciplineList
            items={iaList}
            ready={Boolean(filterSemestr)}
            selected={selectedIa}
            onSelect={(item) => {
              setSelectedIa(item)
              setGradeEdits(new Map())
            }}
          />
          <div className="flex min-w-0 flex-col gap-4">
            {!selectedIa ? (
              <PromptCard />
            ) : (
              <>
                {iaKalendarItog && (
                  <p className="tabular text-sm text-muted">
                    {iaKalendarItog.period_nachalo} — {iaKalendarItog.period_konec}
                  </p>
                )}
                <div className="max-w-lg">
                  <ExamTable students={iaStudents ?? []} gradeEdits={gradeEdits} onEdit={handleGradeEdit} />
                </div>
                {iaStudents?.length ? (
                  <div className="flex max-w-lg justify-end">
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

      {/* Week Detail Modal */}
      <Modal
        open={weekDetailOpen}
        onClose={() => setWeekDetailOpen(false)}
        size="lg"
        title={weekDetailParams ? `${weekDetailParams.fio} — ${t('vneplanovoe.week')} ${weekDetailParams.weekNum}` : ''}
      >
        {isWeekDetailFetching ? (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        ) : !weekDetail?.length ? (
          <EmptyState title={t('common.no_data')} />
        ) : (
          <div className="table-scroll">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-surface-2 text-muted">
                <tr>
                  <th scope="col" className={`${TH} text-left`}>
                    {t('vneplanovoe.day')}
                  </th>
                  <th scope="col" className={`${TH} text-left`}>
                    {t('plan.vid_zanyatiya')}
                  </th>
                  <th scope="col" className={`${TH} text-center`}>
                    {t('grade.score')}
                  </th>
                  <th scope="col" className={`${TH} text-left`}>
                    {t('reg.teacher')}
                  </th>
                  <th scope="col" className={`${TH} text-left`}>
                    {t('jurnal.data')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {weekDetail.map((row, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-3 py-2">{row.den_name ?? ''}</td>
                    <td className="px-3 py-2">{row.vid_short ?? ''}</td>
                    <td className="tabular px-3 py-2 text-center">{row.jurnal_ball ?? ''}</td>
                    <td className="px-3 py-2">{row.sotrudnik_fio ?? ''}</td>
                    <td className="tabular px-3 py-2 whitespace-nowrap">{row.jurnal_data ?? ''}</td>
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

/** Подсказка «выберите фильтры» — повторяется в каждой вкладке. */
function PromptCard() {
  const t = useT()
  return (
    <div className="rounded-card border border-border bg-surface shadow-card">
      <EmptyState icon="search" title={t('jurnal.select_filter_prompt')} />
    </div>
  )
}

interface DisciplineListProps {
  items: JurnalGruppaItem[] | undefined
  /** Выбран академический период — до этого список не запрашивается. */
  ready: boolean
  selected: JurnalGruppaItem | null
  onSelect: (item: JurnalGruppaItem) => void
}

/** Левая колонка «дисциплина + группа»: один и тот же список во всех вкладках. */
function DisciplineList({ items, ready, selected, onSelect }: DisciplineListProps) {
  const t = useT()

  return (
    <div className="rounded-card border border-border bg-surface p-2 shadow-card">
      {!ready || !items?.length ? (
        <EmptyState icon="search" title={t('jurnal.select_filter_prompt')} />
      ) : (
        <div className="flex flex-col gap-1">
          {items.map((item) => {
            const isSelected = selected?.plan_id === item.plan_id && selected?.gruppa_id === item.gruppa_id
            return (
              <Button
                key={`${item.plan_id}-${item.gruppa_id}`}
                variant={isSelected ? 'primary' : 'ghost'}
                onClick={() => onSelect(item)}
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
  const t = useT()

  return (
    // Таблица шире экрана — скроллим её саму, страница вбок не едет.
    <div className="table-scroll rounded-card border border-border bg-surface shadow-card">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-surface-2 text-muted">
          <tr>
            <th rowSpan={2} scope="col" className={`${TH} w-px border-r text-center align-middle`}>
              {t('reg.num')}
            </th>
            <th rowSpan={2} scope="col" className={`${TH} min-w-52 border-r text-left align-middle`}>
              {t('reg.fio')}
            </th>
            {activeCols.map((col) => (
              <th key={col.key} colSpan={3} scope="col" className={`${TH} border-r text-center`}>
                {t(col.labelKey)}
              </th>
            ))}
            <th colSpan={2} scope="col" className={`${TH} text-center`}>
              {t('jurnal.propuski')}
            </th>
          </tr>
          <tr>
            {activeCols.map((col) => (
              <Fragment key={col.key}>
                <th scope="col" className={`${TH} text-center`}>
                  {t('grade.score')}
                </th>
                <th scope="col" className={`${TH} text-center`}>
                  {t('grade.feedback')}
                </th>
                <th scope="col" className={`${TH} border-r text-center`}>
                  {t('plan.chasy')}
                </th>
              </Fragment>
            ))}
            <th scope="col" className={`${TH} text-center`}>
              {t('jurnal.propusk_week')}
            </th>
            <th scope="col" className={`${TH} text-center`}>
              {t('jurnal.propusk_total')}
            </th>
          </tr>
        </thead>
        <tbody>
          {students.map((row, i) => {
            const spravkaIds = new Set((row.spravka_plan_ids ?? []).map(String))
            const hasAny = spravkaIds.size > 0
            // Внеплановая неделя: со справкой — тёплая подсветка, без справки
            // строка недоступна и приглушена. Только токены, иначе тёмная тема ломается.
            const rowBg = isVneplan ? (hasAny ? 'bg-warning-soft' : 'bg-surface-2 text-muted') : ''

            return (
              <tr key={row.student_id} className={`border-b border-border last:border-0 ${rowBg}`}>
                <td className="tabular border-r border-border px-3 py-1.5 text-center text-muted">{i + 1}</td>
                <td className="border-r border-border px-3 py-1.5 whitespace-nowrap">{row.fio}</td>
                {activeCols.map((col) => {
                  const psId = row[col.key as VidColKey] as Id | null
                  if (!psId) {
                    return (
                      <td key={col.key} colSpan={3} className="border-r border-border px-3 py-1.5 text-center text-subtle">
                        -
                      </td>
                    )
                  }

                  const colLocked = isVneplan && !spravkaIds.has(String(psId))
                  if (colLocked) {
                    return (
                      <td key={col.key} colSpan={3} className="border-r border-border px-3 py-1.5 text-center text-subtle">
                        -
                      </td>
                    )
                  }

                  const chasy = row[col.chasyKey as keyof JurnalStudentRow] as number | null
                  const currentBall = row[col.ballKey as VidColBallKey] as number | null
                  const currentKomment = row[col.kommentKey as VidColKommentKey] as string | null
                  const currentPropusk = row[col.propuskKey as VidColPropuskKey] as number | null

                  const edit = gradeEdits.get(psId)
                  const ball = edit?.ball !== undefined ? edit.ball : currentBall
                  const komment = edit?.komment !== undefined ? edit.komment : (currentKomment ?? '')
                  const propusk = edit?.propusk !== undefined ? edit.propusk : (currentPropusk ?? 0)

                  return (
                    <Fragment key={col.key}>
                      <td className="px-2 py-1.5">
                        <div className="w-20">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            aria-label={`${t(col.labelKey)} — ${t('grade.score')}`}
                            value={ball ?? ''}
                            onChange={(e) => onEdit(psId, 'ball', e.target.value ? Number(e.target.value) : null)}
                            className="tabular text-center"
                          />
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="w-32">
                          <Input
                            type="text"
                            aria-label={`${t(col.labelKey)} — ${t('grade.feedback')}`}
                            value={komment}
                            onChange={(e) => onEdit(psId, 'komment', e.target.value)}
                          />
                        </div>
                      </td>
                      <td className="border-r border-border px-2 py-1.5 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <div className="w-16">
                            <Input
                              type="number"
                              min={0}
                              max={1}
                              aria-label={`${t(col.labelKey)} — ${t('jurnal.propuski')}`}
                              value={propusk}
                              onChange={(e) => onEdit(psId, 'propusk', Number(e.target.value) || 0)}
                              className="tabular text-center"
                            />
                          </div>
                          <span className="tabular text-muted">/{chasy ?? ''}</span>
                        </div>
                      </td>
                    </Fragment>
                  )
                })}
                <td className="tabular px-3 py-1.5 text-center">{row.propusk_week ?? ''}</td>
                <td className="tabular px-3 py-1.5 text-center">{row.propusk_total ?? ''}</td>
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
  const t = useT()
  const weeks = Array.from({ length: weekCount }, (_, i) => weekStart + i)

  return (
    // Недель много — таблица скроллится внутри карточки.
    <div className="table-scroll rounded-card border border-border bg-surface shadow-card">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-surface-2 text-muted">
          <tr>
            <th scope="col" className={`${TH} w-px border-r text-center`}>
              {t('reg.num')}
            </th>
            <th scope="col" className={`${TH} min-w-52 border-r text-left`}>
              {t('reg.fio')}
            </th>
            {weeks.map((w) => (
              <th key={w} scope="col" className={`${TH} tabular w-12 border-r text-center`}>
                {w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {studentOrder.map((sid, i) => {
            const st = students[sid]
            return (
              <tr key={sid} className="border-b border-border last:border-0">
                <td className="tabular border-r border-border px-3 py-1.5 text-center text-muted">{i + 1}</td>
                <td className="border-r border-border px-3 py-1.5 whitespace-nowrap">{st.fio}</td>
                {weeks.map((w) => {
                  const avg = st.weeks[w]
                  const val = avg != null ? avg.toFixed(1) : ''
                  return (
                    <td
                      key={w}
                      className="tabular cursor-pointer border-r border-border px-3 py-1.5 text-center
                        transition-colors hover:bg-surface-2"
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
  const t = useT()
  const isLocked = students.some((s) => s.is_locked)

  if (!students.length) {
    return (
      <div className="rounded-card border border-border bg-surface shadow-card">
        <EmptyState title={t('common.no_data')} />
      </div>
    )
  }

  return (
    <div className="table-scroll rounded-card border border-border bg-surface shadow-card">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-surface-2 text-muted">
          <tr>
            <th scope="col" className={`${TH} w-px border-r text-center`}>
              {t('reg.num')}
            </th>
            <th scope="col" className={`${TH} border-r text-left`}>
              {t('reg.fio')}
            </th>
            <th scope="col" className={`${TH} w-28 text-center`}>
              {t('grade.score')}
            </th>
          </tr>
        </thead>
        <tbody>
          {students.map((row, i) => {
            if (!row.ps_id) return null
            const edit = gradeEdits.get(row.ps_id)
            const ball = edit?.ball !== undefined ? edit.ball : row.jurnal_ball

            return (
              <tr key={row.ps_id} className="border-b border-border last:border-0">
                <td className="tabular border-r border-border px-3 py-1.5 text-center text-muted">{i + 1}</td>
                <td className="border-r border-border px-3 py-1.5">{row.fio}</td>
                <td className="px-2 py-1.5 text-center">
                  {isLocked ? (
                    <span className="tabular text-muted">{ball ?? '-'}</span>
                  ) : (
                    <Input
                      type="number"
                      min={0}
                      aria-label={`${row.fio} — ${t('grade.score')}`}
                      value={ball ?? ''}
                      onChange={(e) => onEdit(row.ps_id, 'ball', e.target.value ? Number(e.target.value) : null)}
                      className="tabular text-center"
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
