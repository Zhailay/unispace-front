import { useState, type FormEvent } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  useCreateModulNameMutation,
  useUpdateModulNameMutation,
  type ModulNameRow,
  type TipModulRow,
} from './modulNameApi'
import type { Id } from '@/shared/types/api'
import { useT } from '@/shared/i18n/useT'
import Button from '@/shared/ui/Button'
import { Input, Select } from '@/shared/ui/Field'
import Modal from '@/shared/ui/Modal'

interface Props {
  open: boolean
  onClose: () => void
  tipModulList: TipModulRow[]
  editRow?: ModulNameRow | null
}

export default function ModulNameForm({ open, onClose, tipModulList, editRow }: Props) {
  const t = useT()
  const dispatch = useAppDispatch()

  const isEdit = Boolean(editRow)

  const [modulNameKz, setModulNameKz] = useState('')
  const [modulNameRu, setModulNameRu] = useState('')
  const [modulNameEn, setModulNameEn] = useState('')
  const [modulNameShortKz, setModulNameShortKz] = useState('')
  const [modulNameShortRu, setModulNameShortRu] = useState('')
  const [modulNameShortEn, setModulNameShortEn] = useState('')
  const [tipModulId, setTipModulId] = useState<Id | ''>('')

  const [createModulName, { isLoading: isCreating }] = useCreateModulNameMutation()
  const [updateModulName, { isLoading: isUpdating }] = useUpdateModulNameMutation()
  const isLoading = isCreating || isUpdating

  function resetForm() {
    if (editRow) {
      setModulNameKz(editRow.out_modul_name_kz)
      setModulNameRu(editRow.out_modul_name_ru)
      setModulNameEn(editRow.out_modul_name_en)
      setModulNameShortKz(editRow.out_modul_name_short_kz)
      setModulNameShortRu(editRow.out_modul_name_short_ru)
      setModulNameShortEn(editRow.out_modul_name_short_en)
      setTipModulId(editRow.out_id_tip_modul ?? '')
    } else {
      setModulNameKz('')
      setModulNameRu('')
      setModulNameEn('')
      setModulNameShortKz('')
      setModulNameShortRu('')
      setModulNameShortEn('')
      setTipModulId('')
    }
  }

  const [prevOpen, setPrevOpen] = useState(open)
  const [prevEditId, setPrevEditId] = useState<Id | null>(null)
  if (open !== prevOpen || (editRow?.out_modul_name_id ?? null) !== prevEditId) {
    setPrevOpen(open)
    setPrevEditId(editRow?.out_modul_name_id ?? null)
    if (open) {
      resetForm()
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (
      !modulNameKz.trim() ||
      !modulNameRu.trim() ||
      !modulNameEn.trim() ||
      !modulNameShortKz.trim() ||
      !modulNameShortRu.trim() ||
      !modulNameShortEn.trim() ||
      !tipModulId
    ) {
      dispatch(toastPushed('error', t('modul_name.error_fill_fields')))
      return
    }

    const payload = {
      modul_name_kz: modulNameKz.trim(),
      modul_name_ru: modulNameRu.trim(),
      modul_name_en: modulNameEn.trim(),
      modul_name_short_kz: modulNameShortKz.trim(),
      modul_name_short_ru: modulNameShortRu.trim(),
      modul_name_short_en: modulNameShortEn.trim(),
      id_tip_modul: tipModulId,
    }

    try {
      let result
      if (isEdit && editRow) {
        result = await updateModulName({ ...payload, modul_name_id: editRow.out_modul_name_id }).unwrap()
      } else {
        result = await createModulName(payload).unwrap()
      }

      if (result.data && Array.isArray(result.data) && result.data[0]?.out_code === 2) {
        dispatch(toastPushed('error', t('modul_name.error_duplicate')))
        return
      }

      if (result.ok) {
        dispatch(
          toastPushed(
            'success',
            result.error ?? t(isEdit ? 'modul_name.success_update' : 'modul_name.success_add'),
          ),
        )
        onClose()
      } else {
        dispatch(toastPushed('error', result.error ?? t('modul_name.error_connection')))
      }
    } catch {
      dispatch(toastPushed('error', t('modul_name.error_connection')))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('modul_name.change_modul_name') : t('modul_name.add_modul_name')}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Select
          label={`${t('modul_name.tip_modul')} *`}
          value={tipModulId}
          onChange={(e) => setTipModulId(e.target.value)}
          required
        >
          <option value="" disabled>
            {t('modul_name.select_tip_modul')}
          </option>
          {tipModulList.map((item) => (
            <option key={String(item.tip_modul_id)} value={String(item.tip_modul_id)}>
              {item.tip_modul_name}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label={`${t('modul_name.name_kz')} *`}
            value={modulNameKz}
            onChange={(e) => setModulNameKz(e.target.value)}
            required
          />
          <Input
            label={`${t('modul_name.name_ru')} *`}
            value={modulNameRu}
            onChange={(e) => setModulNameRu(e.target.value)}
            required
          />
          <Input
            label={`${t('modul_name.name_en')} *`}
            value={modulNameEn}
            onChange={(e) => setModulNameEn(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label={`${t('modul_name.short_kz')} *`}
            value={modulNameShortKz}
            onChange={(e) => setModulNameShortKz(e.target.value)}
            required
          />
          <Input
            label={`${t('modul_name.short_ru')} *`}
            value={modulNameShortRu}
            onChange={(e) => setModulNameShortRu(e.target.value)}
            required
          />
          <Input
            label={`${t('modul_name.short_en')} *`}
            value={modulNameShortEn}
            onChange={(e) => setModulNameShortEn(e.target.value)}
            required
          />
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('modul_name.cancel_but')}
          </Button>
          <Button type="submit" loading={isLoading}>
            {t('modul_name.save_but')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
