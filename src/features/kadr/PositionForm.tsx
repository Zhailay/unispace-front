import { useState, type FormEvent } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  useCreatePositionMutation,
  useUpdatePositionMutation,
  type PositionRow,
  type VidPersonalRow,
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
  vidPersonalList: VidPersonalRow[]
  editRow?: PositionRow | null
}

export default function PositionForm({ open, onClose, vidPersonalList, editRow }: Props) {
  const t = useT()
  const lang = getLang()
  const dispatch = useAppDispatch()

  const isEdit = Boolean(editRow)

  const [nameKz, setNameKz] = useState('')
  const [nameRu, setNameRu] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [staffTypeId, setStaffTypeId] = useState<Id | ''>('')

  const [createPosition, { isLoading: isCreating }] = useCreatePositionMutation()
  const [updatePosition, { isLoading: isUpdating }] = useUpdatePositionMutation()
  const isLoading = isCreating || isUpdating

  function resetForm() {
    if (editRow) {
      setNameKz(editRow.kz)
      setNameRu(editRow.ru)
      setNameEn(editRow.en)
      setStaffTypeId(editRow.vidPersonalId || '')
    } else {
      setNameKz('')
      setNameRu('')
      setNameEn('')
      setStaffTypeId('')
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

    if (!nameKz.trim() || !nameRu.trim() || !nameEn.trim()) {
      dispatch(toastPushed('error', t('common.fill_required_fields')))
      return
    }

    const payload = {
      name_kz: nameKz.trim(),
      name_ru: nameRu.trim(),
      name_en: nameEn.trim(),
      staff_type_id: staffTypeId || undefined,
    }

    try {
      let result
      if (isEdit && editRow) {
        result = await updatePosition({ ...payload, id: editRow.id }).unwrap()
      } else {
        result = await createPosition(payload).unwrap()
      }

      if (result.code === 2) {
        dispatch(toastPushed('error', t('kadr.position_exists')))
        return
      }

      dispatch(
        toastPushed(
          'success',
          t(isEdit ? 'kadr.position_updated' : 'kadr.position_created'),
        ),
      )
      onClose()
    } catch {
      dispatch(toastPushed('error', t('common.error_connection')))
    }
  }

  function vidPersonalName(row: VidPersonalRow): string {
    if (lang === 'kk') return row.kz
    if (lang === 'en') return row.en
    return row.ru
  }

  // Кнопки живут в footer модалки, а форма — в теле, поэтому submit
  // связывается с ней через form="...", а не вложенностью.
  const formId = 'position-form'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('kadr.edit_position') : t('kadr.create_position')}
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('kadr.name_kz')}
            value={nameKz}
            onChange={(e) => setNameKz(e.target.value)}
            required
          />
          <Input
            label={t('kadr.name_ru')}
            value={nameRu}
            onChange={(e) => setNameRu(e.target.value)}
            required
          />
        </div>
        <Input
          label={t('kadr.name_en')}
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          required
        />
        <Select
          label={t('kadr.staff_type')}
          value={staffTypeId}
          onChange={(e) => setStaffTypeId(e.target.value)}
        >
          <option value="">{t('common.select')}</option>
          {vidPersonalList.map((v) => (
            <option key={v.id} value={v.id}>
              {vidPersonalName(v)}
            </option>
          ))}
        </Select>
      </form>
    </Modal>
  )
}
