import React from 'react'
import { Card, Skeleton, Group, Stack } from '@mantine/core'

interface RecipeCardSkeletonProps {
  showImage?: boolean
  showTags?: boolean
  showMetadata?: boolean
}

export const RecipeCardSkeleton: React.FC<RecipeCardSkeletonProps> = ({
  showImage = true,
  showTags = true,
  showMetadata = true
}) => {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      {showImage && (
        <Card.Section>
          <Skeleton height={200} radius="md" />
        </Card.Section>
      )}

      <Stack gap="xs" mt={showImage ? "md" : 0}>
        {/* Recipe title */}
        <Skeleton height={24} width="80%" />
        
        {/* Recipe description */}
        <Skeleton height={16} width="100%" />
        <Skeleton height={16} width="70%" />
        
        {showTags && (
          <Group gap="xs" mt="xs">
            <Skeleton height={20} width={60} radius="xl" />
            <Skeleton height={20} width={80} radius="xl" />
            <Skeleton height={20} width={50} radius="xl" />
          </Group>
        )}
        
        {showMetadata && (
          <Group gap="md" mt="sm">
            <Skeleton height={16} width={80} />
            <Skeleton height={16} width={100} />
          </Group>
        )}
      </Stack>
    </Card>
  )
}

export default RecipeCardSkeleton