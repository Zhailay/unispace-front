import { useState, type FormEvent } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  useCreateKalendarMutation,
  useUpdateKalendarMutation,
  type KalendarRow,
  type SpecItem,
  type FormaObuchItem,
  type GodItem,
  type KursItem,
  type SemestrItem,
  type PeriodObuchItem,
} from './kalendarApi'
import type { Id } from '@/shared/types/api'
import { useT } from '@/shared/i18n/useT'
import Button from '@/shared/ui/Button'
import { Input, Select } from '@/shared/ui/Field'
import Modal from '@/shared/ui/Modal'

interface Props {
  open: boolean
  onClose: () => void
  /** If provided, form is in edit mode; otherwise in create mode. */
  editRow?: KalendarRow | null
  /** Filter values for creating new records (used from the filter dropdowns) */
  filterSpec?: Id
  filterFormaObuch?: Id
  filterGod?: Id
  /** Dropdown lists from the page endpoint */
  specList: SpecItem[]
  formaObuchList: FormaObuchItem[]
  godList: GodItem[]
  kursList: KursItem[]
  semestrList: SemestrItem[]
  periodObuchList: PeriodObuchItem[]
}

/** Helper to format date for input */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  // The backend returns ISO date strings, we need YYYY-MM-DD format
  return dateStr.substring(0, 10)
}

/**
 * Modal form for creating/editing a Kalendar (academic calendar) record.
 * Matches behavior from unispace/src/views/ucheb/kalendar.hbs
 */
export default function KalendarForm({
  open,
  onClose,
  editRow,
  filterSpec,
  filterFormaObuch,
  filterGod,
  specList,
  formaObuchList,
  godList,
  kursList,
  semestrList,
  periodObuchList,
}: Props) {
  const t = useT()
  const dispatch = useAppDispatch()

  const isEdit = Boolean(editRow)

  // In create mode: spec, forma_obuch, god come from filters (hidden)
  // In edit mode: all fields are editable
  const [idSpec, setIdSpec] = useState<Id>('')
  const [idFormaObuch, setIdFormaObuch] = useState<Id>('')
  const [idGod, setIdGod] = useState<Id>('')
  const [idKurs, setIdKurs] = useState<Id>('')
  const [idSemestr, setIdSemestr] = useState<Id>('')
  const [idPeriodObuch, setIdPeriodObuch] = useState<Id>('')
  const [kalendarNachalo, setKalendarNachalo] = useState('')
  const [kalendarKonec, setKalendarKonec] = useState('')

  const [createKalendar, { isLoading: isCreating }] = useCreateKalendarMutation()
  const [updateKalendar, { isLoading: isUpdating }] = useUpdateKalendarMutation()
  const isLoading = isCreating || isUpdating

  // Reset form when modal opens/closes or editRow changes
  function resetForm() {
    if (editRow) {
      setIdSpec(editRow.out_id_spec)
      setIdFormaObuch(editRow.out_id_forma_obuch)
      setIdGod(editRow.out_id_god)
      setIdKurs(editRow.out_id_kurs)
      setIdSemestr(editRow.out_id_semestr)
      setIdPeriodObuch(editRow.out_id_period_obuch)
      setKalendarNachalo(formatDate(editRow.out_kalendar_nachalo))
      setKalendarKonec(formatDate(editRow.out_kalendar_konec))
    } else {
      // In create mode, use filter values for spec, forma_obuch, god
      setIdSpec(filterSpec ?? '')
      setIdFormaObuch(filterFormaObuch ?? '')
      setIdGod(filterGod ?? '')
      setIdKurs('')
      setIdSemestr('')
      setIdPeriodObuch('')
      setKalendarNachalo('')
      setKalendarKonec('')
    }
  }

  // Sync form state when editRow or open changes
  const [prevOpen, setPrevOpen] = useState(open)
  const [prevEditId, setPrevEditId] = useState<Id | null>(null)
  if (open !== prevOpen || (editRow?.out_kalendar_id ?? null) !== prevEditId) {
    setPrevOpen(open)
    setPrevEditId(editRow?.out_kalendar_id ?? null)
    if (open) {
      resetForm()
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    // Validation - all fields required
    const specVal = isEdit ? idSpec : (filterSpec ?? '')
    const formaObuchVal = isEdit ? idFormaObuch : (filterFormaObuch ?? '')
    const godVal = isEdit ? idGod : (filterGod ?? '')

    if (!specVal || !formaObuchVal || !godVal) {
      dispatch(toastPushed('error', t('kalendar.error_select_kontingent')))
      return
    }

    if (!idKurs || !idSemestr || !idPeriodObuch || !kalendarNachalo || !kalendarKonec) {
      dispatch(toastPushed('error', t('kalendar.error_fill_fields')))
      return
    }

    const payload = {
      id_spec: specVal,
      id_forma_obuch: formaObuchVal,
      id_god: godVal,
      id_kurs: idKurs,
      id_semestr: idSemestr,
      id_period_obuch: idPeriodObuch,
      kalendar_nachalo: kalendarNachalo,
      kalendar_konec: kalendarKonec,
    }

    try {
      let result
      if (isEdit && editRow) {
        result = await updateKalendar({ ...payload, kalendar_id: editRow.out_kalendar_id }).unwrap()
      } else {
        result = await createKalendar(payload).unwrap()
      }

      if (result.ok) {
        dispatch(
          toastPushed(
            'success',
            t(isEdit ? 'kalendar.success_update' : 'kalendar.success_add'),
          ),
        )
        onClose()
      } else {
        dispatch(toastPushed('error', result.error ?? t('kalendar.error_connection')))
      }
    } catch {
      dispatch(toastPushed('error', t('kalendar.error_connection')))
    }
  }

  // Кнопки живут в footer модалки, а форма — в теле, поэтому submit
  // связывается с ней через form="...", а не вложенностью.
  const formId = 'kalendar-form'

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? t('kalendar.change_record') : t('kalendar.add_record')}
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            {t('kalendar.cancel_but')}
          </Button>
          <Button type="submit" form={formId} loading={isLoading}>
            {t('kalendar.save_but')}
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* In edit mode, show spec/forma_obuch/god dropdowns */}
        {isEdit && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Select
              label={t('kalendar.specialty')}
              value={idSpec}
              onChange={(e) => setIdSpec(e.target.value)}
              required
            >
              <option value="">{t('kalendar.select_specialty')}</option>
              {specList.map((item) => (
                <option key={item.spec_id} value={item.spec_id}>
                  {item.spec_name}
                </option>
              ))}
            </Select>

            <Select
              label={t('kalendar.form_of_education')}
              value={idFormaObuch}
              onChange={(e) => setIdFormaObuch(e.target.value)}
              required
            >
              <option value="">{t('kalendar.select_form_of_education')}</option>
              {formaObuchList.map((item) => (
                <option key={item.forma_obuch_id} value={item.forma_obuch_id}>
                  {item.forma_obuch_name}
                </option>
              ))}
            </Select>

            <Select
              label={t('kalendar.enrollment_year')}
              value={idGod}
              onChange={(e) => setIdGod(e.target.value)}
              className="tabular"
              required
            >
              <option value="">{t('kalendar.select_enrollment_year')}</option>
              {godList.map((item) => (
                <option key={item.god_id} value={item.god_id}>
                  {item.god_value}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            label={t('kalendar.kurs')}
            value={idKurs}
            onChange={(e) => setIdKurs(e.target.value)}
            className="tabular"
            required
          >
            <option value="">{t('kalendar.select_kurs')}</option>
            {kursList.map((item) => (
              <option key={item.kurs_id} value={item.kurs_id}>
                {t('kalendar.kurs')} {item.kurs_nomer}
              </option>
            ))}
          </Select>

          <Select
            label={t('kalendar.semestr')}
            value={idSemestr}
            onChange={(e) => setIdSemestr(e.target.value)}
            className="tabular"
            required
          >
            <option value="">{t('kalendar.select_semestr')}</option>
            {semestrList.map((item) => (
              <option key={item.semestr_id} value={item.semestr_id}>
                {item.semestr_nomer}
              </option>
            ))}
          </Select>

          <Select
            label={t('kalendar.period_obuch')}
            value={idPeriodObuch}
            onChange={(e) => setIdPeriodObuch(e.target.value)}
            required
          >
            <option value="">{t('kalendar.select_period_obuch')}</option>
            {periodObuchList.map((item) => (
              <option key={item.period_obuch_id} value={item.period_obuch_id}>
                {item.period_obuch_name}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            type="date"
            label={t('kalendar.date_start')}
            value={kalendarNachalo}
            onChange={(e) => setKalendarNachalo(e.target.value)}
            className="tabular"
            required
          />

          <Input
            type="date"
            label={t('kalendar.date_end')}
            value={kalendarKonec}
            onChange={(e) => setKalendarKonec(e.target.value)}
            className="tabular"
            required
          />
        </div>
      </form>
    </Modal>
  )
}
