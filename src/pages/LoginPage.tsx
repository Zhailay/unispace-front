import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { useLoginMutation } from '@/features/auth/authApi'
import { useT } from '@/shared/i18n/useT'
import type { UserType } from '@/shared/types/api'
import Button from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Field'
import LangSwitcher from '@/shared/ui/LangSwitcher'

export default function LoginPage() {
  const t = useT()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAppSelector((s) => s.auth.user)

  const [userType, setUserType] = useState<UserType>('sotrudnik')
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [doLogin, { isLoading }] = useLoginMutation()

  if (user) {
    return <Navigate to={user.type === 'sotrudnik' ? '/staff' : '/student'} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    try {
      const result = await doLogin({ login, password, userType }).unwrap()
      const from = (location.state as { from?: Location } | null)?.from?.pathname
      navigate(from ?? (result.user.type === 'sotrudnik' ? '/staff' : '/student'), { replace: true })
    } catch (err) {
      const message =
        typeof err === 'object' && err !== null && 'data' in err
          ? ((err.data as { error?: string })?.error ?? null)
          : null
      setError(message ?? t('auth.login_failed'))
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{t('common.app_name')}</h1>
          <LangSwitcher />
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-card border border-border bg-surface p-6 shadow-sm"
        >
          {/* Два независимых потока входа — студенты и сотрудники живут
              в разных таблицах, бэк требует явный userType. */}
          <div className="grid grid-cols-2 gap-1 rounded-card bg-bg p-1">
            {(['sotrudnik', 'student'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setUserType(type)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  userType === type ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'
                }`}
              >
                {type === 'sotrudnik' ? t('auth.login_as_staff') : t('auth.login_as_student')}
              </button>
            ))}
          </div>

          <Input
            label={t('auth.login_label')}
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            autoComplete="username"
            inputMode="numeric"
            placeholder="123456789012"
            required
          />

          <Input
            label={t('auth.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}

          <Button type="submit" loading={isLoading}>
            {t('common.login')}
          </Button>
        </form>
      </div>
    </div>
  )
}
