import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RecipeCreate, RecipeUpdate, RecipeSearchParams } from '@/types/Recipe'
import { recipeApi } from '@/services/apiServices'

// Custom debounce hook
const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// Hook to fetch all recipes
export const useRecipes = (params?: RecipeSearchParams) => {
  return useQuery({
    queryKey: ['recipes', params],
    queryFn: () => recipeApi.getRecipes(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes (renamed from cacheTime)
  })
}

// Hook to fetch a single recipe
export const useRecipe = (id: string, options: { enabled?: boolean } = {}) => {
  return useQuery({
    queryKey: ['recipe', id],
    queryFn: () => recipeApi.getRecipe(id),
    enabled: !!id && (options.enabled ?? true),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  })
}

// Hook to fetch user's recipes
export const useMyRecipes = () => {
  return useQuery({
    queryKey: ['my-recipes'],
    queryFn: () => recipeApi.getMyRecipes(),
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000
  })
}

// Hook to create a recipe
export const useCreateRecipe = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (recipe: RecipeCreate) => recipeApi.createRecipe(recipe),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['my-recipes'] })
    }
  })
}

// Hook to update a recipe
export const useUpdateRecipe = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...recipe }: RecipeUpdate & { id: string }) =>
      recipeApi.updateRecipe(id, recipe),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipe', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['my-recipes'] })
    }
  })
}

// Hook to delete a recipe
export const useDeleteRecipe = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => recipeApi.deleteRecipe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['my-recipes'] })
    }
  })
}



// Hook for search with debouncing
export const useRecipeSearch = (query: string) => {
  const debouncedQuery = useDebounce(query, 300)

  const searchParams = useMemo(() => ({
    q: debouncedQuery
  }), [debouncedQuery])

  const shouldSearch = debouncedQuery.length >= 3

  const result = useQuery({
    queryKey: ['search', searchParams],
    queryFn: () => recipeApi.getRecipes(searchParams),
    enabled: shouldSearch,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000
  })

  return {
    ...result,
    data: result.data,
    isSearching: query !== debouncedQuery,
    canSearch: query.length >= 3
  }
}
