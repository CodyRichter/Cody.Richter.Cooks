import { Card, Container, Skeleton, Stack } from '@mantine/core';

// Mirrors the centered auth form cards (login, reset password)
export function FormCardSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <Container size="xs" mt="xl">
      <Card shadow="md" padding="xl" radius="md" withBorder>
        <Stack gap="md" align="center" mb="xl">
          <Skeleton h={30} w="60%" radius="sm" />
          <Skeleton h={14} w="75%" radius="sm" />
        </Stack>
        <Stack gap="md">
          {Array.from({ length: fields }).map((_, i) => (
            <Stack key={i} gap={6}>
              <Skeleton h={14} w={120} radius="sm" />
              <Skeleton h={36} radius="md" />
            </Stack>
          ))}
          <Skeleton h={36} radius="md" />
        </Stack>
      </Card>
    </Container>
  );
}
