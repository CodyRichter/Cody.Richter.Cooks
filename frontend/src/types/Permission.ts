/**
 * Permission-related type definitions matching backend schemas
 */

// Permission role enum matching backend PermissionRole
export type PermissionRole = 'owner' | 'editor'

// Base permission schema matching backend RecipePermissionBase
export interface RecipePermissionBase {
  role: PermissionRole
}

// Permission creation schema matching backend RecipePermissionCreate
export interface RecipePermissionCreate extends RecipePermissionBase {
  user_id: string
  recipe_id: string
}

// Permission update schema matching backend RecipePermissionUpdate
export interface RecipePermissionUpdate {
  role?: PermissionRole
}

// Permission response schema matching backend RecipePermissionResponse
export interface RecipePermissionResponse extends RecipePermissionBase {
  id: string
  user_id: string
  recipe_id: string
  granted_at: string
  granted_by?: string
}

// Permission with user details matching backend RecipePermissionWithUser
export interface RecipePermissionWithUser extends RecipePermissionResponse {
  user_username: string
  user_email: string
}

// Permission with recipe details matching backend RecipePermissionWithRecipe
export interface RecipePermissionWithRecipe extends RecipePermissionResponse {
  recipe_title: string
}

// Grant permission request matching backend GrantPermissionRequest
export interface GrantPermissionRequest {
  username: string
  role?: PermissionRole // defaults to 'editor' in backend
}

// Revoke permission request matching backend RevokePermissionRequest
export interface RevokePermissionRequest {
  user_id: string
}

// User permissions helper interface
export interface UserRecipePermissions {
  canEdit: boolean
  canDelete: boolean
  userRole: PermissionRole | null
  isOwner: boolean
  isAdminOverride: boolean
}
