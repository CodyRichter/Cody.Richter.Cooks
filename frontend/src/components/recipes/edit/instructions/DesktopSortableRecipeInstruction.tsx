import {
  ActionIcon,
  Button,
  Group,
  Popover,
  TextInput,
  Textarea,
  Paper,
  Text,
  Tooltip,
  Stack,
} from "@mantine/core";
import {
  IconExclamationMark,
  IconGripVertical,
  IconTrash,
  IconNotes,
} from "@tabler/icons-react";

import { CSS } from "@dnd-kit/utilities";
import { InstructionStep } from "@/types/InstructionStep";
import { RecipeDetail } from "@/types/Recipe";
import { useSortable } from "@dnd-kit/sortable";

export default function DesktopSortableRecipeInstruction({
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
      p="md"
      radius="md"
      withBorder
      mb="md"
      shadow={isDragging ? "md" : "sm"}
      style={{
        transform: CSS.Transform.toString(
          transform ? { ...transform, x: 0 } : null
        ),
        transition: transition,
        backgroundColor: isDragging ? 'var(--mantine-color-orange-0)' : 'var(--mantine-color-gray-0)',
        zIndex: isDragging ? 100 : 1,
        opacity: isDragging ? 0.8 : 1,
        border: isDragging ? '1px solid var(--mantine-color-orange-4)' : undefined,
      }}
      className="sortableItem"
    >
      <Group align="flex-start" wrap="nowrap" gap="md">
        <Stack gap="xs" align="center" style={{ width: '40px' }}>
          <ActionIcon
            variant="subtle"
            color="gray"
            className="sortableMoveIcon"
            {...attributes}
            {...listeners}
            size="lg"
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            <IconGripVertical size={20} />
          </ActionIcon>
          <Text fw={700} size="xl" c="orange.6" style={{ userSelect: 'none' }}>
            {index + 1}
          </Text>
        </Stack>

        <Stack gap="xs" style={{ flex: 1 }}>
          <TextInput
            placeholder="Step Title (e.g. Sautéing the aromatics)"
            value={instructionStep.title}
            size="md"
            radius="md"
            variant="unstyled"
            withAsterisk
            styles={{ input: { fontSize: '1.2rem', fontWeight: 700, padding: 0 } }}
            onChange={(e) => {
              const newInstructions = [...recipe.instructions];
              newInstructions[index].title = e.currentTarget.value;
              setRecipe({ ...recipe, instructions: newInstructions });
            }}
          />

          <Textarea
            placeholder="Tell us what to do in this step..."
            withAsterisk
            autosize
            size="sm"
            radius="md"
            variant="unstyled"
            minRows={2}
            value={instructionStep.description}
            leftSection={<IconNotes size="1rem" color="var(--mantine-color-gray-5)" />}
            leftSectionProps={{ style: { alignItems: 'flex-start', paddingTop: '4px' } }}
            styles={{ input: { paddingLeft: '32px' } }}
            onChange={(e) => {
              const newInstructions = [...recipe.instructions];
              newInstructions[index].description = e.currentTarget.value;
              setRecipe({ ...recipe, instructions: newInstructions });
            }}
          />
        </Stack>

        <Stack gap="xs" justify="flex-start" h="100%">
          <Popover position="left" withArrow trapFocus shadow="md">
            <Popover.Target>
              <Tooltip label="Delete Step">
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="md"
                  radius="md"
                >
                  <IconTrash size={18} />
                </ActionIcon>
              </Tooltip>
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
                Confirm Delete
              </Button>
            </Popover.Dropdown>
          </Popover>
        </Stack>
      </Group>
    </Paper>
  );
}
