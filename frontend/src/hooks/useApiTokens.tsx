import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { IconAlertTriangle, IconCheck } from '@tabler/icons-react'
import { apiTokenApi } from '@/services/apiServices'
import { useAuth } from '@/contexts/AuthContext'
import { ApiToken, ApiTokenCreate } from '@/types/ApiToken'
import { formatNotificationError } from '@/utils/notificationUtils'

const apiTokensKey = (userId?: string) => ['api-tokens', userId]

export const useApiTokens = () => {
  const { user } = useAuth()

  return useQuery<ApiToken[]>({
    queryKey: apiTokensKey(user?.id),
    queryFn: apiTokenApi.list,
    enabled: !!user,
  })
}

export const useCreateApiToken = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (data: ApiTokenCreate) => apiTokenApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiTokensKey(user?.id) })
    },
    onError: (error) => {
      notifications.show({
        title: 'Failed to Create Token',
        message: formatNotificationError(error),
        color: 'red',
        icon: <IconAlertTriangle size={20} />,
      })
    },
  })
}

export const useRevokeApiToken = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (id: string) => apiTokenApi.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiTokensKey(user?.id) })
      notifications.show({
        title: 'Token Revoked',
        message: 'AI tools using this token can no longer access your recipes.',
        color: 'green',
        icon: <IconCheck size={20} />,
      })
    },
    onError: (error) => {
      notifications.show({
        title: 'Failed to Revoke Token',
        message: formatNotificationError(error),
        color: 'red',
        icon: <IconAlertTriangle size={20} />,
      })
    },
  })
}
