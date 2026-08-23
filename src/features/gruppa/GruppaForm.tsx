import { useState, type FormEvent } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  useCreateGruppaMutation,
  useUpdateGruppaMutation,
  type GruppaRow,
  type OtdelenieItem,
  type SpecItem,
  type FormaObuchItem,
  type GodItem,
} from './gruppaApi'
import type { Id } from '@/shared/types/api'
import { useT } from '@/shared/i18n/useT'
import Button from '@/shared/ui/Button'
import { Input, Select } from '@/shared/ui/Field'
import Modal from '@/shared/ui/Modal'

interface Props {
  open: boolean
  onClose: () => void
  /** If provided, form is in edit mode; otherwise in create mode. */
  editRow?: GruppaRow | null
  /** Dropdown lists from the page endpoint */
  otdelenieList: OtdelenieItem[]
  specList: SpecItem[]
  formaObuchList: FormaObuchItem[]
  godList: GodItem[]
}

/**
 * Modal form for creating/editing a Gruppa (student group).
 * Fields: gruppa_name, id_otdelenie, id_spec, id_forma_obuch, id_god
 * Matches behavior from unispace/src/views/ucheb/gruppa.hbs
 */
export default function GruppaForm({
  open,
  onClose,
  editRow,
  otdelenieList,
  specList,
  formaObuchList,
  godList,
}: Props) {
  const t = useT()
  const dispatch = useAppDispatch()

  const isEdit = Boolean(editRow)

  const [gruppaName, setGruppaName] = useState('')
  const [idOtdelenie, setIdOtdelenie] = useState<Id>('')
  const [idSpec, setIdSpec] = useState<Id>('')
  const [idFormaObuch, setIdFormaObuch] = useState<Id>('')
  const [idGod, setIdGod] = useState<Id>('')

  const [createGruppa, { isLoading: isCreating }] = useCreateGruppaMutation()
  const [updateGruppa, { isLoading: isUpdating }] = useUpdateGruppaMutation()
  const isLoading = isCreating || isUpdating

  // Reset form when modal opens/closes or editRow changes
  function resetForm() {
    if (editRow) {
      setGruppaName(editRow.out_gruppa_name)
      setIdOtdelenie(editRow.out_id_otdelenie)
      setIdSpec(editRow.out_id_spec)
      setIdFormaObuch(editRow.out_id_forma_obuch)
      setIdGod(editRow.out_id_god)
    } else {
      setGruppaName('')
      setIdOtdelenie('')
      setIdSpec('')
      setIdFormaObuch('')
      setIdGod('')
    }
  }

  // Sync form state when editRow or open changes
  const [prevOpen, setPrevOpen] = useState(open)
  const [prevEditId, setPrevEditId] = useState<Id | null>(null)
  if (open !== prevOpen || (editRow?.out_gruppa_id ?? null) !== prevEditId) {
    setPrevOpen(open)
    setPrevEditId(editRow?.out_gruppa_id ?? null)
    if (open) {
      resetForm()
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    // Validation - all fields required
    if (!gruppaName.trim() || !idOtdelenie || !idSpec || !idFormaObuch || !idGod) {
      dispatch(toastPushed('error', t('ucheb_groups.error_fill_fields') || t('error.validation_failed')))
      return
    }

    const payload = {
      gruppa_name: gruppaName.trim(),
      id_otdelenie: idOtdelenie,
      id_spec: idSpec,
      id_forma_obuch: idFormaObuch,
      id_god: idGod,
    }

    try {
      let result
      if (isEdit && editRow) {
        result = await updateGruppa({ ...payload, gruppa_id: editRow.out_gruppa_id }).unwrap()
      } else {
        result = await createGruppa(payload).unwrap()
      }

      // Handle out_code === 2 (duplicate) - backend returns this in message
      if (result.ok) {
        dispatch(
          toastPushed(
            'success',
            result.error ?? t(isEdit ? 'success.updated' : 'success.created'),
          ),
        )
        onClose()
      } else {
        dispatch(toastPushed('error', result.error ?? t('ucheb_groups.error_connection')))
      }
    } catch {
      dispatch(toastPushed('error', t('ucheb_groups.error_connection')))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('ucheb_groups.change_group') : t('ucheb_groups.create_group')}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label={t('ucheb_groups.group_name')}
          value={gruppaName}
          onChange={(e) => setGruppaName(e.target.value)}
          required
        />

        <Select
          label={t('ucheb_groups.language_of_instruction')}
          value={idOtdelenie}
          onChange={(e) => setIdOtdelenie(e.target.value)}
          required
        >
          <option value="">{t('ucheb_groups.select_language_of_instruction')}</option>
          {otdelenieList.map((item) => (
            <option key={item.otdelenie_id} value={item.otdelenie_id}>
              {item.otdelenie_name}
            </option>
          ))}
        </Select>

        <Select
          label={t('ucheb_groups.qualification')}
          value={idSpec}
          onChange={(e) => setIdSpec(e.target.value)}
          required
        >
          <option value="">{t('ucheb_groups.select_qualification')}</option>
          {specList.map((item) => (
            <option key={item.spec_id} value={item.spec_id}>
              {item.spec_name}
            </option>
          ))}
        </Select>

        <Select
          label={t('ucheb_groups.level_of_education')}
          value={idFormaObuch}
          onChange={(e) => setIdFormaObuch(e.target.value)}
          required
        >
          <option value="">{t('ucheb_groups.select_level_of_education')}</option>
          {formaObuchList.map((item) => (
            <option key={item.forma_obuch_id} value={item.forma_obuch_id}>
              {item.forma_obuch_name}
            </option>
          ))}
        </Select>

        <Select
          label={t('ucheb_groups.year')}
          value={idGod}
          onChange={(e) => setIdGod(e.target.value)}
          required
        >
          <option value="">{t('ucheb_groups.select_year')}</option>
          {godList.map((item) => (
            <option key={item.god_id} value={item.god_id}>
              {item.god_value}
            </option>
          ))}
        </Select>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('ucheb_groups.cancel_but')}
          </Button>
          <Button type="submit" loading={isLoading}>
            {t('ucheb_groups.save_but')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
