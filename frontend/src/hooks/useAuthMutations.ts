import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/services/apiServices'

interface ChangePasswordParams {
  currentPassword: string
  newPassword: string
}

// Hook to change password
export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: ChangePasswordParams) =>
      authApi.changePassword(currentPassword, newPassword)
  })
}
