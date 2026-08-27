import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RecipeCreate, RecipeUpdate, RecipePatch, RecipeSearchParams } from '@/types/Recipe'
import { InstructionCreate, InstructionPatch } from '@/types/InstructionStep'
import { IngredientCreate, IngredientPatch } from '@/types/Ingredient'
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
    gcTime: 10 * 60 * 1000 // 10 minutes
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

// Hook to update a full recipe
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

// Hook to partially update recipe metadata
export const usePatchRecipe = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: RecipePatch }) =>
      recipeApi.patchRecipe(id, patch),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipe', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['my-recipes'] })
    }
  })
}

// Granular Instruction Hooks
export const useAddInstruction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ recipeId, data }: { recipeId: string; data: InstructionCreate }) =>
      recipeApi.addInstruction(recipeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipe', variables.recipeId] })
    }
  })
}

export const usePatchInstruction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      recipeId,
      stepOrId,
      data
    }: {
      recipeId: string
      stepOrId: string | number
      data: InstructionPatch
    }) => recipeApi.patchInstruction(recipeId, stepOrId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipe', variables.recipeId] })
    }
  })
}

export const useDeleteInstruction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ recipeId, stepOrId }: { recipeId: string; stepOrId: string | number }) =>
      recipeApi.deleteInstruction(recipeId, stepOrId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipe', variables.recipeId] })
    }
  })
}

// Granular Ingredient Hooks
export const useAddIngredient = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ recipeId, data }: { recipeId: string; data: IngredientCreate }) =>
      recipeApi.addIngredient(recipeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipe', variables.recipeId] })
    }
  })
}

export const usePatchIngredient = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      recipeId,
      ingredientId,
      data
    }: {
      recipeId: string
      ingredientId: string | number
      data: IngredientPatch
    }) => recipeApi.patchIngredient(recipeId, ingredientId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipe', variables.recipeId] })
    }
  })
}

export const useDeleteIngredient = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ recipeId, ingredientId }: { recipeId: string; ingredientId: string | number }) =>
      recipeApi.deleteIngredient(recipeId, ingredientId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recipe', variables.recipeId] })
    }
  })
}

// Hook to delete a recipe
export const useDeleteRecipe = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => recipeApi.deleteRecipe(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['my-recipes'] })
      queryClient.invalidateQueries({ queryKey: ['search'] })
      queryClient.removeQueries({ queryKey: ['recipe', id] })
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
