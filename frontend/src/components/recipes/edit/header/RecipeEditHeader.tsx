'use client';

import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Paper,
  Popover,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconCheck,
  IconDeviceFloppy,
  IconInfoCircle,
  IconPlus,
  IconShieldCheck,
  IconX,
} from '@tabler/icons-react';
import { RecipeValidationStatus } from '@/utils/recipeUtils';
import { useState } from 'react';
import { useMediaQuery } from '@mantine/hooks';

interface RecipeEditHeaderProps {
  title: string;
  mode: 'create' | 'edit';
  isPending: boolean;
  validationStatus: RecipeValidationStatus;
  onSave: () => void;
  onBack: () => void;
  isAdminOverride?: boolean;
  authorName?: string | null;
}

export default function RecipeEditHeader({
  title,
  mode,
  isPending,
  validationStatus,
  onSave,
  onBack,
  isAdminOverride,
  authorName,
}: RecipeEditHeaderProps) {
  const isMobile = useMediaQuery('(max-width: 768px)', false, {
    getInitialValueInEffect: true,
  });
  const [popoverOpened, setPopoverOpened] = useState(false);
  const { isValid, completionCount, totalCount, issues } = validationStatus;

  return (
    <Paper
      pos="sticky"
      top={{ base: 56, md: 70 }}
      p={{ base: 'xs', sm: 'sm' }}
      px={{ base: 'xs', sm: 'md' }}
      radius="md"
      withBorder
      style={{
        zIndex: 30,
        backdropFilter: 'blur(12px)',
        backgroundColor: 'light-dark(rgba(255, 255, 255, 0.95), rgba(26, 27, 30, 0.95))',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
      }}
      mb="md"
    >
      <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
        {/* Left Side: Navigation & Title */}
        <Group gap="xs" wrap="nowrap" style={{ minWidth: 0, flexShrink: 1 }}>
          <Tooltip label="Go back" position="bottom" withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              size={isMobile ? 'md' : 'lg'}
              radius="md"
              onClick={onBack}
              aria-label="Back"
            >
              <IconArrowLeft size={18} />
            </ActionIcon>
          </Tooltip>

          <Stack gap={0} style={{ minWidth: 0 }}>
            <Group gap={6} align="center" wrap="nowrap">
              <Text
                fw={700}
                size={isMobile ? 'sm' : 'lg'}
                style={{
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {title}
              </Text>
              {isAdminOverride && (
                <Tooltip
                  label={`Admin override active${authorName ? ` (Owned by ${authorName})` : ''}`}
                  withArrow
                >
                  <Badge
                    leftSection={<IconShieldCheck size="0.7rem" stroke={2} />}
                    color="red"
                    variant="filled"
                    size="xs"
                    radius="sm"
                    style={{ textTransform: 'none', fontWeight: 600, cursor: 'default' }}
                  >
                    Admin
                  </Badge>
                </Tooltip>
              )}
            </Group>
            {!isMobile && (
              <Text size="xs" c="dimmed">
                {mode === 'create' ? 'Drafting new recipe' : 'Making recipe revisions'}
              </Text>
            )}
          </Stack>
        </Group>

        {/* Center/Right Actions */}
        <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
          {/* Real-time Validation Status HUD */}
          <Popover
            opened={popoverOpened}
            onChange={setPopoverOpened}
            position="bottom-end"
            withArrow
            shadow="md"
            width={280}
          >
            <Popover.Target>
              <Badge
                size={isMobile ? 'md' : 'lg'}
                radius="md"
                variant="light"
                color={isValid ? 'teal' : completionCount > 0 ? 'orange' : 'gray'}
                leftSection={
                  isValid ? (
                    <IconCheck size={13} stroke={2.5} />
                  ) : (
                    <IconInfoCircle size={13} />
                  )
                }
                style={{
                  cursor: 'pointer',
                  userSelect: 'none',
                  textTransform: 'none',
                  fontWeight: 600,
                }}
                onClick={() => setPopoverOpened((o) => !o)}
              >
                {isMobile
                  ? isValid
                    ? 'Ready'
                    : `${completionCount}/${totalCount}`
                  : isValid
                  ? 'Ready to Save'
                  : `${completionCount}/${totalCount} Complete`}
              </Badge>
            </Popover.Target>
            <Popover.Dropdown p="sm">
              <Stack gap="xs">
                <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                  Recipe Completion Checklist
                </Text>
                <Group gap="xs">
                  <ThemeIcon
                    size="xs"
                    radius="xl"
                    color={validationStatus.titleValid ? 'teal' : 'gray'}
                    variant={validationStatus.titleValid ? 'filled' : 'light'}
                  >
                    {validationStatus.titleValid ? <IconCheck size={10} /> : <IconX size={10} />}
                  </ThemeIcon>
                  <Text size="xs" c={validationStatus.titleValid ? undefined : 'dimmed'}>
                    Recipe Title (min 3 chars)
                  </Text>
                </Group>
                <Group gap="xs">
                  <ThemeIcon
                    size="xs"
                    radius="xl"
                    color={validationStatus.descriptionValid ? 'teal' : 'gray'}
                    variant={validationStatus.descriptionValid ? 'filled' : 'light'}
                  >
                    {validationStatus.descriptionValid ? <IconCheck size={10} /> : <IconX size={10} />}
                  </ThemeIcon>
                  <Text size="xs" c={validationStatus.descriptionValid ? undefined : 'dimmed'}>
                    Short Description / Story
                  </Text>
                </Group>
                <Group gap="xs">
                  <ThemeIcon
                    size="xs"
                    radius="xl"
                    color={validationStatus.ingredientsValid ? 'teal' : 'gray'}
                    variant={validationStatus.ingredientsValid ? 'filled' : 'light'}
                  >
                    {validationStatus.ingredientsValid ? <IconCheck size={10} /> : <IconX size={10} />}
                  </ThemeIcon>
                  <Text size="xs" c={validationStatus.ingredientsValid ? undefined : 'dimmed'}>
                    At least 1 complete ingredient
                  </Text>
                </Group>
                <Group gap="xs">
                  <ThemeIcon
                    size="xs"
                    radius="xl"
                    color={validationStatus.instructionsValid ? 'teal' : 'gray'}
                    variant={validationStatus.instructionsValid ? 'filled' : 'light'}
                  >
                    {validationStatus.instructionsValid ? <IconCheck size={10} /> : <IconX size={10} />}
                  </ThemeIcon>
                  <Text size="xs" c={validationStatus.instructionsValid ? undefined : 'dimmed'}>
                    At least 1 complete instruction step
                  </Text>
                </Group>

                {issues.length > 0 && (
                  <Text size="xs" c="orange.7" mt={4} fw={500}>
                    Missing: {issues[0]}
                  </Text>
                )}
              </Stack>
            </Popover.Dropdown>
          </Popover>

          {/* Primary Save Button */}
          <Button
            size={isMobile ? 'xs' : 'sm'}
            radius="md"
            color="orange"
            variant="filled"
            leftSection={
              mode === 'create' ? <IconPlus size={15} /> : <IconDeviceFloppy size={15} />
            }
            loading={isPending}
            disabled={!isValid || isPending}
            onClick={onSave}
            style={{
              boxShadow: isValid ? '0 3px 10px rgba(255, 145, 0, 0.25)' : undefined,
              fontWeight: 600,
            }}
          >
            {isMobile ? (mode === 'create' ? 'Create' : 'Save') : mode === 'create' ? 'Create Recipe' : 'Save Changes'}
          </Button>
        </Group>
      </Group>
    </Paper>
  );
}
