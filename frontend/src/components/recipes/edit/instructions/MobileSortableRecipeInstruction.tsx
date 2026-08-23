'use client';

import {
  ActionIcon,
  Badge,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Textarea,
  Tooltip,
} from "@mantine/core";
import {
  IconGripVertical,
  IconNotes,
  IconTrash,
} from "@tabler/icons-react";

import { CSS } from "@dnd-kit/utilities";
import { RecipeDetail } from "@/types/Recipe";
import { useSortable } from "@dnd-kit/sortable";
import { UseFormReturnType } from "@mantine/form";

interface MobileSortableRecipeInstructionProps {
  form: UseFormReturnType<RecipeDetail>;
  index: number;
  instructionId: string;
}

/**
 * Mobile layout for a structured, accessible sortable instruction card with ergonomic touch targets.
 * Consistent layout: Drag handle on left, Step number/title in middle, Actions on right.
 */
export default function MobileSortableRecipeInstruction({
  form,
  index,
  instructionId,
}: MobileSortableRecipeInstructionProps) {
  const totalCount = form.getValues().instructions?.length || 0;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: instructionId,
      disabled: totalCount <= 1,
    });

  return (
    <Paper
      ref={setNodeRef}
      p="xs"
      radius="md"
      withBorder
      mb="xs"
      shadow={isDragging ? "lg" : "none"}
      style={{
        transform: CSS.Transform.toString(
          transform ? { ...transform, x: 0, scaleY: isDragging ? 1.02 : 1 } : null
        ),
        transition: transition,
        backgroundColor: isDragging
          ? 'light-dark(var(--mantine-color-orange-0), rgba(247, 103, 7, 0.15))'
          : 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-7))',
        zIndex: isDragging ? 100 : 1,
        opacity: isDragging ? 0.9 : 1,
        borderColor: isDragging ? 'var(--mantine-color-orange-5)' : undefined,
      }}
      className="sortableItem"
    >
      <Stack gap="xs">
        {/* Step Card Header: [ GripHandle ] [ (1) Step 1 ] ----------- [ Trash ] */}
        <Group justify="space-between" align="center" wrap="nowrap">
          <Group gap="xs" align="center">
            {/* Drag Handle on Left (consistent with Ingredients) */}
            <Tooltip
              label={totalCount > 1 ? "Drag to reorder step" : "Add more steps to reorder"}
              position="right"
              withArrow
            >
              <ActionIcon
                variant="subtle"
                color={isDragging ? "orange" : "gray"}
                className="sortableMoveIcon"
                {...attributes}
                {...listeners}
                size="md"
                style={{
                  touchAction: "none",
                  cursor: totalCount <= 1 ? 'default' : isDragging ? 'grabbing' : 'grab',
                  opacity: totalCount <= 1 ? 0.35 : 0.8,
                  minWidth: '32px',
                  minHeight: '32px',
                }}
                aria-label="Drag step to reorder"
              >
                <IconGripVertical size={18} />
              </ActionIcon>
            </Tooltip>

            <Badge
              variant="filled"
              color="orange"
              size="sm"
              radius="xl"
              style={{
                width: '22px',
                height: '22px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.75rem',
              }}
            >
              {index + 1}
            </Badge>
            <Text fw={700} size="sm">
              Step {index + 1}
            </Text>
          </Group>

          {/* Delete Action on Right */}
          <Tooltip label="Delete Step" position="top" withArrow>
            <ActionIcon
              variant="subtle"
              color="red"
              size="md"
              radius="md"
              onClick={() => {
                form.removeListItem('instructions', index);
              }}
              aria-label="Delete step"
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>

        {/* Step Title Input */}
        <TextInput
          placeholder="Step title (e.g. Sauté Aromatics)"
          size="xs"
          radius="md"
          withAsterisk
          styles={{ input: { fontWeight: 600, height: '32px' } }}
          key={form.key(`instructions.${index}.title`)}
          {...form.getInputProps(`instructions.${index}.title`)}
        />

        {/* Step Description */}
        <Textarea
          placeholder="Describe step instructions in detail..."
          withAsterisk
          autosize
          size="xs"
          radius="md"
          minRows={2}
          leftSection={<IconNotes size={13} color="var(--mantine-color-dimmed)" />}
          leftSectionProps={{ style: { alignItems: 'flex-start', paddingTop: '8px' } }}
          key={form.key(`instructions.${index}.description`)}
          {...form.getInputProps(`instructions.${index}.description`)}
        />
      </Stack>
    </Paper>
  );
}
