import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { recipePermissionApi } from '@/services/apiServices'
import { useAuth } from '@/contexts/AuthContext'
import {
  RecipePermissionWithUser,
  UserRecipePermissions,
} from '@/types/Permission'

// Keyed by user so one account never sees another's cached permissions
export const useRecipePermissions = (recipeId: string) => {
  const { user } = useAuth()

  return useQuery<RecipePermissionWithUser[]>({
    queryKey: ['recipe-permissions', recipeId, user?.id],
    queryFn: () => recipePermissionApi.getRecipePermissions(recipeId),
    enabled: !!recipeId && !!user,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000
  })
}

// Hook to check current user's permissions for a recipe. `ownerUsername` (known from the
// server render) answers for owners and admins while the permissions request is pending or failed.
export const useUserRecipePermissions = (
  recipeId: string,
  ownerUsername?: string | null
): UserRecipePermissions => {
  const { status, user } = useAuth()
  const { data: permissions, isLoading, error } = useRecipePermissions(recipeId)

  return useMemo(() => {
    if (!user) {
      return {
        canEdit: false,
        canDelete: false,
        userRole: null,
        isOwner: false,
        isAdminOverride: false,
        isLoading: status === 'loading',
      }
    }

    const isAdmin = Boolean(user.is_admin)

    if ((isLoading || error) && ownerUsername) {
      const isOwner = ownerUsername === user.username
      if (isOwner || isAdmin) {
        return {
          canEdit: true,
          canDelete: true,
          userRole: isOwner ? 'owner' : null,
          isOwner,
          isAdminOverride: !isOwner,
          isLoading: false,
        }
      }
    }

    // While loading, do not assume admin override as the user might be the owner/editor
    if (isLoading) {
      return {
        canEdit: isAdmin,
        canDelete: isAdmin,
        userRole: null,
        isOwner: false,
        isAdminOverride: false,
        isLoading: true,
      }
    }

    // On error, allow admin fallback
    if (error) {
      return {
        canEdit: isAdmin,
        canDelete: isAdmin,
        userRole: null,
        isOwner: false,
        isAdminOverride: isAdmin,
        isLoading: false,
      }
    }

    // Find current user's permission in the permissions list
    const userPermission = Array.isArray(permissions) ? permissions.find(
      (perm) => perm.user_username === user.username
    ) : undefined

    if (!userPermission) {
      return {
        canEdit: isAdmin,
        canDelete: isAdmin,
        userRole: null,
        isOwner: false,
        isAdminOverride: isAdmin,
        isLoading: false,
      }
    }

    const isOwner = userPermission.role === 'owner'
    const isEditor = userPermission.role === 'editor'

    return {
      canEdit: isOwner || isEditor || isAdmin,
      canDelete: isOwner || isAdmin,
      userRole: userPermission.role,
      isOwner: isOwner,
      isAdminOverride: isAdmin && !isOwner,
      isLoading: false,
    }
  }, [status, user, permissions, isLoading, error, ownerUsername])
}
