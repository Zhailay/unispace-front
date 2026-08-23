import { useState, type FormEvent } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import { useChangeStudentPasswordMutation } from './studentsApi'
import type { Id } from '@/shared/types/api'
import { useT } from '@/shared/i18n/useT'
import Button from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Field'
import Modal from '@/shared/ui/Modal'

interface Props {
  open: boolean
  onClose: () => void
  studentId: Id | null
}

export default function ChangePasswordForm({ open, onClose, studentId }: Props) {
  const t = useT()
  const dispatch = useAppDispatch()

  const [password, setPassword] = useState('')
  const [changePassword, { isLoading }] = useChangeStudentPasswordMutation()

  // Reset form when modal opens
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setPassword('')
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!studentId || !password.trim()) {
      dispatch(toastPushed('error', t('error.validation_failed')))
      return
    }

    try {
      const result = await changePassword({
        student_id: studentId,
        student_password_value: password,
      }).unwrap()

      if (result.ok) {
        dispatch(toastPushed('success', t('success.updated')))
        onClose()
      } else {
        dispatch(toastPushed('error', result.error ?? t('ucheb_students.error_connection')))
      }
    } catch {
      dispatch(toastPushed('error', t('ucheb_students.error_connection')))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('ucheb_students.password')}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label={t('ucheb_students.password')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

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
