import { Box, Card, Group, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";

interface SettingsSectionProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}

export function SettingsSection({ title, description, action, children }: SettingsSectionProps) {
  return (
    <Card component="section" shadow="sm" radius="md" withBorder padding="lg">
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
        <Box miw={0}>
          <Title order={2} size="h4">
            {title}
          </Title>
          {description && (
            <Text size="sm" c="dimmed" mt={4}>
              {description}
            </Text>
          )}
        </Box>
        {action}
      </Group>
      {children}
    </Card>
  );
}

interface SettingRowProps {
  label: ReactNode;
  value?: ReactNode;
  action?: ReactNode;
}

export function SettingRow({ label, value, action }: SettingRowProps) {
  return (
    <Group className="settings-row" justify="space-between" wrap="nowrap" gap="md">
      <Box miw={0}>
        <Text fw={500}>{label}</Text>
        {value && (
          <Text component="div" size="sm" c="dimmed" style={{ overflowWrap: "anywhere" }}>
            {value}
          </Text>
        )}
      </Box>
      {action && <Box className="settings-row-action">{action}</Box>}
    </Group>
  );
}
