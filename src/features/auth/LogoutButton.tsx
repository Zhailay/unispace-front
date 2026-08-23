import { useNavigate } from 'react-router-dom'
import { useT } from '@/shared/i18n/useT'
import Button from '@/shared/ui/Button'
import { useLogoutMutation } from './authApi'

export default function LogoutButton() {
  const t = useT()
  const navigate = useNavigate()
  const [logout, { isLoading }] = useLogoutMutation()

  async function handleClick() {
    // logout чистит состояние и в случае ошибки — ждать unwrap() не нужно.
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <Button variant="secondary" loading={isLoading} onClick={handleClick}>
      {t('common.logout')}
    </Button>
  )
}
