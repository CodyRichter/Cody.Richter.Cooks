import { useCallback } from 'react'
import { QueryClient, useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { IconCheck, IconX } from '@tabler/icons-react'
import { authApi } from '@/services/apiServices'
import { authQueryKeys } from '@/contexts/AuthContext'
import { clearTokens, setSession, setTokens } from '@/utils/auth'
import { formatNotificationError } from '@/utils/notificationUtils'
import { LoginRequest, UserRegistration } from '@/types/User'

interface ChangePasswordParams {
  currentPassword: string
  newPassword: string
}

// Drops data that belongs to whoever was logged in
const clearUserQueries = (queryClient: QueryClient) => {
  queryClient.removeQueries({ queryKey: authQueryKeys.all })
  queryClient.removeQueries({ queryKey: ['recipe-permissions'] })
}

export const useLogin = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onSuccess: ({ access_token, refresh_token, user }) => {
      clearUserQueries(queryClient)
      queryClient.setQueryData(authQueryKeys.me, user)
      setSession(access_token, refresh_token, user)
      notifications.show({
        title: 'Welcome back!',
        message: `It's great to see you again, ${user.username}.`,
        color: 'green',
        icon: <IconCheck size={18} />,
      })
    },
    onError: (error) => {
      notifications.show({
        title: 'Login issue',
        message: formatNotificationError(error),
        color: 'red',
        icon: <IconX size={18} />,
      })
    },
  })
}

// Registration does not log in; the user signs in afterwards
export const useRegister = () => {
  return useMutation({
    mutationFn: (userData: UserRegistration) => authApi.register(userData),
    onSuccess: () => {
      notifications.show({
        title: 'Welcome to the Kitchen!',
        message: 'Your account has been created. Grab your apron and log in!',
        color: 'green',
        icon: <IconCheck size={18} />,
      })
    },
    onError: (error) => {
      notifications.show({
        title: 'Account setup issue',
        message: formatNotificationError(error),
        color: 'red',
        icon: <IconX size={18} />,
      })
    },
  })
}

// Clears this browser's tokens; they expire on their own server-side
export const useLogout = () => {
  const queryClient = useQueryClient()

  return useCallback(() => {
    clearTokens()
    clearUserQueries(queryClient)
    notifications.show({
      title: 'See you next time!',
      message: 'You have been successfully logged out.',
      color: 'blue',
      icon: <IconCheck size={18} />,
    })
  }, [queryClient])
}

// Revokes every token issued to this account, on all devices
export const useLogoutAllSessions = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => authApi.logoutAll(),
    onSuccess: () => {
      clearTokens()
      clearUserQueries(queryClient)
      notifications.show({
        title: 'Signed out everywhere',
        message: 'All sessions on every device have been signed out.',
        color: 'blue',
        icon: <IconCheck size={18} />,
      })
    },
    onError: (error) => {
      notifications.show({
        title: 'Could not sign out everywhere',
        message: formatNotificationError(error),
        color: 'red',
      })
    },
  })
}

export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: ChangePasswordParams) =>
      authApi.changePassword(currentPassword, newPassword),
    // Every other session was revoked; continue this one with the fresh tokens
    onSuccess: (tokens) => setTokens(tokens.access_token, tokens.refresh_token)
  })
}
