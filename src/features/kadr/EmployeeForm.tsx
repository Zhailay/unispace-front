import { useState, type FormEvent } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  type EmployeeRow,
  type DepartmentRow,
  type PositionRow,
  type FormaZamescheniyaRow,
  type ShtatnostRow,
} from './kadrApi'
import type { Id } from '@/shared/types/api'
import { useT } from '@/shared/i18n/useT'
import { getLang } from '@/shared/i18n/lang'
import Button from '@/shared/ui/Button'
import { Input, Select } from '@/shared/ui/Field'
import Modal from '@/shared/ui/Modal'

interface Props {
  open: boolean
  onClose: () => void
  departments: DepartmentRow[]
  positions: PositionRow[]
  formaList: FormaZamescheniyaRow[]
  shtatnostList: ShtatnostRow[]
  editRow?: EmployeeRow | null
}

export default function EmployeeForm({
  open,
  onClose,
  departments,
  positions,
  formaList,
  shtatnostList,
  editRow,
}: Props) {
  const t = useT()
  const lang = getLang()
  const dispatch = useAppDispatch()

  const isEdit = Boolean(editRow)

  const [iin, setIin] = useState('')
  const [lastname, setLastname] = useState('')
  const [firstname, setFirstname] = useState('')
  const [middlename, setMiddlename] = useState('')
  const [departmentId, setDepartmentId] = useState<Id | ''>('')
  const [positionId, setPositionId] = useState<Id | ''>('')
  const [replacementFormId, setReplacementFormId] = useState<Id | ''>('')
  const [staffingId, setStaffingId] = useState<Id | ''>('')
  const [isActive, setIsActive] = useState(true)

  const [createEmployee, { isLoading: isCreating }] = useCreateEmployeeMutation()
  const [updateEmployee, { isLoading: isUpdating }] = useUpdateEmployeeMutation()
  const isLoading = isCreating || isUpdating

  function resetForm() {
    if (editRow) {
      setIin(editRow.iin || '')
      setLastname(editRow.familiya || '')
      setFirstname(editRow.imya || '')
      setMiddlename(editRow.otchestvo || '')
      setDepartmentId(editRow.podrazdelenieId || '')
      setPositionId(editRow.doljnostId || '')
      setReplacementFormId(editRow.formaZamescheniyaId || '')
      setStaffingId(editRow.shtatnostId || '')
      setIsActive(editRow.status)
    } else {
      setIin('')
      setLastname('')
      setFirstname('')
      setMiddlename('')
      setDepartmentId('')
      setPositionId('')
      setReplacementFormId('')
      setStaffingId('')
      setIsActive(true)
    }
  }

  const [prevOpen, setPrevOpen] = useState(open)
  const [prevEditId, setPrevEditId] = useState<Id | null>(null)
  if (open !== prevOpen || (editRow?.id ?? null) !== prevEditId) {
    setPrevOpen(open)
    setPrevEditId(editRow?.id ?? null)
    if (open) {
      resetForm()
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!lastname.trim() || !firstname.trim()) {
      dispatch(toastPushed('error', t('common.fill_required_fields')))
      return
    }

    const payload = {
      iin: iin.trim(),
      lastname: lastname.trim(),
      firstname: firstname.trim(),
      middlename: middlename.trim() || undefined,
      department_id: departmentId || undefined,
      position_id: positionId || undefined,
      replacement_form_id: replacementFormId || undefined,
      staffing_id: staffingId || undefined,
      is_active: isActive ? 'on' as const : '' as const,
    }

    try {
      let result
      if (isEdit && editRow) {
        result = await updateEmployee({ ...payload, id: editRow.id }).unwrap()
      } else {
        result = await createEmployee(payload).unwrap()
      }

      if (result.code === 2) {
        dispatch(toastPushed('error', t('kadr.employee_exists')))
        return
      }

      dispatch(
        toastPushed(
          'success',
          t(isEdit ? 'kadr.employee_updated' : 'kadr.employee_created'),
        ),
      )
      onClose()
    } catch {
      dispatch(toastPushed('error', t('common.error_connection')))
    }
  }

  function localize<T extends { kz: string; ru: string; en: string }>(row: T): string {
    if (lang === 'kk') return row.kz
    if (lang === 'en') return row.en
    return row.ru
  }

  // Кнопки живут в footer модалки, а форма — в теле, поэтому submit
  // связывается с ней через form="...", а не вложенностью.
  const formId = 'employee-form'

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? t('kadr.edit_employee') : t('kadr.create_employee')}
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form={formId} loading={isLoading}>
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label={t('kadr.iin')}
            value={iin}
            onChange={(e) => setIin(e.target.value)}
            className="tabular"
          />
          <Input
            label={t('kadr.lastname')}
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
            required
          />
          <Input
            label={t('kadr.firstname')}
            value={firstname}
            onChange={(e) => setFirstname(e.target.value)}
            required
          />
        </div>

        <div className="grid items-end gap-4 sm:grid-cols-3">
          <Input
            label={t('kadr.middlename')}
            value={middlename}
            onChange={(e) => setMiddlename(e.target.value)}
          />
          <Select
            label={t('kadr.department')}
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
          >
            <option value="">{t('common.select')}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.ru}
              </option>
            ))}
          </Select>
          <label
            className="flex h-10 cursor-pointer items-center gap-2 rounded-control border
              border-border bg-surface px-3 text-sm text-fg transition-colors
              hover:border-border-strong"
          >
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 cursor-pointer rounded border-border accent-primary"
            />
            {t('kadr.is_active')}
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label={t('kadr.position')}
            value={positionId}
            onChange={(e) => setPositionId(e.target.value)}
          >
            <option value="">{t('common.select')}</option>
            {positions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.ru}
              </option>
            ))}
          </Select>
          <Select
            label={t('kadr.staffing')}
            value={staffingId}
            onChange={(e) => setStaffingId(e.target.value)}
          >
            <option value="">{t('common.select')}</option>
            {shtatnostList.map((s) => (
              <option key={s.id} value={s.id}>
                {localize(s)}
              </option>
            ))}
          </Select>
          <Select
            label={t('kadr.replacement_form')}
            value={replacementFormId}
            onChange={(e) => setReplacementFormId(e.target.value)}
          >
            <option value="">{t('common.select')}</option>
            {formaList.map((f) => (
              <option key={f.id} value={f.id}>
                {localize(f)}
              </option>
            ))}
          </Select>
        </div>
      </form>
    </Modal>
  )
}
