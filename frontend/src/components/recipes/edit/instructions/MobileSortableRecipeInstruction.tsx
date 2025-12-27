import {
  ActionIcon,
  Button,
  Group,
  Popover,
  Stack,
  Text,
  TextInput,
  Textarea,
  Paper,
} from "@mantine/core";
import {
  IconExclamationMark,
  IconGripVertical,
  IconTrash,
  IconNotes,
} from "@tabler/icons-react";
import React from "react";

import { CSS } from "@dnd-kit/utilities";
import { RecipeDetail } from "@/types/Recipe";
import { useSortable } from "@dnd-kit/sortable";
import { UseFormReturnType } from "@mantine/form";
import { memo } from "react";

const MobileSortableRecipeInstruction = memo(({
  form,
  index,
}: {
  form: UseFormReturnType<RecipeDetail>;
  index: number;
}) => {
  const { id } = form.getValues().instructions[index];

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: id,
    });

  return (
    <Paper
      ref={setNodeRef}
      p="sm"
      radius="md"
      withBorder
      mb="sm"
      shadow={isDragging ? "md" : "xs"}
      style={{
        transform: CSS.Transform.toString(
          transform ? { ...transform, x: 0 } : null
        ),
        transition: transition,
        backgroundColor: isDragging ? 'var(--mantine-color-orange-0)' : 'var(--mantine-color-gray-0)',
        zIndex: isDragging ? 100 : 1,
        opacity: isDragging ? 0.9 : 1,
        border: isDragging ? '1px solid var(--mantine-color-orange-4)' : undefined,
      }}
      className="sortableItem"
    >
      <Group align="flex-start" wrap="nowrap" gap="sm">
        <Stack gap="xs" align="center" style={{ width: '32px' }}>
          <ActionIcon
            variant="subtle"
            color="gray"
            className="sortableMoveIcon"
            {...attributes}
            {...listeners}
            size="md"
            style={{ touchAction: "none", cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            <IconGripVertical size={20} />
          </ActionIcon>
          <Text fw={700} size="lg" c="orange.6" style={{ userSelect: 'none' }}>
            {index + 1}
          </Text>
        </Stack>

        <Stack gap="xs" style={{ flex: 1 }}>
          <TextInput
            placeholder="Step Title"
            size="sm"
            radius="md"
            variant="unstyled"
            withAsterisk
            styles={{ input: { fontSize: '1.1rem', fontWeight: 700, padding: 0 } }}
            key={form.key(`instructions.${index}.title`)}
            {...form.getInputProps(`instructions.${index}.title`)}
          />

          <Textarea
            placeholder="Step description..."
            withAsterisk
            autosize
            size="sm"
            radius="md"
            variant="unstyled"
            minRows={2}
            leftSection={<IconNotes size="0.9rem" color="var(--mantine-color-gray-5)" />}
            leftSectionProps={{ style: { alignItems: 'flex-start', paddingTop: '4px' } }}
            styles={{ input: { paddingLeft: '28px' } }}
            key={form.key(`instructions.${index}.description`)}
            {...form.getInputProps(`instructions.${index}.description`)}
          />
        </Stack>

        <Popover position="bottom-end" withArrow trapFocus shadow="md">
          <Popover.Target>
            <ActionIcon variant="subtle" color="red" size="md">
              <IconTrash size={18} />
            </ActionIcon>
          </Popover.Target>
          <Popover.Dropdown p="xs">
            <Button
              color="red"
              size="xs"
              onClick={() => {
                form.removeListItem('instructions', index);
              }}
              leftSection={<IconExclamationMark size={14} />}
            >
              Delete
            </Button>
          </Popover.Dropdown>
        </Popover>
      </Group>
    </Paper>
  );
});

MobileSortableRecipeInstruction.displayName = 'MobileSortableRecipeInstruction';

export default MobileSortableRecipeInstruction;
