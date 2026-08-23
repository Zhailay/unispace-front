import { useState, useEffect, type FormEvent } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useStudentsGroupsQuery,
  type StudentRow,
  type SpecItem,
  type FormaObuchItem,
  type GodItem,
  type KursItem,
} from './studentsApi'
import type { Id } from '@/shared/types/api'
import { useT } from '@/shared/i18n/useT'
import Button from '@/shared/ui/Button'
import { Input, Select } from '@/shared/ui/Field'
import Modal from '@/shared/ui/Modal'

interface Props {
  open: boolean
  onClose: () => void
  editRow?: StudentRow | null
  specList: SpecItem[]
  formaObuchList: FormaObuchItem[]
  godList: GodItem[]
  kursList: KursItem[]
}

export default function StudentForm({
  open,
  onClose,
  editRow,
  specList,
  formaObuchList,
  godList,
  kursList,
}: Props) {
  const t = useT()
  const dispatch = useAppDispatch()

  const isEdit = Boolean(editRow)

  const [iin, setIin] = useState('')
  const [familiya, setFamiliya] = useState('')
  const [imya, setImya] = useState('')
  const [otchestvo, setOtchestvo] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [idGod, setIdGod] = useState<Id>('')
  const [idSpec, setIdSpec] = useState<Id>('')
  const [idFormaObuch, setIdFormaObuch] = useState<Id>('')
  const [idGruppa, setIdGruppa] = useState<Id>('')
  const [idKurs, setIdKurs] = useState<Id>('')
  const [status, setStatus] = useState<string>('')

  // Store selected gruppa when editing to set it after groups load
  const [pendingGruppaId, setPendingGruppaId] = useState<Id | null>(null)

  const [createStudent, { isLoading: isCreating }] = useCreateStudentMutation()
  const [updateStudent, { isLoading: isUpdating }] = useUpdateStudentMutation()
  const isLoading = isCreating || isUpdating

  // Cascade: fetch groups only when all three are selected
  const shouldFetchGroups = Boolean(idGod && idSpec && idFormaObuch)
  const { data: groupsData, isFetching: isFetchingGroups } = useStudentsGroupsQuery(
    { id_god: idGod, id_spec: idSpec, id_forma_obuch: idFormaObuch },
    { skip: !shouldFetchGroups },
  )
  const groupsList = groupsData?.data ?? []

  // Set pending gruppa after groups load
  useEffect(() => {
    const groups = groupsData?.data ?? []
    if (pendingGruppaId && groups.length > 0) {
      const found = groups.find((g) => g.gruppa_id === pendingGruppaId)
      if (found) {
        setIdGruppa(pendingGruppaId)
      }
      setPendingGruppaId(null)
    }
  }, [groupsData?.data, pendingGruppaId])

  // Reset form when modal opens/closes or editRow changes
  function resetForm() {
    if (editRow) {
      setIin(editRow.out_student_iin)
      setFamiliya(editRow.out_student_familiya)
      setImya(editRow.out_student_imya)
      setOtchestvo(editRow.out_student_otchestvo)
      setEmail(editRow.out_student_email ?? '')
      setPassword('')
      setIdGod(editRow.out_id_god ?? '')
      setIdSpec(editRow.out_id_spec ?? '')
      setIdFormaObuch(editRow.out_id_forma_obuch ?? '')
      setIdKurs(editRow.out_id_kurs ?? '')
      setStatus(editRow.out_gruppa_student_status?.toString() ?? '')
      // Store gruppa to set after groups load
      setPendingGruppaId(editRow.out_id_gruppa)
      setIdGruppa('')
    } else {
      setIin('')
      setFamiliya('')
      setImya('')
      setOtchestvo('')
      setEmail('')
      setPassword('')
      setIdGod('')
      setIdSpec('')
      setIdFormaObuch('')
      setIdGruppa('')
      setIdKurs('')
      setStatus('')
      setPendingGruppaId(null)
    }
  }

  // Sync form state when editRow or open changes
  const [prevOpen, setPrevOpen] = useState(open)
  const [prevEditId, setPrevEditId] = useState<Id | null>(null)
  if (open !== prevOpen || (editRow?.out_student_id ?? null) !== prevEditId) {
    setPrevOpen(open)
    setPrevEditId(editRow?.out_student_id ?? null)
    if (open) {
      resetForm()
    }
  }

  // Reset gruppa when cascade dependencies change
  function handleGodChange(value: Id) {
    setIdGod(value)
    setIdGruppa('')
  }
  function handleSpecChange(value: Id) {
    setIdSpec(value)
    setIdGruppa('')
  }
  function handleFormaObuchChange(value: Id) {
    setIdFormaObuch(value)
    setIdGruppa('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    // Validation - all fields required (password only for create)
    if (
      !iin.trim() ||
      !familiya.trim() ||
      !imya.trim() ||
      !otchestvo.trim() ||
      !email.trim() ||
      (!isEdit && !password) ||
      !idGruppa ||
      !idKurs ||
      !status
    ) {
      dispatch(toastPushed('error', t('ucheb_students.error_fill_fields') || t('error.validation_failed')))
      return
    }

    try {
      let result
      if (isEdit && editRow) {
        result = await updateStudent({
          student_id: editRow.out_student_id,
          student_imya: imya.trim(),
          student_otchestvo: otchestvo.trim(),
          student_familiya: familiya.trim(),
          student_iin: iin.trim(),
          student_email: email.trim(),
          id_gruppa: idGruppa,
          id_kurs: idKurs,
          gruppa_student_status: parseInt(status, 10),
        }).unwrap()
      } else {
        result = await createStudent({
          student_imya: imya.trim(),
          student_otchestvo: otchestvo.trim(),
          student_familiya: familiya.trim(),
          student_iin: iin.trim(),
          student_email: email.trim(),
          student_password: password,
          id_gruppa: idGruppa,
          id_kurs: idKurs,
          gruppa_student_status: parseInt(status, 10),
        }).unwrap()
      }

      if (result.ok) {
        dispatch(
          toastPushed(
            'success',
            t(isEdit ? 'success.updated' : 'success.created'),
          ),
        )
        onClose()
      } else {
        dispatch(toastPushed('error', result.error ?? t('ucheb_students.error_connection')))
      }
    } catch {
      dispatch(toastPushed('error', t('ucheb_students.error_connection')))
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('ucheb_students.change_student') : t('ucheb_students.add_student')}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('ucheb_students.iin')}
            value={iin}
            onChange={(e) => setIin(e.target.value)}
            maxLength={12}
            required
          />
          <Input
            label={t('ucheb_students.last_name')}
            value={familiya}
            onChange={(e) => setFamiliya(e.target.value)}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('ucheb_students.first_name')}
            value={imya}
            onChange={(e) => setImya(e.target.value)}
            required
          />
          <Input
            label={t('ucheb_students.middle_name')}
            value={otchestvo}
            onChange={(e) => setOtchestvo(e.target.value)}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('ucheb_students.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {!isEdit && (
            <Input
              label={t('ucheb_students.password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label={t('ucheb_students.enrollment_year')}
            value={idGod}
            onChange={(e) => handleGodChange(e.target.value)}
            required
          >
            <option value="">{t('ucheb_students.select_enrollment_year')}</option>
            {godList.map((item) => (
              <option key={item.god_id} value={item.god_id}>
                {item.god_value}
              </option>
            ))}
          </Select>

          <Select
            label={t('ucheb_students.qualification')}
            value={idSpec}
            onChange={(e) => handleSpecChange(e.target.value)}
            required
          >
            <option value="">{t('ucheb_students.select_qualification')}</option>
            {specList.map((item) => (
              <option key={item.spec_id} value={item.spec_id}>
                {item.spec_name}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label={t('ucheb_students.form_of_education')}
            value={idFormaObuch}
            onChange={(e) => handleFormaObuchChange(e.target.value)}
            required
          >
            <option value="">{t('ucheb_students.select_form_of_education')}</option>
            {formaObuchList.map((item) => (
              <option key={item.forma_obuch_id} value={item.forma_obuch_id}>
                {item.forma_obuch_name}
              </option>
            ))}
          </Select>

          <Select
            label={t('ucheb_students.group')}
            value={idGruppa}
            onChange={(e) => setIdGruppa(e.target.value)}
            disabled={!shouldFetchGroups || isFetchingGroups}
            required
          >
            <option value="">
              {isFetchingGroups
                ? t('common.loading') || 'Loading...'
                : t('ucheb_students.select_group')}
            </option>
            {groupsList.map((item) => (
              <option key={item.gruppa_id} value={item.gruppa_id}>
                {item.gruppa_name}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label={t('ucheb_students.kurs')}
            value={idKurs}
            onChange={(e) => setIdKurs(e.target.value)}
            required
          >
            <option value="">{t('ucheb_students.select_kurs')}</option>
            {kursList.map((item) => (
              <option key={item.kurs_id} value={item.kurs_id}>
                {item.kurs_nomer}
              </option>
            ))}
          </Select>

          <Select
            label={t('ucheb_students.status')}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
          >
            <option value="">{t('ucheb_students.select_status')}</option>
            <option value="1">{t('ucheb_students.active')}</option>
            <option value="0">{t('ucheb_students.inactive')}</option>
          </Select>
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('ucheb_students.cancel_but')}
          </Button>
          <Button type="submit" loading={isLoading}>
            {t('ucheb_students.save_but')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
