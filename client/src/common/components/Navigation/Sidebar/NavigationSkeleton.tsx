import { Divider, Group, Skeleton, Stack } from "@mantine/core";

import React from "react";

export default function NavigationSkeleton() {
  return (
    <Stack justify="space-between" h="100%">
      <Stack gap="md" p="xs" mah="85%">
        {[...Array(15)].map((_, idx) => (
          <Skeleton
            h={22}
            w="90%"
            radius="sm"
            key={`sidebar-skeleton-${idx}`}
            ml="sm"
          />
        ))}
      </Stack>
      <div>
        <Divider mb="md" color="#eee" />
        <Group justify="space-between" mb="xl" mt="xs" ml="sm" mr="sm">
          <Skeleton h={32} w="45%" radius="md" />
          <Skeleton h={32} w="45%" radius="md" />
        </Group>
      </div>
    </Stack>
  );
}
