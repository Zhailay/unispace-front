import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { useT } from '@/shared/i18n/useT'
import { toastPushed } from '@/features/ui/uiSlice'
import Button from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Field'
import Icon from '@/shared/ui/Icon'
import PageHeader from '@/shared/ui/PageHeader'

interface ChangePasswordArgs {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface Props {
  /** Мутация смены пароля: у студента и сотрудника разные эндпоинты. */
  changePassword: (args: ChangePasswordArgs) => { unwrap: () => Promise<unknown> }
  isLoading: boolean
}

/**
 * Профиль: карточка с данными и смена пароля. Разметка у студента и
 * сотрудника одинаковая — отличается только эндпоинт, поэтому вынесено сюда.
 */
export default function ProfileView({ changePassword, isLoading }: Props) {
  const t = useT()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Проверяем на лету, а не только по сабмиту — так ошибка видна сразу.
  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword
  const tooShort = newPassword.length > 0 && newPassword.length < 6

  async function handleSubmit(e: FormEvent) {
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
      await changePassword({ currentPassword, newPassword, confirmPassword }).unwrap()

      dispatch(toastPushed('success', t('profile.password_changed')))
      // После смены пароля сессия уничтожена — редирект на логин
      navigate('/login', { replace: true })
    } catch (err) {
      const error = err as { data?: { error?: string } }
      dispatch(toastPushed('error', error.data?.error || t('error.internal_server')))
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={t('nav.profile')} />

      <section className="rounded-card border border-border bg-surface p-5 shadow-card">
        <div className="flex items-center gap-4">
          <span
            className="flex size-14 shrink-0 items-center justify-center rounded-full
              bg-primary-soft text-lg font-semibold text-primary"
            aria-hidden
          >
            {initials(user?.fullName)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{user?.fullName}</p>
            <p className="tabular flex items-center gap-1.5 text-sm text-muted">
              <Icon name="user" className="size-3.5" />
              {t('profile.iin')}: {user?.iin}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-card border border-border bg-surface p-5 shadow-card">
        <h2 className="text-base font-semibold">{t('profile.change_password')}</h2>

        <form onSubmit={handleSubmit} className="mt-4 flex max-w-md flex-col gap-4">
          <Input
            label={t('profile.current_password')}
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <Input
            label={t('profile.new_password')}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            hint={t('profile.password_min_length')}
            error={tooShort ? t('profile.password_too_short') : undefined}
            minLength={6}
            required
          />

          <Input
            label={t('profile.confirm_password')}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            error={mismatch ? t('profile.passwords_not_match') : undefined}
            minLength={6}
            required
          />

          <div>
            <Button type="submit" loading={isLoading} disabled={mismatch || tooShort}>
              {isLoading ? t('common.saving') : t('profile.save_password')}
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}

/** «Алибеков Асан» -> «АА». Аватарки в системе нет, инициалы её заменяют. */
function initials(fullName?: string): string {
  if (!fullName) return '—'
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
