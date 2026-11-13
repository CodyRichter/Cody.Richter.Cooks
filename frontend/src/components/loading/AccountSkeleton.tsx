import { Box, Card, Container, Group, Skeleton, Stack } from '@mantine/core';

function RowSkeleton({ labelWidth, valueWidth, buttonWidth }: { labelWidth: number; valueWidth: number; buttonWidth: number }) {
  return (
    <Group className="settings-row" justify="space-between" wrap="nowrap">
      <Box>
        <Skeleton h={18} w={labelWidth} radius="sm" />
        <Skeleton h={14} w={valueWidth} radius="sm" mt={6} />
      </Box>
      <Skeleton h={36} w={buttonWidth} radius="md" />
    </Group>
  );
}

function SectionSkeleton({ titleWidth, children }: { titleWidth: number; children: React.ReactNode }) {
  return (
    <Card shadow="sm" radius="md" withBorder padding="lg">
      <Skeleton h={22} w={titleWidth} radius="sm" />
      {children}
    </Card>
  );
}

// Mirrors the account page's sections and rows
export function AccountSkeleton() {
  return (
    <Container size="md" px={0}>
      <Stack gap="lg">
        <Skeleton h={30} w={130} radius="sm" />
        <SectionSkeleton titleWidth={70}>
          <Group className="settings-row" gap="lg" wrap="nowrap">
            <Skeleton h={80} w={80} circle />
            <Box>
              <Skeleton h={22} w={160} radius="sm" />
              <Skeleton h={14} w={140} radius="sm" mt={8} />
            </Box>
          </Group>
          <RowSkeleton labelWidth={80} valueWidth={120} buttonWidth={96} />
          <RowSkeleton labelWidth={50} valueWidth={200} buttonWidth={96} />
        </SectionSkeleton>
        <SectionSkeleton titleWidth={80}>
          <RowSkeleton labelWidth={80} valueWidth={70} buttonWidth={96} />
          <Box className="settings-row">
            <Skeleton h={14} w={150} radius="sm" />
          </Box>
        </SectionSkeleton>
      </Stack>
    </Container>
  );
}
