import {
  ActionIcon,
  Button,
  Group,
  NumberInput,
  Popover,
  Stack,
  Text,
  TextInput,
  Paper,
} from "@mantine/core";
import {
  IconExclamationMark,
  IconGripVertical,
  IconInfoCircle,
  IconTrash,
} from "@tabler/icons-react";

import { CSS } from "@dnd-kit/utilities";
import { RecipeDetail } from "@/types/Recipe";
import { useSortable } from "@dnd-kit/sortable";
import { UseFormReturnType } from "@mantine/form";
import { useState } from "react";

interface MobileSortableRecipeIngredientProps {
  form: UseFormReturnType<RecipeDetail>;
  index: number;
  ingredientId: string;
}

/**
 * Mobile layout for a sortable ingredient card.
 * Uses Mantine Form's uncontrolled mode for inputs.
 */
export default function MobileSortableRecipeIngredient({
  form,
  index,
  ingredientId,
}: MobileSortableRecipeIngredientProps) {
  // Track subtext for display - updated by form.watch callback
  const [subtext, setSubtext] = useState(
    () => form.getValues().ingredients[index]?.subtext || ''
  );

  form.watch(`ingredients.${index}.subtext`, ({ value }) => {
    setSubtext(value || '');
  });

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: ingredientId,
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
        backgroundColor: isDragging ? 'light-dark(var(--mantine-color-orange-0), rgba(247, 103, 7, 0.15))' : 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
        zIndex: isDragging ? 100 : 1,
        opacity: isDragging ? 0.9 : 1,
        border: isDragging ? '1px solid var(--mantine-color-orange-4)' : undefined,
      }}
      className="sortableItem"
    >
      <Group gap="sm" align="flex-start" wrap="nowrap">
        <ActionIcon
          variant="subtle"
          color="gray"
          className="sortableMoveIcon"
          {...attributes}
          {...listeners}
          size="lg"
          mt={4} // Align with top row
          style={{ touchAction: "none", cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <IconGripVertical size={20} />
        </ActionIcon>

        <Stack gap="xs" style={{ flex: 1 }}>
          {/* Row 1: Quantity, Unit, Spacer, Actions */}
          <Group gap="sm" wrap="nowrap" align="center">
            <NumberInput
              placeholder="0"
              withAsterisk
              allowNegative={false}
              size="sm"
              radius="md"
              variant="default" // Added visual boundary
              hideControls={false} // Keep controls for mobile ease of use
              styles={{ input: { fontWeight: 700, width: '70px', textAlign: 'center' } }}
              key={form.key(`ingredients.${index}.quantity`)}
              {...form.getInputProps(`ingredients.${index}.quantity`)}
            />
            <TextInput
              placeholder="Unit"
              size="sm"
              radius="md"
              variant="default" // Added visual boundary
              withAsterisk
              style={{ flex: 1 }}
              styles={{ input: { fontWeight: 500, fontStyle: 'italic' } }}
              key={form.key(`ingredients.${index}.unit`)}
              {...form.getInputProps(`ingredients.${index}.unit`)}
            />

            {/* Spacer removed to let Unit fill space */}

            <Group gap={4} wrap="nowrap">
              <Popover width={280} position="bottom-end" withArrow trapFocus shadow="md">
                <Popover.Target>
                  <ActionIcon variant="subtle" color={subtext ? "blue" : "gray"} size="lg">
                    <IconInfoCircle size={20} />
                  </ActionIcon>
                </Popover.Target>
                <Popover.Dropdown p="md">
                  <TextInput
                    label="Notes"
                    placeholder="e.g. Can substitute with..."
                    size="sm"
                    radius="md"
                    key={form.key(`ingredients.${index}.subtext`)}
                    {...form.getInputProps(`ingredients.${index}.subtext`)}
                  />
                </Popover.Dropdown>
              </Popover>

              <Popover position="bottom-end" withArrow trapFocus shadow="md">
                <Popover.Target>
                  <ActionIcon variant="subtle" color="red" size="lg">
                    <IconTrash size={20} />
                  </ActionIcon>
                </Popover.Target>
                <Popover.Dropdown p="xs">
                  <Button
                    color="red"
                    size="xs"
                    onClick={() => {
                      form.removeListItem('ingredients', index);
                    }}
                    leftSection={<IconExclamationMark size={14} />}
                  >
                    Delete
                  </Button>
                </Popover.Dropdown>
              </Popover>
            </Group>
          </Group>

          {/* Row 2: Ingredient Name */}
          <TextInput
            placeholder="Ingredient Name"
            size="md" // Larger text for name
            radius="md"
            variant="default"
            withAsterisk
            styles={{ input: { fontWeight: 600 } }}
            key={form.key(`ingredients.${index}.name`)}
            {...form.getInputProps(`ingredients.${index}.name`)}
          />

          {/* Row 3: Subtext display (if present) */}
          {subtext && (
            <Text size="xs" c="dimmed" fs="italic">
               Note: {subtext}
            </Text>
          )}
        </Stack>
      </Group>
    </Paper>
  );
}
