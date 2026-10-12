import { SimpleGrid } from '@mantine/core'
import RecipePreviewCardLoadingSkeleton from '@/components/recipes/preview/RecipePreviewCardLoadingSkeleton'
import { HOME_RECIPES_PER_PAGE } from '@/config/pagination'

// Mirrors the home recipe grid so real cards replace it without shifting
export function RecipeListSkeleton() {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg" verticalSpacing="lg">
      {Array.from({ length: HOME_RECIPES_PER_PAGE }).map((_, i) => (
        <RecipePreviewCardLoadingSkeleton key={i} />
      ))}
    </SimpleGrid>
  )
}
