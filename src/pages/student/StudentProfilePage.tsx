import { useStudentChangePasswordMutation } from '@/features/profile/profileApi'
import ProfileView from '@/features/profile/ProfileView'

export default function StudentProfilePage() {
  const [changePassword, { isLoading }] = useStudentChangePasswordMutation()

  return <ProfileView changePassword={changePassword} isLoading={isLoading} />
}
