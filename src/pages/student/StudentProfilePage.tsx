import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useT } from '@/shared/i18n/useT'
import { useStudentChangePasswordMutation } from '@/features/profile/profileApi'
import { toastPushed } from '@/features/ui/uiSlice'

export default function StudentProfilePage() {
  const t = useT()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [changePassword, { isLoading }] = useStudentChangePasswordMutation()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      dispatch(toastPushed('error', t('profile.passwords_not_match')))
      return
    }

    if (newPassword.length < 6) {
      dispatch(toastPushed('error', t('profile.password_too_short')))
      return
    }

    try {
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      }).unwrap()

      dispatch(toastPushed('success', t('profile.password_changed')))
      // После смены пароля сессия уничтожена — редирект на логин
      navigate('/login', { replace: true })
    } catch (err) {
      const error = err as { data?: { error?: string } }
      dispatch(toastPushed('error', error.data?.error || t('error.internal_server')))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">{t('nav.profile')}</h1>

      {/* User info card */}
      <div className="rounded-card border border-border bg-surface p-6">
        <h2 className="mb-4 text-lg font-medium">{t('profile.info')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="text-sm text-muted">{t('profile.full_name')}</span>
            <p className="font-medium">{user?.fullName}</p>
          </div>
          <div>
            <span className="text-sm text-muted">{t('profile.iin')}</span>
            <p className="font-medium">{user?.iin}</p>
          </div>
        </div>
      </div>

      {/* Change password form */}
      <div className="rounded-card border border-border bg-surface p-6">
        <h2 className="mb-4 text-lg font-medium">{t('profile.change_password')}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('profile.current_password')}</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full rounded-card border border-border bg-bg px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('profile.new_password')}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-card border border-border bg-bg px-3 py-2 outline-none focus:border-primary"
            />
            <span className="text-xs text-muted">{t('profile.password_min_length')}</span>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('profile.confirm_password')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-card border border-border bg-bg px-3 py-2 outline-none focus:border-primary"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-card bg-primary px-4 py-2 text-primary-fg transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? t('common.saving') : t('profile.change_password')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
