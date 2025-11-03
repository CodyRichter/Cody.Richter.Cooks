import React from 'react'
import { SimpleGrid, Stack } from '@mantine/core'
import { RecipeCardSkeleton } from './RecipeCardSkeleton'

interface RecipeListSkeletonProps {
  count?: number
  columns?: { base: number; sm?: number; md?: number; lg?: number }
}

export const RecipeListSkeleton: React.FC<RecipeListSkeletonProps> = ({
  count = 6,
  columns = { base: 1, sm: 2, md: 3 }
}) => {
  return (
    <SimpleGrid cols={columns}>
      {Array.from({ length: count }).map((_, i) => (
        <RecipeCardSkeleton key={i} />
      ))}
    </SimpleGrid>
  )
}

export default RecipeListSkeleton