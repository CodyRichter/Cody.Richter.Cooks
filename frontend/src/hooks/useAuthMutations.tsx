import { useCallback } from 'react'
import { QueryClient, useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { IconCheck, IconX } from '@tabler/icons-react'
import { authApi } from '@/services/apiServices'
import { authQueryKeys } from '@/contexts/AuthContext'
import { clearTokens, setCachedUser, setSession, setTokens } from '@/utils/auth'
import { ApiError } from '@/utils/apiClient'
import { formatNotificationError } from '@/utils/notificationUtils'
import { LoginRequest, User, UserRegistration, UserUpdate } from '@/types/User'

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

// Keeps the cached user (which AuthContext and the header read) in step with the server
const useRefreshUser = () => {
  const queryClient = useQueryClient()

  return useCallback(
    (user: User) => {
      queryClient.setQueryData(authQueryKeys.me, user)
      setCachedUser(user)
    },
    [queryClient]
  )
}

const avatarUploadErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError && error.status === 413) {
    return 'That image is too large. Profile pictures must be 2 MB or smaller.'
  }
  if (error instanceof ApiError && error.status === 415) {
    return 'That file type is not supported. Use a PNG, JPEG, WebP or GIF image.'
  }
  return formatNotificationError(error)
}

export const useUploadAvatar = () => {
  const refreshUser = useRefreshUser()

  return useMutation({
    mutationFn: (file: File) => authApi.uploadAvatar(file),
    onSuccess: (user) => {
      refreshUser(user)
      notifications.show({
        title: 'Profile picture updated',
        message: 'Your new picture is live.',
        color: 'green',
        icon: <IconCheck size={18} />,
      })
    },
    onError: (error) => {
      notifications.show({
        title: 'Could not upload picture',
        message: avatarUploadErrorMessage(error),
        color: 'red',
        icon: <IconX size={18} />,
      })
    },
  })
}

export const useRemoveAvatar = () => {
  const refreshUser = useRefreshUser()

  return useMutation({
    mutationFn: async () => {
      await authApi.deleteAvatar()
      return authApi.getProfile()
    },
    onSuccess: (user) => {
      refreshUser(user)
      notifications.show({
        title: 'Profile picture removed',
        message: 'Your picture has been removed.',
        color: 'blue',
        icon: <IconCheck size={18} />,
      })
    },
    onError: (error) => {
      notifications.show({
        title: 'Could not remove picture',
        message: formatNotificationError(error),
        color: 'red',
        icon: <IconX size={18} />,
      })
    },
  })
}

// Callers show field-level errors, so failures are not notified here
export const useUpdateProfile = () => {
  const refreshUser = useRefreshUser()

  return useMutation({
    mutationFn: (data: UserUpdate) => authApi.updateProfile(data),
    onSuccess: refreshUser,
  })
}

export const useChangePassword = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: ChangePasswordParams) =>
      authApi.changePassword(currentPassword, newPassword),
    // Every other session and AI token was revoked; continue this one with the fresh tokens
    onSuccess: (tokens) => {
      setTokens(tokens.access_token, tokens.refresh_token)
      queryClient.invalidateQueries({ queryKey: ['api-tokens'] })
    },
  })
}
