import { Container, Divider, Grid, Group, Paper, Skeleton, Stack } from '@mantine/core';

function SectionSkeleton({ rows }: { rows: number }) {
  return (
    <Paper shadow="xs" p={{ base: 'sm', sm: 'md' }} radius="md" withBorder>
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Skeleton h={22} w={150} radius="sm" />
          <Skeleton h={30} w={70} radius="md" />
        </Group>
        <Divider />
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} h={36} radius="md" />
        ))}
        <Skeleton h={32} radius="md" />
      </Stack>
    </Paper>
  );
}

// Mirrors the create/edit page (RecipeEditHeader + EditRecipe) so the form replaces it without shifting
export function RecipeEditSkeleton() {
  return (
    <Container size="xl" px="md" pb="xl">
      <Stack gap="md">
        <Paper p={{ base: 'xs', sm: 'sm' }} px={{ base: 'xs', sm: 'md' }} radius="md" withBorder mb="md">
          <Group justify="space-between" align="center" wrap="nowrap">
            <Group gap="xs" wrap="nowrap">
              <Skeleton h={34} w={34} radius="md" />
              <Stack gap={6}>
                <Skeleton h={18} w={130} radius="sm" />
                <Skeleton h={12} w={110} radius="sm" visibleFrom="sm" />
              </Stack>
            </Group>
            <Skeleton h={26} w={{ base: 110, sm: 200 }} radius="md" />
          </Group>
        </Paper>

        <Stack gap="md">
          <Paper shadow="xs" p={{ base: 'sm', sm: 'lg' }} radius="md" withBorder>
            <Stack gap="sm">
              <Skeleton h={34} w="55%" radius="sm" />
              <Group gap="xs">
                <Skeleton h={30} w={110} radius="md" />
                <Skeleton h={30} w={115} radius="md" />
                <Skeleton h={30} w={160} radius="md" />
              </Group>
              <Divider />
              <Skeleton h={220} radius="md" />
            </Stack>
          </Paper>

          <Grid gap="md" align="flex-start">
            <Grid.Col span={{ base: 12, md: 5 }}>
              <SectionSkeleton rows={4} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 7 }}>
              <SectionSkeleton rows={3} />
            </Grid.Col>
          </Grid>
        </Stack>
      </Stack>
    </Container>
  );
}
