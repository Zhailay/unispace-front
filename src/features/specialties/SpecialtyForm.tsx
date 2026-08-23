import { useState, type FormEvent } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  useCreateSpecialtyMutation,
  useUpdateSpecialtyMutation,
  type SpecialtyRow,
} from './specialtiesApi'
import type { Id, SpisokRow } from '@/shared/types/api'
import { useT } from '@/shared/i18n/useT'
import Button from '@/shared/ui/Button'
import { Input, Select } from '@/shared/ui/Field'
import Modal from '@/shared/ui/Modal'

interface Props {
  open: boolean
  onClose: () => void
  gruppaOpList: SpisokRow[]
  /** If provided, form is in edit mode; otherwise in create mode. */
  editRow?: SpecialtyRow | null
}

/**
 * Modal form for creating/editing a specialty.
 * Fields: spec_kod, spec_kz, spec_ru, spec_en, id_gruppa_op
 * Matches behavior from unispace/src/views/ucheb/specialties.hbs
 */
export default function SpecialtyForm({ open, onClose, gruppaOpList, editRow }: Props) {
  const t = useT()
  const dispatch = useAppDispatch()

  const isEdit = Boolean(editRow)

  const [specKod, setSpecKod] = useState('')
  const [specKz, setSpecKz] = useState('')
  const [specRu, setSpecRu] = useState('')
  const [specEn, setSpecEn] = useState('')
  const [gruppaOpId, setGruppaOpId] = useState<Id | ''>('')

  const [createSpecialty, { isLoading: isCreating }] = useCreateSpecialtyMutation()
  const [updateSpecialty, { isLoading: isUpdating }] = useUpdateSpecialtyMutation()
  const isLoading = isCreating || isUpdating

  // Reset form when modal opens/closes or editRow changes
  function resetForm() {
    if (editRow) {
      setSpecKod(editRow.out_spec_kod)
      setSpecKz(editRow.out_spec_kz)
      setSpecRu(editRow.out_spec_ru)
      setSpecEn(editRow.out_spec_en)
      setGruppaOpId(editRow.out_id_gruppa_op)
    } else {
      setSpecKod('')
      setSpecKz('')
      setSpecRu('')
      setSpecEn('')
      setGruppaOpId('')
    }
  }

  // Sync form state when editRow or open changes
  // Using a simple approach: reset on open
  const [prevOpen, setPrevOpen] = useState(open)
  const [prevEditId, setPrevEditId] = useState<Id | null>(null)
  if (open !== prevOpen || (editRow?.out_spec_id ?? null) !== prevEditId) {
    setPrevOpen(open)
    setPrevEditId(editRow?.out_spec_id ?? null)
    if (open) {
      resetForm()
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    // Validation - all fields required
    if (!specKod.trim() || !specKz.trim() || !specRu.trim() || !specEn.trim() || !gruppaOpId) {
      dispatch(toastPushed('error', t('specialties.error_fill_fields')))
      return
    }

    const payload = {
      spec_kod: specKod.trim(),
      spec_kz: specKz.trim(),
      spec_ru: specRu.trim(),
      spec_en: specEn.trim(),
      id_gruppa_op: gruppaOpId as Id,
    }

    try {
      let result
      if (isEdit && editRow) {
        result = await updateSpecialty({ ...payload, spec_id: editRow.out_spec_id }).unwrap()
      } else {
        result = await createSpecialty(payload).unwrap()
      }

      // Handle out_code === 2 (duplicate)
      if (result.data && Array.isArray(result.data) && result.data[0]?.out_code === 2) {
        dispatch(toastPushed('error', t('specialties.error_duplicate')))
        return
      }

      if (result.ok) {
        dispatch(
          toastPushed(
            'success',
            t(isEdit ? 'specialties.success_update' : 'specialties.success_add'),
          ),
        )
        onClose()
      } else {
        dispatch(toastPushed('error', result.error ?? t('specialties.error_connection')))
      }
    } catch {
      dispatch(toastPushed('error', t('specialties.error_connection')))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('specialties.change_spec') : t('specialties.add_spec')}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Select
          label={`${t('specialties.gruppa_op')} *`}
          value={gruppaOpId}
          onChange={(e) => setGruppaOpId(e.target.value)}
          required
        >
          <option value="" disabled>
            {t('specialties.select_gruppa_op')}
          </option>
          {gruppaOpList.map((item) => (
            <option key={String(item.gruppa_op_id)} value={String(item.gruppa_op_id)}>
              {String(item.gruppa_op_name)}
            </option>
          ))}
        </Select>

        <Input
          label={t('specialties.spec_kod')}
          value={specKod}
          onChange={(e) => setSpecKod(e.target.value)}
          required
        />

        <Input
          label={t('specialties.name_kz')}
          value={specKz}
          onChange={(e) => setSpecKz(e.target.value)}
          required
        />

        <Input
          label={t('specialties.name_ru')}
          value={specRu}
          onChange={(e) => setSpecRu(e.target.value)}
          required
        />

        <Input
          label={t('specialties.name_en')}
          value={specEn}
          onChange={(e) => setSpecEn(e.target.value)}
          required
        />

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('specialties.cancel_but')}
          </Button>
          <Button type="submit" loading={isLoading}>
            {t('specialties.save_but')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
