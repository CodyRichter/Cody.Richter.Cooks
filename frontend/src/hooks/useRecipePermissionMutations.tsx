import { useMutation, useQueryClient } from '@tanstack/react-query'
import { recipePermissionApi } from '@/services/apiServices'
import { notifications } from '@mantine/notifications'
import { IconCheck, IconAlertTriangle } from '@tabler/icons-react'
import { formatNotificationError } from '@/utils/notificationUtils'

/**
 * Hook to grant recipe permission to a user.
 * Automatically invalidates the recipe permissions query on success.
 */
export const useGrantRecipePermission = (recipeId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (username: string) => {
      return recipePermissionApi.shareRecipe(recipeId, username, 'editor')
    },
    onSuccess: () => {
      // Invalidate and refetch permissions
      queryClient.invalidateQueries({ queryKey: ['recipe-permissions', recipeId] })

      notifications.show({
        title: 'Collaborator Added',
        message: 'Editor access granted successfully.',
        color: 'green',
        icon: <IconCheck size={20} />,
      })
    },
    onError: (error) => {
      notifications.show({
        title: 'Failed to Add Collaborator',
        message: formatNotificationError(error),
        color: 'red',
        icon: <IconAlertTriangle size={20} />,
      })
    },
  })
}

/**
 * Hook to revoke recipe permission from a user.
 * Automatically invalidates the recipe permissions query on success.
 */
export const useRevokeRecipePermission = (recipeId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      return recipePermissionApi.removeRecipePermission(recipeId, userId)
    },
    onSuccess: () => {
      // Invalidate and refetch permissions
      queryClient.invalidateQueries({ queryKey: ['recipe-permissions', recipeId] })

      notifications.show({
        title: 'Collaborator Removed',
        message: 'Editor access revoked successfully.',
        color: 'green',
        icon: <IconCheck size={20} />,
      })
    },
    onError: (error) => {
      notifications.show({
        title: 'Failed to Remove Collaborator',
        message: formatNotificationError(error),
        color: 'red',
        icon: <IconAlertTriangle size={20} />,
      })
    },
  })
}
