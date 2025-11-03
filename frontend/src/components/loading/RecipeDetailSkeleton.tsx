import React from 'react'
import { Container, Skeleton, Group, Stack, Divider, Grid } from '@mantine/core'

export const RecipeDetailSkeleton: React.FC = () => {
  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        {/* Header section */}
        <Stack gap="md">
          <Skeleton height={40} width="60%" />
          <Group gap="xs">
            <Skeleton height={24} width={60} radius="xl" />
            <Skeleton height={24} width={80} radius="xl" />
            <Skeleton height={24} width={50} radius="xl" />
          </Group>
          <Group gap="md">
            <Skeleton height={20} width={120} />
            <Skeleton height={20} width={100} />
          </Group>
        </Stack>

        <Divider />

        {/* Description section */}
        <Stack gap="sm">
          <Skeleton height={24} width={150} />
          <Skeleton height={18} width="100%" />
          <Skeleton height={18} width="90%" />
          <Skeleton height={18} width="70%" />
        </Stack>

        <Grid>
          {/* Ingredients section */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="md">
              <Skeleton height={28} width={120} />
              <Stack gap="sm">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Group key={i} gap="sm">
                    <Skeleton height={16} width={40} />
                    <Skeleton height={16} width="100%" />
                  </Group>
                ))}
              </Stack>
            </Stack>
          </Grid.Col>

          {/* Instructions section */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="md">
              <Skeleton height={28} width={140} />
              <Stack gap="lg">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Stack key={i} gap="xs">
                    <Skeleton height={20} width={100} />
                    <Skeleton height={16} width="100%" />
                    <Skeleton height={16} width="80%" />
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  )
}

export default RecipeDetailSkeleton