import { useState, type FormEvent } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  useCreateGruppaOpMutation,
  useUpdateGruppaOpMutation,
  type GruppaOpRow,
} from './gruppaOpApi'
import type { Id } from '@/shared/types/api'
import { useT } from '@/shared/i18n/useT'
import Button from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Field'
import Modal from '@/shared/ui/Modal'

interface Props {
  open: boolean
  onClose: () => void
  /** If provided, form is in edit mode; otherwise in create mode. */
  editRow?: GruppaOpRow | null
}

/**
 * Modal form for creating/editing a GruppaOp (educational program group).
 * Fields: gruppa_op_kod, gruppa_op_kz, gruppa_op_ru, gruppa_op_en
 * Matches behavior from unispace/src/views/ucheb/gruppa_op.hbs
 */
export default function GruppaOpForm({ open, onClose, editRow }: Props) {
  const t = useT()
  const dispatch = useAppDispatch()

  const isEdit = Boolean(editRow)

  const [kod, setKod] = useState('')
  const [nameKz, setNameKz] = useState('')
  const [nameRu, setNameRu] = useState('')
  const [nameEn, setNameEn] = useState('')

  const [createGruppaOp, { isLoading: isCreating }] = useCreateGruppaOpMutation()
  const [updateGruppaOp, { isLoading: isUpdating }] = useUpdateGruppaOpMutation()
  const isLoading = isCreating || isUpdating

  // Reset form when modal opens/closes or editRow changes
  function resetForm() {
    if (editRow) {
      setKod(editRow.out_gruppa_op_kod)
      setNameKz(editRow.out_gruppa_op_kz)
      setNameRu(editRow.out_gruppa_op_ru)
      setNameEn(editRow.out_gruppa_op_en)
    } else {
      setKod('')
      setNameKz('')
      setNameRu('')
      setNameEn('')
    }
  }

  // Sync form state when editRow or open changes
  const [prevOpen, setPrevOpen] = useState(open)
  const [prevEditId, setPrevEditId] = useState<Id | null>(null)
  if (open !== prevOpen || (editRow?.out_gruppa_op_id ?? null) !== prevEditId) {
    setPrevOpen(open)
    setPrevEditId(editRow?.out_gruppa_op_id ?? null)
    if (open) {
      resetForm()
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    // Validation - all fields required
    if (!kod.trim() || !nameKz.trim() || !nameRu.trim() || !nameEn.trim()) {
      dispatch(toastPushed('error', t('gruppa_op.error_fill_fields') || t('error.validation_failed')))
      return
    }

    const payload = {
      gruppa_op_kod: kod.trim(),
      gruppa_op_kz: nameKz.trim(),
      gruppa_op_ru: nameRu.trim(),
      gruppa_op_en: nameEn.trim(),
    }

    try {
      let result
      if (isEdit && editRow) {
        result = await updateGruppaOp({ ...payload, gruppa_op_id: editRow.out_gruppa_op_id }).unwrap()
      } else {
        result = await createGruppaOp(payload).unwrap()
      }

      // Handle out_code === 2 (duplicate) - backend returns this in message
      if (result.ok) {
        dispatch(
          toastPushed(
            'success',
            t(isEdit ? 'success.updated' : 'success.created'),
          ),
        )
        onClose()
      } else {
        dispatch(toastPushed('error', result.error ?? t('gruppa_op.error_connection')))
      }
    } catch {
      dispatch(toastPushed('error', t('gruppa_op.error_connection')))
    }
  }

  // Кнопки живут в footer модалки, а форма — в теле, поэтому submit
  // связывается с ней через form="...", а не вложенностью.
  const formId = 'gruppa-op-form'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('gruppa_op.change_gruppa_op') : t('gruppa_op.add_gruppa_op')}
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            {t('gruppa_op.cancel_but')}
          </Button>
          <Button type="submit" form={formId} loading={isLoading}>
            {t('gruppa_op.save_but')}
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label={t('gruppa_op.gruppa_op_kod')}
          value={kod}
          onChange={(e) => setKod(e.target.value)}
          className="tabular"
          required
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('gruppa_op.name_kz')}
            value={nameKz}
            onChange={(e) => setNameKz(e.target.value)}
            required
          />

          <Input
            label={t('gruppa_op.name_ru')}
            value={nameRu}
            onChange={(e) => setNameRu(e.target.value)}
            required
          />
        </div>

        <Input
          label={t('gruppa_op.name_en')}
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          required
        />
      </form>
    </Modal>
  )
}
