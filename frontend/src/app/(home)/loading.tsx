'use client';

import { Container, Divider, Flex, Skeleton, Stack, Title } from '@mantine/core';
import { RecipeListSkeleton } from '@/components/loading';

// Mirrors RecipeHome's layout so the real page replaces it without shifting
export default function Loading() {
  return (
    <Container size="xl" px="md">
      <Stack gap="lg">
        <Title ta="center" fw={700} order={1} style={{ letterSpacing: '-0.7px' }}>
          Welcome to Cody Richter Cooks
        </Title>
        <Divider />
        <Flex align="center" mih={75}>
          <Skeleton h={36} w="100%" radius="md" />
        </Flex>
        <Divider />
        <Stack gap={8} align="center" mb="xl">
          <Skeleton h={18} w="95%" radius="sm" />
          <Skeleton h={18} w="90%" radius="sm" />
          <Skeleton h={18} w="60%" radius="sm" />
        </Stack>
        <RecipeListSkeleton />
      </Stack>
    </Container>
  );
}
