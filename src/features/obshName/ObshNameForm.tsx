import { useState, type FormEvent } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  useCreateObshNameMutation,
  useUpdateObshNameMutation,
  type ObshNameRow,
} from './obshNameApi'
import type { Id } from '@/shared/types/api'
import { useT } from '@/shared/i18n/useT'
import Button from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Field'
import Modal from '@/shared/ui/Modal'

interface Props {
  open: boolean
  onClose: () => void
  editRow?: ObshNameRow | null
}

export default function ObshNameForm({ open, onClose, editRow }: Props) {
  const t = useT()
  const dispatch = useAppDispatch()

  const isEdit = Boolean(editRow)

  const [obshNameKz, setObshNameKz] = useState('')
  const [obshNameRu, setObshNameRu] = useState('')
  const [obshNameEn, setObshNameEn] = useState('')
  const [obshNameShortKz, setObshNameShortKz] = useState('')
  const [obshNameShortRu, setObshNameShortRu] = useState('')
  const [obshNameShortEn, setObshNameShortEn] = useState('')

  const [createObshName, { isLoading: isCreating }] = useCreateObshNameMutation()
  const [updateObshName, { isLoading: isUpdating }] = useUpdateObshNameMutation()
  const isLoading = isCreating || isUpdating

  function resetForm() {
    if (editRow) {
      setObshNameKz(editRow.out_obsh_name_kz)
      setObshNameRu(editRow.out_obsh_name_ru)
      setObshNameEn(editRow.out_obsh_name_en)
      setObshNameShortKz(editRow.out_obsh_name_short_kz)
      setObshNameShortRu(editRow.out_obsh_name_short_ru)
      setObshNameShortEn(editRow.out_obsh_name_short_en)
    } else {
      setObshNameKz('')
      setObshNameRu('')
      setObshNameEn('')
      setObshNameShortKz('')
      setObshNameShortRu('')
      setObshNameShortEn('')
    }
  }

  const [prevOpen, setPrevOpen] = useState(open)
  const [prevEditId, setPrevEditId] = useState<Id | null>(null)
  if (open !== prevOpen || (editRow?.out_obsh_name_id ?? null) !== prevEditId) {
    setPrevOpen(open)
    setPrevEditId(editRow?.out_obsh_name_id ?? null)
    if (open) {
      resetForm()
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (
      !obshNameKz.trim() ||
      !obshNameRu.trim() ||
      !obshNameEn.trim() ||
      !obshNameShortKz.trim() ||
      !obshNameShortRu.trim() ||
      !obshNameShortEn.trim()
    ) {
      dispatch(toastPushed('error', t('obsh_name.error_fill_fields')))
      return
    }

    const payload = {
      obsh_name_kz: obshNameKz.trim(),
      obsh_name_ru: obshNameRu.trim(),
      obsh_name_en: obshNameEn.trim(),
      obsh_name_short_kz: obshNameShortKz.trim(),
      obsh_name_short_ru: obshNameShortRu.trim(),
      obsh_name_short_en: obshNameShortEn.trim(),
    }

    try {
      let result
      if (isEdit && editRow) {
        result = await updateObshName({ ...payload, obsh_name_id: editRow.out_obsh_name_id }).unwrap()
      } else {
        result = await createObshName(payload).unwrap()
      }

      if (result.data && Array.isArray(result.data) && result.data[0]?.out_code === 2) {
        dispatch(toastPushed('error', t('obsh_name.error_duplicate')))
        return
      }

      if (result.success) {
        dispatch(
          toastPushed(
            'success',
            result.message ?? t(isEdit ? 'obsh_name.success_update' : 'obsh_name.success_add'),
          ),
        )
        onClose()
      } else {
        dispatch(toastPushed('error', result.message ?? t('obsh_name.error_connection')))
      }
    } catch {
      dispatch(toastPushed('error', t('obsh_name.error_connection')))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('obsh_name.change_obsh_name') : t('obsh_name.add_obsh_name')}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-4">
          <Input
            label={`${t('obsh_name.name_kz')} *`}
            value={obshNameKz}
            onChange={(e) => setObshNameKz(e.target.value)}
            required
          />
          <Input
            label={`${t('obsh_name.name_ru')} *`}
            value={obshNameRu}
            onChange={(e) => setObshNameRu(e.target.value)}
            required
          />
          <Input
            label={`${t('obsh_name.name_en')} *`}
            value={obshNameEn}
            onChange={(e) => setObshNameEn(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label={`${t('obsh_name.short_kz')} *`}
            value={obshNameShortKz}
            onChange={(e) => setObshNameShortKz(e.target.value)}
            required
          />
          <Input
            label={`${t('obsh_name.short_ru')} *`}
            value={obshNameShortRu}
            onChange={(e) => setObshNameShortRu(e.target.value)}
            required
          />
          <Input
            label={`${t('obsh_name.short_en')} *`}
            value={obshNameShortEn}
            onChange={(e) => setObshNameShortEn(e.target.value)}
            required
          />
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('obsh_name.cancel_but')}
          </Button>
          <Button type="submit" loading={isLoading}>
            {t('obsh_name.save_but')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
