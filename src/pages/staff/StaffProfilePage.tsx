import { useStaffChangePasswordMutation } from '@/features/profile/profileApi'
import ProfileView from '@/features/profile/ProfileView'

export default function StaffProfilePage() {
  const [changePassword, { isLoading }] = useStaffChangePasswordMutation()

  return <ProfileView changePassword={changePassword} isLoading={isLoading} />
}
