import { useContext } from 'react'
import AuthContext from '@/contexts/AuthContext'

// Re-export the main useAuth hook from context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook for checking specific permissions
export const usePermissions = () => {
  const { user, isAuthenticated } = useAuth()

  return {
    canCreateRecipe: isAuthenticated,
    canEditRecipe: (recipeUserId?: string) => {
      return isAuthenticated && user && (user.id === recipeUserId)
    },
    canDeleteRecipe: (recipeUserId?: string) => {
      return isAuthenticated && user && (user.id === recipeUserId)
    },
    canViewRecipe: () => true // All recipes are public for viewing
  }
}

export default useAuth
