import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { useChooseRoleMutation, useLoginMutation } from '@/features/auth/authApi'
import { useT } from '@/shared/i18n/useT'
import type { UserType } from '@/shared/types/api'
import Button from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Field'
import Icon, { type IconName } from '@/shared/ui/Icon'
import LangSwitcher from '@/shared/ui/LangSwitcher'

function errorMessage(err: unknown): string | null {
  return typeof err === 'object' && err !== null && 'data' in err
    ? ((err.data as { error?: string })?.error ?? null)
    : null
}

const ROLES: { role: UserType; icon: IconName; labelKey: string; descKey: string }[] = [
  { role: 'student', icon: 'academic', labelKey: 'role.student', descKey: 'auth.role_student_desc' },
  { role: 'sotrudnik', icon: 'briefcase', labelKey: 'auth.staff_label', descKey: 'auth.role_staff_desc' },
]

export default function LoginPage() {
  const t = useT()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAppSelector((s) => s.auth.user)

  // Один общий вход для всех — бэк сам определяет, студент это или сотрудник,
  // пробуя оба потока по логину и паролю. Если совпало и там и там (тот же
  // ИИН зарегистрирован дважды), просим выбрать роль отдельным шагом.
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsRoleChoice, setNeedsRoleChoice] = useState(false)

  const [doLogin, { isLoading: loggingIn }] = useLoginMutation()
  const [doChooseRole, { isLoading: choosingRole }] = useChooseRoleMutation()

  if (user) {
    return <Navigate to={user.type === 'sotrudnik' ? '/staff' : '/student'} replace />
  }

  function goAfterLogin(userType: UserType) {
    const from = (location.state as { from?: Location } | null)?.from?.pathname
    navigate(from ?? (userType === 'sotrudnik' ? '/staff' : '/student'), { replace: true })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    try {
      const result = await doLogin({ login, password }).unwrap()
      if (result.needsRoleChoice) {
        setNeedsRoleChoice(true)
      } else if (result.user) {
        goAfterLogin(result.user.type)
      }
    } catch (err) {
      setError(errorMessage(err) ?? t('auth.login_failed'))
    }
  }

  async function handleChooseRole(role: UserType) {
    setError(null)
    try {
      const result = await doChooseRole({ role }).unwrap()
      goAfterLogin(result.user.type)
    } catch (err) {
      setError(errorMessage(err) ?? t('auth.login_failed'))
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex size-12 items-center justify-center rounded-card bg-primary text-primary-fg shadow-raised">
            <Icon name="academic" className="size-6" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">{t('common.app_name')}</h1>
          <p className="mt-1 text-sm text-muted">{t('auth.login_title')}</p>
        </div>

        <div className="rounded-card border border-border bg-surface p-6 shadow-raised">
          {needsRoleChoice ? (
            <>
              <h2 className="text-base font-semibold">{t('auth.choose_role_title')}</h2>
              <p className="mt-1 text-sm text-muted">{t('auth.choose_role_subtitle')}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {ROLES.map(({ role, icon, labelKey, descKey }) => (
                  <button
                    key={role}
                    type="button"
                    disabled={choosingRole}
                    onClick={() => handleChooseRole(role)}
                    className="group flex cursor-pointer flex-col items-center gap-2 rounded-card
                      border border-border p-4 text-center transition-colors
                      hover:border-primary hover:bg-primary-soft
                      focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
                      disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span
                      className="flex size-10 items-center justify-center rounded-full bg-surface-2
                        text-muted transition-colors group-hover:bg-surface group-hover:text-primary"
                    >
                      <Icon name={icon} className="size-5" />
                    </span>
                    <span className="text-sm font-medium">{t(labelKey)}</span>
                    <span className="text-xs text-muted">{t(descKey)}</span>
                  </button>
                ))}
              </div>

              {error && <ErrorNote message={error} />}

              <button
                type="button"
                onClick={() => setNeedsRoleChoice(false)}
                className="mt-5 flex cursor-pointer items-center gap-1 text-sm text-muted
                  transition-colors hover:text-fg
                  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Icon name="chevronLeft" className="size-3.5" />
                {t('auth.back_to_login')}
              </button>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label={t('auth.login_label')}
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                autoComplete="username"
                inputMode="numeric"
                placeholder="123456789012"
                className="tabular"
                autoFocus
                required
              />

              <div className="relative">
                <Input
                  label={t('auth.password')}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t('auth.hide_password') : t('auth.show_password')}
                  aria-pressed={showPassword}
                  className="absolute right-2 bottom-1.5 flex size-7 cursor-pointer items-center
                    justify-center rounded text-subtle transition-colors
                    hover:bg-surface-2 hover:text-fg
                    focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} className="size-4" />
                </button>
              </div>

              {error && <ErrorNote message={error} />}

              <Button type="submit" loading={loggingIn} className="mt-1 w-full">
                {t('common.login')}
              </Button>
            </form>
          )}
        </div>

        <div className="mt-5 flex justify-center">
          <LangSwitcher />
        </div>
      </div>
    </div>
  )
}

function ErrorNote({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="mt-4 flex items-start gap-2 rounded-control bg-danger-soft px-3 py-2 text-sm text-danger"
    >
      <Icon name="alert" className="mt-0.5 size-4" />
      <span className="min-w-0">{message}</span>
    </p>
  )
}
