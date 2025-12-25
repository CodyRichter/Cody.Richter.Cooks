import {
  ActionIcon,
  Button,
  Flex,
  Group,
  Popover,
  Stack,
  Text,
  TextInput,
  Textarea,
  Paper,
  Tooltip,
} from "@mantine/core";
import {
  IconExclamationMark,
  IconGripVertical,
  IconTrash,
  IconNotes,
} from "@tabler/icons-react";

import { CSS } from "@dnd-kit/utilities";
import InstructionStep from "@/types/InstructionStep";
import React from "react";
import { RecipeDetail } from "@/types/Recipe";
import { useSortable } from "@dnd-kit/sortable";

export default function MobileSortableRecipeInstruction({
  recipe,
  instructionStep,
  index,
  setRecipe,
}: {
  recipe: RecipeDetail;
  instructionStep: InstructionStep;
  index: number;
  setRecipe: (recipe: RecipeDetail) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: instructionStep.id,
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
            value={instructionStep.title}
            size="sm"
            radius="md"
            variant="unstyled"
            withAsterisk
            styles={{ input: { fontSize: '1.1rem', fontWeight: 700, padding: 0 } }}
            onChange={(e) => {
              const newInstructions = [...recipe.instructions];
              newInstructions[index].title = e.currentTarget.value;
              setRecipe({ ...recipe, instructions: newInstructions });
            }}
          />

          <Textarea
            placeholder="Step description..."
            withAsterisk
            autosize
            size="sm"
            radius="md"
            variant="unstyled"
            minRows={2}
            value={instructionStep.description}
            leftSection={<IconNotes size="0.9rem" color="var(--mantine-color-gray-5)" />}
            leftSectionProps={{ style: { alignItems: 'flex-start', paddingTop: '4px' } }}
            styles={{ input: { paddingLeft: '28px' } }}
            onChange={(e) => {
              const newInstructions = [...recipe.instructions];
              newInstructions[index].description = e.currentTarget.value;
              setRecipe({ ...recipe, instructions: newInstructions });
            }}
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
                const newInstructions = [...recipe.instructions];
                newInstructions.splice(index, 1);
                setRecipe({ ...recipe, instructions: newInstructions });
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
}
