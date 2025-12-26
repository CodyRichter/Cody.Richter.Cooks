import { apiClient } from '@/utils/apiClient'
import { createApiService } from '@/utils/createApiService'
import { User, UserRegistration, TokenResponse, LoginRequest, UserUpdate, TokenRefreshResponse } from '@/types/User'
import { RecipeDetail, RecipeListItem, RecipeCreate, RecipeUpdate, RecipeSearchParams } from '@/types/Recipe'

// Auth API - specialized due to different patterns
export const authApi = {
  login: (credentials: LoginRequest): Promise<TokenResponse> =>
    apiClient.post('/api/v1/users/login', credentials, true),

  register: (userData: UserRegistration): Promise<TokenResponse> =>
    apiClient.post('/api/v1/users/register', userData, true),

  refreshToken: (refreshToken: string): Promise<TokenRefreshResponse> =>
    apiClient.post('/api/v1/users/refresh', { refresh_token: refreshToken }, true),

  getProfile: (): Promise<User> =>
    apiClient.get('/api/v1/users/profile'),

  updateProfile: (userData: UserUpdate): Promise<User> =>
    apiClient.put('/api/v1/users/profile', userData),

  changePassword: (currentPassword: string, newPassword: string): Promise<void> =>
    apiClient.post('/api/v1/users/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    }),

  logout: (): Promise<void> =>
    Promise.resolve() // Backend doesn't have logout endpoint
}

// Recipe API - uses generic service with custom methods
const baseRecipeService = createApiService<RecipeListItem, RecipeCreate, RecipeUpdate>({
  baseEndpoint: '/api/v1/recipes',
  isPublicByDefault: true
})

export const recipeApi = {
  // Public recipe methods
  getRecipes: (params?: RecipeSearchParams): Promise<{items: RecipeListItem[], has_next: boolean, has_prev: boolean, total: number, page: number, limit: number}> => {
    const cleanParams: Record<string, string | number> = {}
    if (params?.q) cleanParams.q = params.q
    if (params?.page) cleanParams.page = params.page
    if (params?.limit) cleanParams.limit = params.limit

    const searchParams = new URLSearchParams();
    Object.entries(cleanParams).forEach(([key, value]) => {
      searchParams.append(key, value.toString());
    });

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/v1/recipes?${queryString}` : '/api/v1/recipes';

    return apiClient.get(endpoint, true)
  },

  getRecipe: (id: string): Promise<RecipeDetail> =>
    baseRecipeService.getById(id, true) as Promise<RecipeDetail>,

  // Authenticated recipe methods
  getMyRecipes: (): Promise<RecipeListItem[]> =>
    apiClient.get('/api/v1/recipes/my-recipes'),

  createRecipe: (recipeData: RecipeCreate): Promise<RecipeDetail> =>
    baseRecipeService.create(recipeData) as Promise<RecipeDetail>,

  updateRecipe: (id: string, recipeData: RecipeUpdate): Promise<RecipeDetail> =>
    baseRecipeService.update(id, recipeData) as Promise<RecipeDetail>,

  deleteRecipe: (id: string): Promise<void> =>
    baseRecipeService.delete(id)
}

export const recipePermissionApi = {
  shareRecipe: (recipeId: string, username: string, role: 'owner' | 'editor'): Promise<void> =>
    apiClient.post(`/api/v1/recipes/${recipeId}/permissions`, { username, role }),

  getRecipePermissions: (recipeId: string): Promise<import('../types/Permission').RecipePermissionWithUser[]> =>
    apiClient.get(`/api/v1/recipes/${recipeId}/permissions`),

  removeRecipePermission: (recipeId: string, userId: string): Promise<void> =>
    apiClient.delete(`/api/v1/recipes/${recipeId}/permissions/${userId}`)
}
