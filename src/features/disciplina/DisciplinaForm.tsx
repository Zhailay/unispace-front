import { useState, type FormEvent } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  useCreateDisciplinaMutation,
  useUpdateDisciplinaMutation,
  type DisciplinaRow,
  type PodrazdelenieRow,
} from './disciplinaApi'
import type { Id } from '@/shared/types/api'
import { useT } from '@/shared/i18n/useT'
import Button from '@/shared/ui/Button'
import { Input, Select, Textarea } from '@/shared/ui/Field'
import Modal from '@/shared/ui/Modal'

interface Props {
  open: boolean
  onClose: () => void
  podrazdelenieList: PodrazdelenieRow[]
  editRow?: DisciplinaRow | null
}

export default function DisciplinaForm({ open, onClose, podrazdelenieList, editRow }: Props) {
  const t = useT()
  const dispatch = useAppDispatch()

  const isEdit = Boolean(editRow)

  const [disciplinaKz, setDisciplinaKz] = useState('')
  const [disciplinaRu, setDisciplinaRu] = useState('')
  const [disciplinaEn, setDisciplinaEn] = useState('')
  const [kredit, setKredit] = useState<number | ''>('')
  const [lk, setLk] = useState<number | ''>('')
  const [pz, setPz] = useState<number | ''>('')
  const [lz, setLz] = useState<number | ''>('')
  const [srs, setSrs] = useState<number | ''>('')
  const [srsp, setSrsp] = useState<number | ''>('')
  const [pp, setPp] = useState<number | ''>('')
  const [lpz, setLpz] = useState<number | ''>('')
  const [fz, setFz] = useState<number | ''>('')
  const [opisanie, setOpisanie] = useState('')
  const [podrazdelenieId, setPodrazdelenieId] = useState<Id | ''>('')

  const [createDisciplina, { isLoading: isCreating }] = useCreateDisciplinaMutation()
  const [updateDisciplina, { isLoading: isUpdating }] = useUpdateDisciplinaMutation()
  const isLoading = isCreating || isUpdating

  function resetForm() {
    if (editRow) {
      setDisciplinaKz(editRow.out_disciplina_kz)
      setDisciplinaRu(editRow.out_disciplina_ru)
      setDisciplinaEn(editRow.out_disciplina_en)
      setKredit(editRow.out_disciplina_kredit ?? '')
      setLk(editRow.out_disciplina_lk ?? '')
      setPz(editRow.out_disciplina_pz ?? '')
      setLz(editRow.out_disciplina_lz ?? '')
      setSrs(editRow.out_disciplina_srs ?? '')
      setSrsp(editRow.out_disciplina_srsp ?? '')
      setPp(editRow.out_disciplina_pp ?? '')
      setLpz(editRow.out_disciplina_lpz ?? '')
      setFz(editRow.out_disciplina_fz ?? '')
      setOpisanie(editRow.out_disciplina_opisanie ?? '')
      setPodrazdelenieId(editRow.out_id_podrazdelenie ?? '')
    } else {
      setDisciplinaKz('')
      setDisciplinaRu('')
      setDisciplinaEn('')
      setKredit('')
      setLk('')
      setPz('')
      setLz('')
      setSrs('')
      setSrsp('')
      setPp('')
      setLpz('')
      setFz('')
      setOpisanie('')
      setPodrazdelenieId('')
    }
  }

  const [prevOpen, setPrevOpen] = useState(open)
  const [prevEditId, setPrevEditId] = useState<Id | null>(null)
  if (open !== prevOpen || (editRow?.out_disciplina_id ?? null) !== prevEditId) {
    setPrevOpen(open)
    setPrevEditId(editRow?.out_disciplina_id ?? null)
    if (open) {
      resetForm()
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!disciplinaKz.trim() || !disciplinaRu.trim() || !disciplinaEn.trim() || kredit === '') {
      dispatch(toastPushed('error', t('disciplina.error_fill_fields')))
      return
    }

    const payload = {
      disciplina_kz: disciplinaKz.trim(),
      disciplina_ru: disciplinaRu.trim(),
      disciplina_en: disciplinaEn.trim(),
      disciplina_kredit: Number(kredit),
      disciplina_lk: lk !== '' ? Number(lk) : undefined,
      disciplina_pz: pz !== '' ? Number(pz) : undefined,
      disciplina_lz: lz !== '' ? Number(lz) : undefined,
      disciplina_srs: srs !== '' ? Number(srs) : undefined,
      disciplina_srsp: srsp !== '' ? Number(srsp) : undefined,
      disciplina_pp: pp !== '' ? Number(pp) : undefined,
      disciplina_lpz: lpz !== '' ? Number(lpz) : undefined,
      disciplina_fz: fz !== '' ? Number(fz) : undefined,
      disciplina_opisanie: opisanie.trim() || undefined,
      id_podrazdelenie: podrazdelenieId || undefined,
    }

    try {
      let result
      if (isEdit && editRow) {
        result = await updateDisciplina({ ...payload, disciplina_id: editRow.out_disciplina_id }).unwrap()
      } else {
        result = await createDisciplina(payload).unwrap()
      }

      if (result.data && Array.isArray(result.data) && result.data[0]?.out_code === 2) {
        dispatch(toastPushed('error', t('disciplina.error_duplicate')))
        return
      }

      if (result.data && Array.isArray(result.data) && result.data[0]?.out_code === 3) {
        dispatch(toastPushed('error', t('disciplina.error_all_hours_zero')))
        return
      }

      if (result.success) {
        dispatch(
          toastPushed(
            'success',
            result.message ?? t(isEdit ? 'disciplina.success_update' : 'disciplina.success_add'),
          ),
        )
        onClose()
      } else {
        dispatch(toastPushed('error', result.message ?? t('disciplina.error_connection')))
      }
    } catch {
      dispatch(toastPushed('error', t('disciplina.error_connection')))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('disciplina.change_disciplina') : t('disciplina.add_disciplina')}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Select
          label={t('disciplina.podrazdelenie')}
          value={podrazdelenieId}
          onChange={(e) => setPodrazdelenieId(e.target.value)}
        >
          <option value="">{t('disciplina.select_podrazdelenie')}</option>
          {podrazdelenieList.map((item) => (
            <option key={String(item.podrazdelenie_id)} value={String(item.podrazdelenie_id)}>
              {item.podrazdelenie_name}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label={`${t('disciplina.name_kz')} *`}
            value={disciplinaKz}
            onChange={(e) => setDisciplinaKz(e.target.value)}
            required
          />
          <Input
            label={`${t('disciplina.name_ru')} *`}
            value={disciplinaRu}
            onChange={(e) => setDisciplinaRu(e.target.value)}
            required
          />
          <Input
            label={`${t('disciplina.name_en')} *`}
            value={disciplinaEn}
            onChange={(e) => setDisciplinaEn(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Input
            label={`${t('disciplina.kredit')} *`}
            type="number"
            min={0}
            value={kredit}
            onChange={(e) => setKredit(e.target.value ? Number(e.target.value) : '')}
            required
          />
          <Input
            label={t('disciplina.lk')}
            type="number"
            min={0}
            value={lk}
            onChange={(e) => setLk(e.target.value ? Number(e.target.value) : '')}
          />
          <Input
            label={t('disciplina.pz')}
            type="number"
            min={0}
            value={pz}
            onChange={(e) => setPz(e.target.value ? Number(e.target.value) : '')}
          />
          <Input
            label={t('disciplina.lz')}
            type="number"
            min={0}
            value={lz}
            onChange={(e) => setLz(e.target.value ? Number(e.target.value) : '')}
          />
        </div>

        <div className="grid grid-cols-5 gap-4">
          <Input
            label={t('disciplina.srs')}
            type="number"
            min={0}
            value={srs}
            onChange={(e) => setSrs(e.target.value ? Number(e.target.value) : '')}
          />
          <Input
            label={t('disciplina.srsp')}
            type="number"
            min={0}
            value={srsp}
            onChange={(e) => setSrsp(e.target.value ? Number(e.target.value) : '')}
          />
          <Input
            label={t('disciplina.pp')}
            type="number"
            min={0}
            value={pp}
            onChange={(e) => setPp(e.target.value ? Number(e.target.value) : '')}
          />
          <Input
            label={t('disciplina.lpz')}
            type="number"
            min={0}
            value={lpz}
            onChange={(e) => setLpz(e.target.value ? Number(e.target.value) : '')}
          />
          <Input
            label={t('disciplina.fz')}
            type="number"
            min={0}
            value={fz}
            onChange={(e) => setFz(e.target.value ? Number(e.target.value) : '')}
          />
        </div>

        <Textarea
          label={t('disciplina.dop_info')}
          value={opisanie}
          onChange={(e) => setOpisanie(e.target.value)}
          rows={2}
        />

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('disciplina.cancel_but')}
          </Button>
          <Button type="submit" loading={isLoading}>
            {t('disciplina.save_but')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
