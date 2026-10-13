import { Card, Divider, Group, Skeleton, Stack } from '@mantine/core';

// Mirrors the account details card
export function AccountSkeleton() {
  return (
    <Card shadow="sm" radius="md" withBorder pb="lg">
      <Skeleton h={22} w={90} radius="sm" />
      <Skeleton h={14} w="70%" radius="sm" mt="md" />
      <Stack gap="md" mt="md">
        <Skeleton h={18} w={220} radius="sm" />
        <Skeleton h={18} w={300} radius="sm" />
      </Stack>
      <Divider my="md" />
      <Stack gap="md">
        <Group gap="xs">
          <Skeleton h={18} w={80} radius="sm" />
          <Skeleton h={26} w={130} radius="sm" />
        </Group>
        <Group gap="xs">
          <Skeleton h={18} w={80} radius="sm" />
          <Skeleton h={26} w={180} radius="sm" />
        </Group>
      </Stack>
    </Card>
  );
}
