import { useState, type FormEvent } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  type DepartmentRow,
  type VidPodrazdelenieRow,
  vidName,
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
  vidList: VidPodrazdelenieRow[]
  allDepartments: DepartmentRow[]
  editRow?: DepartmentRow | null
}

export default function DepartmentForm({ open, onClose, vidList, allDepartments, editRow }: Props) {
  const t = useT()
  const lang = getLang()
  const dispatch = useAppDispatch()

  const isEdit = Boolean(editRow)

  const [nameKz, setNameKz] = useState('')
  const [nameRu, setNameRu] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [typeId, setTypeId] = useState<Id | ''>('')
  const [parentId, setParentId] = useState<Id | ''>('')
  const [order, setOrder] = useState('')
  const [isActive, setIsActive] = useState(true)

  const [createDepartment, { isLoading: isCreating }] = useCreateDepartmentMutation()
  const [updateDepartment, { isLoading: isUpdating }] = useUpdateDepartmentMutation()
  const isLoading = isCreating || isUpdating

  function resetForm() {
    if (editRow) {
      setNameKz(editRow.kz)
      setNameRu(editRow.ru)
      setNameEn(editRow.en)
      setTypeId(editRow.vidId || '')
      setParentId(editRow.secondId || '')
      setOrder(editRow.nomer?.toString() ?? '')
      setIsActive(editRow.status)
    } else {
      setNameKz('')
      setNameRu('')
      setNameEn('')
      setTypeId('')
      setParentId('')
      setOrder('')
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

    if (!nameKz.trim() || !nameRu.trim() || !nameEn.trim()) {
      dispatch(toastPushed('error', t('common.fill_required_fields')))
      return
    }

    const payload = {
      name_kz: nameKz.trim(),
      name_ru: nameRu.trim(),
      name_en: nameEn.trim(),
      type_id: typeId || undefined,
      parent_id: parentId || undefined,
      order: order || undefined,
      is_active: isActive ? 'on' as const : '' as const,
    }

    try {
      let result
      if (isEdit && editRow) {
        result = await updateDepartment({ ...payload, id: editRow.id }).unwrap()
      } else {
        result = await createDepartment(payload).unwrap()
      }

      if (result.code === 2) {
        dispatch(toastPushed('error', t('kadr.department_exists')))
        return
      }

      dispatch(
        toastPushed(
          'success',
          t(isEdit ? 'kadr.department_updated' : 'kadr.department_created'),
        ),
      )
      onClose()
    } catch {
      dispatch(toastPushed('error', t('common.error_connection')))
    }
  }

  // Filter out current department from parent options to prevent self-reference
  const parentOptions = allDepartments.filter((d) => d.id !== editRow?.id)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('kadr.edit_department') : t('kadr.create_department')}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-4">
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
          <Input
            label={t('kadr.name_en')}
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-4 gap-4 items-end">
          <Select
            label={t('kadr.department_type')}
            value={typeId}
            onChange={(e) => setTypeId(e.target.value)}
          >
            <option value="">{t('common.select')}</option>
            {vidList.map((v) => (
              <option key={v.id} value={v.id}>
                {vidName(v, lang)}
              </option>
            ))}
          </Select>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-fg">{t('kadr.is_active')}</label>
            <label className="flex items-center gap-2 h-10">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="size-4 rounded border-border"
              />
            </label>
          </div>

          <Select
            label={t('kadr.parent_department')}
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            <option value="">{t('kadr.no_parent')}</option>
            {parentOptions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.ru}
              </option>
            ))}
          </Select>

          <Input
            label={t('kadr.order_number')}
            type="number"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
          />
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={isLoading}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
