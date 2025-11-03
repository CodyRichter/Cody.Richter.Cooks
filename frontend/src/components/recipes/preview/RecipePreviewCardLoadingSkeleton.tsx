import { Card, Skeleton, Stack, Group } from "@mantine/core";

export default function RecipePreviewCardLoadingSkeleton() {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder style={{ minHeight: "200px" }}>
      <Card.Section>
        <Skeleton height={80} />
      </Card.Section>

      <Stack gap="sm" mt="md" style={{ flex: 1 }}>
        <Skeleton height={24} width="80%" />

        <Group gap="xs" mt="auto">
          <Skeleton height={24} width={60} radius="xl" />
          <Skeleton height={24} width={80} radius="xl" />
        </Group>
      </Stack>
    </Card>
  );
}
