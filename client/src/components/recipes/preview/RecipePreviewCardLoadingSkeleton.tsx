import { Card, Skeleton } from "@mantine/core";

export default function RecipePreviewCardLoadingSkeleton() {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section>
        <Skeleton height={220} />
      </Card.Section>

      <Skeleton mt="md" mb="xs" width={250} height={25} />

      <Skeleton height={60} />
      <Skeleton height={60} />
    </Card>
  );
}
