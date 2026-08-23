import { useState, type FormEvent } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  useCreatePlanMutation,
  useUpdatePlanMutation,
  usePlanPeriodObuchQuery,
  usePlanSearchDisciplinaQuery,
  type PlanRow,
  type KursItem,
  type SemestrItem,
  type ModulNameItem,
  type ObshNameItem,
  type FormaKontrolyaItem,
  type YazykItem,
} from './planApi'
import type { Id } from '@/shared/types/api'
import { useT } from '@/shared/i18n/useT'
import Button from '@/shared/ui/Button'
import { Input, Select, Textarea } from '@/shared/ui/Field'
import Modal from '@/shared/ui/Modal'

interface Props {
  open: boolean
  onClose: () => void
  /** If provided, form is in edit mode; otherwise in create mode. */
  editRow?: PlanRow | null
  /** Filter values for creating new records (used from the filter dropdowns) */
  filterSpec?: Id
  filterFormaObuch?: Id
  filterGod?: Id
  filterKurs?: Id
  /** Dropdown lists from the page endpoint */
  kursList: KursItem[]
  semestrList: SemestrItem[]
  modulNameList: ModulNameItem[]
  obshNameList: ObshNameItem[]
  formaKontrolyaList: FormaKontrolyaItem[]
  yazykList: YazykItem[]
}

/**
 * Modal form for creating/editing a Plan (curriculum) record.
 * Matches behavior from unispace/src/views/ucheb/plan.hbs
 */
export default function PlanForm({
  open,
  onClose,
  editRow,
  filterSpec,
  filterFormaObuch,
  filterGod,
  filterKurs,
  kursList,
  semestrList,
  modulNameList,
  obshNameList,
  formaKontrolyaList,
  yazykList,
}: Props) {
  const t = useT()
  const dispatch = useAppDispatch()

  const isEdit = Boolean(editRow)

  // Form state - create mode has more fields than edit mode
  const [idKurs, setIdKurs] = useState<Id>('')
  const [idSemestr, setIdSemestr] = useState<Id>('')
  const [idPeriodObuch, setIdPeriodObuch] = useState<Id>('')
  const [idDisciplina, setIdDisciplina] = useState<Id>('')
  const [planKod, setPlanKod] = useState('')
  const [idModulName, setIdModulName] = useState<Id>('')
  const [idObshName, setIdObshName] = useState<Id>('')
  const [idFormaKontrolya, setIdFormaKontrolya] = useState<Id>('')
  const [idYazykKaz, setIdYazykKaz] = useState<Id>('1')
  const [idYazykRus, setIdYazykRus] = useState<Id>('2')
  const [idYazykAngl, setIdYazykAngl] = useState<Id>('3')
  const [idYazykPoliaz, setIdYazykPoliaz] = useState<Id>('3')
  const [rezultatKz, setRezultatKz] = useState('')
  const [rezultatRu, setRezultatRu] = useState('')
  const [rezultatEn, setRezultatEn] = useState('')
  const [disciplinaSearch, setDisciplinaSearch] = useState('')
  const [searchTrigger, setSearchTrigger] = useState('')

  const [createPlan, { isLoading: isCreating }] = useCreatePlanMutation()
  const [updatePlan, { isLoading: isUpdating }] = useUpdatePlanMutation()
  const isLoading = isCreating || isUpdating

  // Load period_obuch options based on kurs + semestr selection
  const { data: periodObuchData } = usePlanPeriodObuchQuery(
    { id_kurs: idKurs, id_semestr: idSemestr },
    { skip: !idKurs || !idSemestr || isEdit },
  )
  const periodObuchOptions = periodObuchData?.data ?? []

  // Search disciplines
  const { data: disciplinaSearchData, isFetching: isSearching } = usePlanSearchDisciplinaQuery(
    { disciplina_value: searchTrigger },
    { skip: !searchTrigger },
  )
  const disciplinaOptions = disciplinaSearchData?.data ?? []

  // Reset form when modal opens/closes or editRow changes
  function resetForm() {
    if (editRow) {
      setIdDisciplina(editRow.out_id_disciplina ?? '')
      setPlanKod(editRow.out_plan_kod ?? '')
      setIdModulName(editRow.out_id_modul_name ?? '')
      setIdObshName(editRow.out_id_obsh_name ?? '')
      setIdFormaKontrolya(editRow.out_id_forma_kontrolya ?? '')
      setIdYazykKaz(editRow.out_yazyk_kaz ?? '1')
      setIdYazykRus(editRow.out_yazyk_rus ?? '2')
      setIdYazykAngl(editRow.out_yazyk_angl ?? '3')
      setIdYazykPoliaz(editRow.out_yazyk_poliaz ?? '3')
      setRezultatKz(editRow.out_plan_ro_kz ?? '')
      setRezultatRu(editRow.out_plan_ro_ru ?? '')
      setRezultatEn(editRow.out_plan_ro_en ?? '')
      setDisciplinaSearch('')
      setSearchTrigger('')
    } else {
      setIdKurs(filterKurs ?? '')
      setIdSemestr('')
      setIdPeriodObuch('')
      setIdDisciplina('')
      setPlanKod('')
      setIdModulName('')
      setIdObshName('')
      setIdFormaKontrolya('')
      setIdYazykKaz('1')
      setIdYazykRus('2')
      setIdYazykAngl('3')
      setIdYazykPoliaz('3')
      setRezultatKz('')
      setRezultatRu('')
      setRezultatEn('')
      setDisciplinaSearch('')
      setSearchTrigger('')
    }
  }

  // Sync form state when editRow or open changes
  const [prevOpen, setPrevOpen] = useState(open)
  const [prevEditId, setPrevEditId] = useState<Id | null>(null)
  if (open !== prevOpen || (editRow?.out_plan_id ?? null) !== prevEditId) {
    setPrevOpen(open)
    setPrevEditId(editRow?.out_plan_id ?? null)
    if (open) {
      resetForm()
    }
  }

  function handleSearchDisciplina() {
    const val = disciplinaSearch.trim()
    if (val) {
      setSearchTrigger(val)
    }
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearchDisciplina()
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    // Validation for create mode
    if (!isEdit) {
      if (!filterSpec || !filterFormaObuch || !filterGod || !filterKurs) {
        dispatch(toastPushed('error', t('plan.error_select_kontingent')))
        return
      }
      if (!idSemestr || !idPeriodObuch || !idDisciplina) {
        dispatch(toastPushed('error', t('plan.error_fill_fields')))
        return
      }
    } else {
      if (!idDisciplina) {
        dispatch(toastPushed('error', t('plan.error_fill_fields')))
        return
      }
    }

    try {
      let result
      if (isEdit && editRow) {
        result = await updatePlan({
          plan_id: editRow.out_plan_id,
          id_disciplina: idDisciplina,
          plan_kod: planKod || null,
          plan_ro_kz: rezultatKz || null,
          plan_ro_ru: rezultatRu || null,
          plan_ro_en: rezultatEn || null,
          id_modul_name: idModulName || null,
          id_obsh_name: idObshName || null,
          id_forma_kontrolya: idFormaKontrolya || null,
          id_yazyk_kaz: idYazykKaz || null,
          id_yazyk_rus: idYazykRus || null,
          id_yazyk_angl: idYazykAngl || null,
          id_yazyk_poliaz: idYazykPoliaz || null,
        }).unwrap()
      } else {
        result = await createPlan({
          id_spec: filterSpec!,
          id_forma_obuch: filterFormaObuch!,
          id_god: filterGod!,
          id_kurs: idKurs,
          id_semestr: idSemestr,
          id_period_obuch: idPeriodObuch,
          id_disciplina: idDisciplina,
          plan_kod: planKod || null,
          plan_ro_kz: rezultatKz || null,
          plan_ro_ru: rezultatRu || null,
          plan_ro_en: rezultatEn || null,
          id_modul_name: idModulName || null,
          id_obsh_name: idObshName || null,
          id_forma_kontrolya: idFormaKontrolya || null,
          id_yazyk_kaz: idYazykKaz || null,
          id_yazyk_rus: idYazykRus || null,
          id_yazyk_angl: idYazykAngl || null,
          id_yazyk_poliaz: idYazykPoliaz || null,
        }).unwrap()
      }

      if (result.ok) {
        dispatch(
          toastPushed(
            'success',
            t(isEdit ? 'plan.success_update' : 'plan.success_add'),
          ),
        )
        onClose()
      } else {
        dispatch(toastPushed('error', result.error ?? t('plan.error_connection')))
      }
    } catch {
      dispatch(toastPushed('error', t('plan.error_connection')))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('plan.change_plan') : t('plan.add_plan')}
      className="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Block 1: Kurs / Semestr / Period obuch - only in create mode */}
        {!isEdit && (
          <div className="grid grid-cols-3 gap-4">
            <Select
              label={t('plan.kurs')}
              value={idKurs}
              onChange={(e) => {
                setIdKurs(e.target.value)
                setIdPeriodObuch('')
              }}
              required
            >
              <option value="">{t('plan.select_kurs')}</option>
              {kursList.map((item) => (
                <option key={item.kurs_id} value={item.kurs_id}>
                  {item.kurs_nomer}
                </option>
              ))}
            </Select>

            <Select
              label={t('plan.semestr')}
              value={idSemestr}
              onChange={(e) => {
                setIdSemestr(e.target.value)
                setIdPeriodObuch('')
              }}
              required
            >
              <option value="">{t('plan.select_semestr')}</option>
              {semestrList.map((item) => (
                <option key={item.semestr_id} value={item.semestr_id}>
                  {item.semestr_nomer}
                </option>
              ))}
            </Select>

            <Select
              label={t('plan.period_obuch')}
              value={idPeriodObuch}
              onChange={(e) => setIdPeriodObuch(e.target.value)}
              disabled={!idKurs || !idSemestr}
              required
            >
              <option value="">{t('plan.select_period_obuch')}</option>
              {periodObuchOptions.map((item) => (
                <option key={item.period_obuch_id} value={item.period_obuch_id}>
                  {item.period_obuch_name}
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Block 2: Discipline search */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t('plan.disciplina')} <span className="text-danger">*</span>
          </label>
          <div className="flex gap-2 rounded border border-border p-2">
            <input
              type="text"
              value={disciplinaSearch}
              onChange={(e) => setDisciplinaSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={t('plan.search_disciplina')}
              className="w-56 shrink-0 rounded-card border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-muted focus:outline-2 focus:outline-offset-0 focus:outline-primary"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleSearchDisciplina}
              loading={isSearching}
            >
              {t('plan.search')}
            </Button>
            <select
              value={idDisciplina}
              onChange={(e) => setIdDisciplina(e.target.value)}
              className="flex-1 rounded-card border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-2 focus:outline-offset-0 focus:outline-primary"
              required
            >
              <option value="">{t('plan.select_disciplina_placeholder')}</option>
              {/* In edit mode, show current discipline if no search done */}
              {isEdit && editRow && !searchTrigger && editRow.out_id_disciplina && (
                <option value={editRow.out_id_disciplina}>{editRow.out_disciplina_name}</option>
              )}
              {disciplinaOptions.map((item) => (
                <option key={item.disciplina_id} value={item.disciplina_id}>
                  {item.disciplina_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Block 3: Obsh name / Modul / Forma kontrolya / Kod */}
        <div className="grid grid-cols-4 gap-4">
          <Select
            label={t('plan.obsh_name')}
            value={idObshName}
            onChange={(e) => setIdObshName(e.target.value)}
          >
            <option value="">{t('plan.select_obsh_name')}</option>
            {obshNameList.map((item) => (
              <option key={item.obsh_name_id} value={item.obsh_name_id}>
                {item.obsh_name_value}
              </option>
            ))}
          </Select>

          <Select
            label={t('plan.modul_name')}
            value={idModulName}
            onChange={(e) => setIdModulName(e.target.value)}
          >
            <option value="">{t('plan.select_modul_name')}</option>
            {modulNameList.map((item) => (
              <option key={item.modul_name_id} value={item.modul_name_id}>
                {item.modul_name_value}
              </option>
            ))}
          </Select>

          <Select
            label={t('plan.forma_kontrolya')}
            value={idFormaKontrolya}
            onChange={(e) => setIdFormaKontrolya(e.target.value)}
          >
            <option value="">{t('plan.select_forma_kontrolya')}</option>
            {formaKontrolyaList.map((item) => (
              <option key={item.forma_kontrolya_id} value={item.forma_kontrolya_id}>
                {item.forma_kontrolya_name}
              </option>
            ))}
          </Select>

          <Input
            label={t('plan.kod_discipliny')}
            value={planKod}
            onChange={(e) => setPlanKod(e.target.value)}
          />
        </div>

        {/* Block 4: Language groups */}
        <div className="grid grid-cols-4 gap-4">
          <Select
            label={t('plan.kaz_gruppy')}
            value={idYazykKaz}
            onChange={(e) => setIdYazykKaz(e.target.value)}
          >
            {yazykList.map((item) => (
              <option key={item.yazyk_id} value={item.yazyk_id}>
                {item.yazyk_name}
              </option>
            ))}
          </Select>

          <Select
            label={t('plan.rus_gruppy')}
            value={idYazykRus}
            onChange={(e) => setIdYazykRus(e.target.value)}
          >
            {yazykList.map((item) => (
              <option key={item.yazyk_id} value={item.yazyk_id}>
                {item.yazyk_name}
              </option>
            ))}
          </Select>

          <Select
            label={t('plan.angl_gruppy')}
            value={idYazykAngl}
            onChange={(e) => setIdYazykAngl(e.target.value)}
          >
            {yazykList.map((item) => (
              <option key={item.yazyk_id} value={item.yazyk_id}>
                {item.yazyk_name}
              </option>
            ))}
          </Select>

          <Select
            label={t('plan.poliaz_gruppy')}
            value={idYazykPoliaz}
            onChange={(e) => setIdYazykPoliaz(e.target.value)}
          >
            {yazykList.map((item) => (
              <option key={item.yazyk_id} value={item.yazyk_id}>
                {item.yazyk_name}
              </option>
            ))}
          </Select>
        </div>

        {/* Block 5: Learning outcomes */}
        <div className="grid grid-cols-3 gap-4">
          <Textarea
            label={t('plan.rezultat_kz')}
            value={rezultatKz}
            onChange={(e) => setRezultatKz(e.target.value)}
            rows={2}
          />

          <Textarea
            label={t('plan.rezultat_ru')}
            value={rezultatRu}
            onChange={(e) => setRezultatRu(e.target.value)}
            rows={2}
          />

          <Textarea
            label={t('plan.rezultat_en')}
            value={rezultatEn}
            onChange={(e) => setRezultatEn(e.target.value)}
            rows={2}
          />
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('plan.cancel_but')}
          </Button>
          <Button type="submit" loading={isLoading}>
            {t('plan.save_but')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
