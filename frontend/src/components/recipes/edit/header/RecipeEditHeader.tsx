'use client';

import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Kbd,
  Loader,
  Paper,
  Popover,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconArrowLeft,
  IconCheck,
  IconCloudCheck,
  IconCloudUpload,
  IconListCheck,
  IconPlus,
  IconShieldCheck,
  IconX,
} from '@tabler/icons-react';
import { RecipeValidationStatus } from '@/utils/recipeUtils';
import { useState } from 'react';
import { useMediaQuery } from '@mantine/hooks';

export type AutoSaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

interface RecipeEditHeaderProps {
  title: string;
  mode: 'create' | 'edit';
  isPending?: boolean;
  validationStatus: RecipeValidationStatus;
  autoSaveStatus?: AutoSaveStatus;
  lastSavedAt?: Date | null;
  onSave?: () => void;
  onBack: () => void;
  isAdminOverride?: boolean;
  authorName?: string | null;
}

export default function RecipeEditHeader({
  title,
  mode,
  isPending = false,
  validationStatus,
  autoSaveStatus = 'idle',
  lastSavedAt,
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

  // Format time for auto-save badge
  const formattedSavedTime = lastSavedAt
    ? lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

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
                {mode === 'create' ? 'Drafting new recipe' : 'Auto-saving enabled'}
              </Text>
            )}
          </Stack>
        </Group>

        {/* Right Side: Status Badges & Actions */}
        <Group gap={8} wrap="nowrap" style={{ flexShrink: 0 }}>
          {/* Auto-save Status Badge (Shown in edit mode) */}
          {mode === 'edit' && autoSaveStatus !== 'idle' && (
            <>
              {autoSaveStatus === 'saving' && (
                <Badge
                  size={isMobile ? 'sm' : 'md'}
                  radius="md"
                  variant="light"
                  color="blue"
                  leftSection={<Loader size={10} color="blue" />}
                  style={{ textTransform: 'none', fontWeight: 600 }}
                >
                  {isMobile ? 'Saving' : 'Saving...'}
                </Badge>
              )}
              {autoSaveStatus === 'saved' && (
                <Tooltip
                  label={
                    <Stack gap={2} align="center">
                      <Text size="xs">{formattedSavedTime ? `Saved at ${formattedSavedTime}` : 'All changes saved'}</Text>
                      <Text size="xs" c="dimmed">Press ⌘S or Ctrl+S to save anytime</Text>
                    </Stack>
                  }
                  withArrow
                >
                  <Badge
                    size={isMobile ? 'sm' : 'md'}
                    radius="md"
                    variant="light"
                    color="teal"
                    leftSection={<IconCloudCheck size={14} stroke={2.2} />}
                    style={{ textTransform: 'none', fontWeight: 600, cursor: 'default' }}
                  >
                    {isMobile ? 'Saved' : formattedSavedTime ? `Saved ${formattedSavedTime}` : 'Saved'}
                  </Badge>
                </Tooltip>
              )}
              {autoSaveStatus === 'unsaved' && (
                <Tooltip
                  label={
                    <Stack gap={2} align="center">
                      <Text size="xs">Unsaved changes</Text>
                      <Text size="xs" c="dimmed">Auto-saves momentarily or press ⌘S</Text>
                    </Stack>
                  }
                  withArrow
                >
                  <Badge
                    size={isMobile ? 'sm' : 'md'}
                    radius="md"
                    variant="light"
                    color="yellow"
                    leftSection={<IconCloudUpload size={14} stroke={2} />}
                    style={{ textTransform: 'none', fontWeight: 600, cursor: 'default' }}
                  >
                    {isMobile ? 'Unsaved' : 'Unsaved changes'}
                  </Badge>
                </Tooltip>
              )}
              {autoSaveStatus === 'error' && (
                <Tooltip label="Auto-save failed. Press ⌘S / Ctrl+S to retry." withArrow>
                  <Badge
                    size={isMobile ? 'sm' : 'md'}
                    radius="md"
                    variant="light"
                    color="red"
                    leftSection={<IconAlertCircle size={14} stroke={2} />}
                    style={{ textTransform: 'none', fontWeight: 600, cursor: 'default' }}
                  >
                    {isMobile ? 'Error' : 'Save failed'}
                  </Badge>
                </Tooltip>
              )}
            </>
          )}

          {/* Validation Checklist Popover Button */}
          <Popover
            opened={popoverOpened}
            onChange={setPopoverOpened}
            position="bottom-end"
            withArrow
            shadow="md"
            width={300}
          >
            <Popover.Target>
              <Badge
                size={isMobile ? 'sm' : 'md'}
                radius="md"
                variant="light"
                color={isValid ? 'teal' : completionCount > 0 ? 'orange' : 'gray'}
                leftSection={<IconListCheck size={14} stroke={2} />}
                style={{
                  cursor: 'pointer',
                  userSelect: 'none',
                  textTransform: 'none',
                  fontWeight: 600,
                }}
                onClick={() => setPopoverOpened((o) => !o)}
              >
                {isMobile
                  ? `Checklist (${completionCount}/${totalCount})`
                  : `Validation Checklist (${completionCount}/${totalCount})`}
              </Badge>
            </Popover.Target>
            <Popover.Dropdown p="sm">
              <Stack gap="xs">
                <Group justify="space-between" align="center">
                  <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                    Validation Checklist
                  </Text>
                  <Badge size="xs" color={isValid ? 'teal' : 'orange'} variant="subtle">
                    {completionCount}/{totalCount} Complete
                  </Badge>
                </Group>
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

                {issues.length > 0 ? (
                  <Text size="xs" c="orange.7" mt={4} fw={500}>
                    Missing: {issues[0]}
                  </Text>
                ) : (
                  <Text size="xs" c="teal" mt={4} fw={500}>
                    All validation requirements met.
                  </Text>
                )}

                {mode === 'edit' && (
                  <Group gap={4} mt={6} justify="center">
                    <Text size="xs" c="dimmed">Save shortcut:</Text>
                    <Kbd size="xs">⌘</Kbd>
                    <Text size="xs" c="dimmed">+</Text>
                    <Kbd size="xs">S</Kbd>
                  </Group>
                )}
              </Stack>
            </Popover.Dropdown>
          </Popover>

          {/* Primary Create Button (Only shown in Create mode) */}
          {mode === 'create' && (
            <Button
              size={isMobile ? 'xs' : 'sm'}
              radius="md"
              color="orange"
              variant="filled"
              leftSection={<IconPlus size={15} />}
              loading={isPending}
              disabled={!isValid || isPending}
              onClick={onSave}
              style={{
                boxShadow: isValid ? '0 3px 10px rgba(255, 145, 0, 0.25)' : undefined,
                fontWeight: 600,
              }}
            >
              {isMobile ? 'Create' : 'Create Recipe'}
            </Button>
          )}
        </Group>
      </Group>
    </Paper>
  );
}
