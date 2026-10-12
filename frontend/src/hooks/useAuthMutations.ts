import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/services/apiServices'
import { setTokens } from '@/utils/auth'

interface ChangePasswordParams {
  currentPassword: string
  newPassword: string
}

// Hook to change password
export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: ChangePasswordParams) =>
      authApi.changePassword(currentPassword, newPassword),
    // Every other session was revoked; continue this one with the fresh tokens
    onSuccess: (tokens) => setTokens(tokens.access_token, tokens.refresh_token)
  })
}
