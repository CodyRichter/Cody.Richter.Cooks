import React from 'react'
import { RecipeCardSkeleton } from './RecipeCardSkeleton'
import { RecipeDetailSkeleton } from './RecipeDetailSkeleton'
import { RecipeListSkeleton } from './RecipeListSkeleton'
import { ProgressiveLoader } from './ProgressiveLoader'
import { Center, Loader, Text, Stack } from '@mantine/core'

interface SmartLoaderProps {
  isLoading?: boolean
  message?: string
  progress?: number
  type?: 'card' | 'detail' | 'list' | 'progressive' | 'simple'
  count?: number
  children?: React.ReactNode
  fallback?: React.ReactNode
}

export const SmartLoader: React.FC<SmartLoaderProps> = ({
  isLoading = false,
  message,
  progress,
  type = 'simple',
  count = 6,
  children,
  fallback
}) => {

  if (!isLoading) {
    return <>{children}</>
  }

  // Custom fallback
  if (fallback) {
    return <>{fallback}</>
  }

  // Progressive loader for mutations and operations with progress
  if (type === 'progressive' || progress !== undefined) {
    return (
      <ProgressiveLoader
        isLoading={isLoading}
        progress={progress}
        message={message}
        showProgress={progress !== undefined}
      >
        {children}
      </ProgressiveLoader>
    )
  }

  // Skeleton loaders for different content types
  switch (type) {
    case 'card':
      return <RecipeCardSkeleton />

    case 'detail':
      return <RecipeDetailSkeleton />

    case 'list':
      return <RecipeListSkeleton count={count} />

    case 'simple':
    default:
      return (
        <Center py="xl">
          <Stack align="center" gap="sm">
            <Loader size="md" />
            {message && (
              <Text c="dimmed" size="sm">
                {message}
              </Text>
            )}
          </Stack>
        </Center>
      )
  }
}

export default SmartLoader
