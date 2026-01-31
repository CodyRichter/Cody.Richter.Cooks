'use client';

import { Container, Stack, Title, Divider } from '@mantine/core';
import { RecipeListSkeleton } from '@/components/loading';

export default function Loading() {
  return (
    <Container size="xl" px="md">
      <Stack gap="lg">
        <Title ta="center" fw={700} order={1} style={{ opacity: 0.5 }}>
          Cody Richter Cooks
        </Title>
        <Divider />
        <RecipeListSkeleton count={6} />
      </Stack>
    </Container>
  );
}
