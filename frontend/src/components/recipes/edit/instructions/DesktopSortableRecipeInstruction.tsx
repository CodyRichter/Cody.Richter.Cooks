'use client';

import {
  ActionIcon,
  Badge,
  Group,
  Paper,
  Stack,
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

interface DesktopSortableRecipeInstructionProps {
  form: UseFormReturnType<RecipeDetail>;
  index: number;
  instructionId: string;
}

/**
 * Desktop layout for a structured, accessible sortable instruction card.
 */
export default function DesktopSortableRecipeInstruction({
  form,
  index,
  instructionId,
}: DesktopSortableRecipeInstructionProps) {
  const totalCount = form.getValues().instructions?.length || 0;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: instructionId,
      disabled: totalCount <= 1,
    });

  return (
    <Paper
      ref={setNodeRef}
      p="md"
      radius="md"
      withBorder
      mb="sm"
      shadow={isDragging ? "lg" : "xs"}
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
      <Group align="flex-start" wrap="nowrap" gap="md">
        {/* Step Indicator & Drag Handle */}
        <Stack gap={6} align="center" style={{ width: '44px', flexShrink: 0 }}>
          <Tooltip
            label={totalCount > 1 ? "Drag to reorder step" : "Add more steps to reorder"}
            position="left"
            withArrow
          >
            <ActionIcon
              variant="subtle"
              color={isDragging ? "orange" : "gray"}
              className="sortableMoveIcon"
              {...attributes}
              {...listeners}
              size="md"
              radius="sm"
              style={{
                cursor: totalCount <= 1 ? 'default' : isDragging ? 'grabbing' : 'grab',
                opacity: totalCount <= 1 ? 0.35 : 0.8,
              }}
              aria-label="Drag step to reorder"
            >
              <IconGripVertical size={18} />
            </ActionIcon>
          </Tooltip>
          <Badge
            variant="filled"
            color="orange"
            size="lg"
            radius="xl"
            style={{
              width: '28px',
              height: '28px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.85rem',
            }}
          >
            {index + 1}
          </Badge>
        </Stack>

        {/* Inputs */}
        <Stack gap="xs" style={{ flex: 1 }}>
          <TextInput
            placeholder="Step title (e.g. Sear the Salmon)"
            size="sm"
            radius="md"
            withAsterisk
            styles={{
              input: {
                fontWeight: 600,
                fontSize: '0.95rem',
              },
            }}
            key={form.key(`instructions.${index}.title`)}
            {...form.getInputProps(`instructions.${index}.title`)}
          />

          <Textarea
            placeholder="Describe what to do in this step..."
            withAsterisk
            autosize
            size="sm"
            radius="md"
            minRows={2}
            leftSection={<IconNotes size={15} color="var(--mantine-color-dimmed)" />}
            leftSectionProps={{ style: { alignItems: 'flex-start', paddingTop: '8px' } }}
            key={form.key(`instructions.${index}.description`)}
            {...form.getInputProps(`instructions.${index}.description`)}
          />
        </Stack>

        {/* Delete Step Action */}
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
            <IconTrash size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Paper>
  );
}
