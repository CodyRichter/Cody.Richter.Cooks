import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { recipeApi } from '@/services/apiServices'
import { RecipeDetail, RecipeListItem } from '@/types/Recipe'

export const useAppNavigation = () => {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Navigate to recipe with data prefetching for performance
  const navigateToRecipe = useCallback((
    recipeId: string,
    recipe?: RecipeListItem | RecipeDetail
  ) => {
    const recipePath = `/recipes/view/${recipeId}`

    // Cache complete recipe data if available
    const isCompleteRecipe = recipe && 'ingredients' in recipe && 'instructions' in recipe
    if (isCompleteRecipe) {
      queryClient.setQueryData(['recipe', recipeId], recipe)
    }

    // Prefetch recipe data for better UX
    queryClient.prefetchQuery({
      queryKey: ['recipe', recipeId],
      queryFn: () => recipeApi.getRecipe(recipeId),
      staleTime: 2 * 60 * 1000
    })

    router.push(recipePath)
  }, [router, queryClient])

  // Navigate to recipe edit with prefetching
  const navigateToRecipeEdit = useCallback((
    recipeId: string,
    recipe?: RecipeDetail
  ) => {
    const editPath = `/recipes/edit/${recipeId}`

    // Prefetch recipe data if not already available
    if (!recipe) {
      queryClient.prefetchQuery({
        queryKey: ['recipe', recipeId],
        queryFn: () => recipeApi.getRecipe(recipeId),
        staleTime: 2 * 60 * 1000
      })
    }

    router.push(editPath)
  }, [router, queryClient])

  return {
    navigateToRecipe,
    navigateToRecipeEdit,
  }
}

export default useAppNavigation
