import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { useT } from '@/shared/i18n/useT'
import Button from '@/shared/ui/Button'
import { useSwitchRoleMutation } from './authApi'

/**
 * Переключение роли без повторного ввода пароля — только когда один и тот
 * же логин зарегистрирован и как студент, и как сотрудник (user.hasMultipleRoles).
 */
export default function SwitchRoleButton() {
  const t = useT()
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)
  const [switchRole, { isLoading }] = useSwitchRoleMutation()

  if (!user?.hasMultipleRoles) return null

  const label =
    user.type === 'student' ? t('auth.switch_role_to_staff') : t('auth.switch_role_to_student')

  async function handleClick() {
    const result = await switchRole().unwrap()
    navigate(result.user.type === 'sotrudnik' ? '/staff' : '/student', { replace: true })
  }

  return (
    <Button variant="secondary" size="sm" icon="switch" loading={isLoading} onClick={handleClick} title={label}>
      <span className="hidden lg:inline">{label}</span>
    </Button>
  )
}
