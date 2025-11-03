import { apiClient } from './apiClient';

export interface ApiServiceConfig {
  baseEndpoint: string;
  isPublicByDefault?: boolean;
}

export interface CrudOperations<T, CreateT = Partial<T>, UpdateT = Partial<T>> {
  getAll: (params?: Record<string, string | number | boolean>) => Promise<T[]>;
  getById: (id: string, isPublic?: boolean) => Promise<T>;
  create: (data: CreateT) => Promise<T>;
  update: (id: string, data: UpdateT) => Promise<T>;
  delete: (id: string) => Promise<void>;
}

/**
 * Creates a generic API service with CRUD operations
 * This makes it easy to add new APIs without duplicating code
 */
export function createApiService<T, CreateT = Partial<T>, UpdateT = Partial<T>>(
  config: ApiServiceConfig
): CrudOperations<T, CreateT, UpdateT> {
  const { baseEndpoint, isPublicByDefault = false } = config;

  return {
    getAll: (params?: Record<string, string | number | boolean>): Promise<T[]> => {
      const searchParams = new URLSearchParams();
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, value.toString());
          }
        });
      }
      
      const queryString = searchParams.toString();
      const endpoint = queryString ? `${baseEndpoint}?${queryString}` : baseEndpoint;
      
      return apiClient.get(endpoint, isPublicByDefault);
    },

    getById: (id: string, isPublic = isPublicByDefault): Promise<T> =>
      apiClient.get(`${baseEndpoint}/${id}`, isPublic),

    create: (data: CreateT): Promise<T> =>
      apiClient.post(baseEndpoint, data),

    update: (id: string, data: UpdateT): Promise<T> =>
      apiClient.put(`${baseEndpoint}/${id}`, data),

    delete: (id: string): Promise<void> =>
      apiClient.delete(`${baseEndpoint}/${id}`)
  };
}

/**
 * Example usage for future APIs:
 * 
 * // For a new "ingredients" API
 * const ingredientService = createApiService<Ingredient>({
 *   baseEndpoint: '/api/v1/ingredients',
 *   isPublicByDefault: true
 * });
 * 
 * // For a private "user-preferences" API  
 * const preferencesService = createApiService<UserPreference>({
 *   baseEndpoint: '/api/v1/user-preferences',
 *   isPublicByDefault: false
 * });
 * 
 * // Then use with React Query:
 * const ingredientsQuery = useApiQuery({
 *   queryKey: ['ingredients'],
 *   queryFn: () => ingredientService.getAll()
 * });
 */