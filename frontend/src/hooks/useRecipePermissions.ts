import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { recipePermissionApi } from '@/services/apiServices'
import { useAuth } from '@/contexts/AuthContext'
import {
  RecipePermissionWithUser,
  UserRecipePermissions,
} from '@/types/Permission'

// Hook to fetch recipe permissions
export const useRecipePermissions = (recipeId: string) => {
  const auth = useAuth()

  return useQuery<RecipePermissionWithUser[]>({
    queryKey: ['recipe-permissions', recipeId],
    queryFn: () => recipePermissionApi.getRecipePermissions(recipeId),
    enabled: !!recipeId && auth.isAuthenticated,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000
  })
}

// Hook to check current user's permissions for a recipe
export const useUserRecipePermissions = (recipeId: string): UserRecipePermissions => {
  const auth = useAuth()
  const { data: permissions, isLoading, error } = useRecipePermissions(recipeId)

  return useMemo(() => {
    // If user is not authenticated, they have no permissions
    if (!auth.isAuthenticated || !auth.user) {
      return {
        canEdit: false,
        canDelete: false,
        userRole: null,
        isOwner: false
      }
    }

    // If we're still loading or there's an error, assume no permissions for safety
    if (isLoading || error) {
      return {
        canEdit: false,
        canDelete: false,
        userRole: null,
        isOwner: false
      }
    }

    // Find current user's permission
    const userPermission = Array.isArray(permissions) ? permissions.find(
      (perm) => perm.user_username === auth.user?.username
    ) : undefined

    if (!userPermission) {
      return {
        canEdit: false,
        canDelete: false,
        userRole: null,
        isOwner: false
      }
    }

    const isOwner = userPermission.role === 'owner'
    const isEditor = userPermission.role === 'editor'

    return {
      canEdit: isOwner || isEditor,
      canDelete: isOwner, // Only owners can delete
      userRole: userPermission.role,
      isOwner: isOwner
    }
  }, [auth.isAuthenticated, auth.user, permissions, isLoading, error])
}
