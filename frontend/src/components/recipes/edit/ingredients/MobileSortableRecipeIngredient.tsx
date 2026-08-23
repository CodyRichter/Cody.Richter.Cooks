'use client';

import {
  ActionIcon,
  Collapse,
  Group,
  NumberInput,
  Paper,
  Stack,
  TextInput,
  Tooltip,
} from "@mantine/core";
import {
  IconGripVertical,
  IconNotes,
  IconNotesOff,
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
 * Clean, compact mobile layout for a sortable ingredient row with ergonomic touch targets.
 */
export default function MobileSortableRecipeIngredient({
  form,
  index,
  ingredientId,
}: MobileSortableRecipeIngredientProps) {
  const initialSubtext = form.getValues().ingredients[index]?.subtext;
  const [showSubtext, setShowSubtext] = useState<boolean>(!!initialSubtext);
  const totalCount = form.getValues().ingredients?.length || 0;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: ingredientId,
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
      <Stack gap={4}>
        {/* Single compact row for mobile with comfortable touch targets */}
        <Group gap={4} wrap="nowrap" align="center">
          {/* Drag Handle with generous touch area */}
          <ActionIcon
            variant="subtle"
            color={isDragging ? "orange" : "gray"}
            className="sortableMoveIcon"
            {...attributes}
            {...listeners}
            size="md"
            radius="sm"
            style={{
              touchAction: "none",
              cursor: totalCount <= 1 ? 'default' : isDragging ? 'grabbing' : 'grab',
              opacity: totalCount <= 1 ? 0.35 : 0.8,
              flexShrink: 0,
              minWidth: '32px',
              minHeight: '32px',
            }}
            aria-label="Drag ingredient to reorder"
          >
            <IconGripVertical size={18} />
          </ActionIcon>

          {/* Qty */}
          <NumberInput
            placeholder="0"
            withAsterisk
            hideControls
            allowNegative={false}
            decimalScale={2}
            min={0}
            size="xs"
            radius="md"
            w={50}
            styles={{ input: { fontWeight: 700, textAlign: 'center', paddingLeft: 2, paddingRight: 2, height: '32px' } }}
            key={form.key(`ingredients.${index}.quantity`)}
            {...form.getInputProps(`ingredients.${index}.quantity`)}
          />

          {/* Unit */}
          <TextInput
            placeholder="Unit"
            size="xs"
            radius="md"
            withAsterisk
            w={62}
            styles={{ input: { fontWeight: 500, paddingLeft: 6, paddingRight: 6, height: '32px' } }}
            key={form.key(`ingredients.${index}.unit`)}
            {...form.getInputProps(`ingredients.${index}.unit`)}
          />

          {/* Name */}
          <TextInput
            placeholder="e.g. Garlic cloves"
            size="xs"
            radius="md"
            withAsterisk
            style={{ flex: 1, minWidth: 80 }}
            styles={{ input: { fontWeight: 600, height: '32px' } }}
            key={form.key(`ingredients.${index}.name`)}
            {...form.getInputProps(`ingredients.${index}.name`)}
          />

          {/* Actions */}
          <Group gap={2} wrap="nowrap" style={{ flexShrink: 0 }}>
            <Tooltip label={showSubtext ? "Hide note" : "Add note"} position="top" withArrow>
              <ActionIcon
                variant={showSubtext ? "light" : "subtle"}
                color={showSubtext ? "orange" : "gray"}
                size="md"
                radius="md"
                onClick={() => setShowSubtext((prev) => !prev)}
                aria-label="Toggle note"
              >
                {showSubtext ? <IconNotesOff size={16} /> : <IconNotes size={16} />}
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Delete ingredient" position="top" withArrow>
              <ActionIcon
                variant="subtle"
                color="red"
                size="md"
                radius="md"
                onClick={() => {
                  form.removeListItem('ingredients', index);
                }}
                aria-label="Remove ingredient"
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {/* Collapsible Subtext / Note */}
        <Collapse expanded={showSubtext}>
          <TextInput
            placeholder="Optional prep note (e.g. minced)..."
            size="xs"
            radius="md"
            variant="filled"
            leftSection={<IconNotes size={12} color="var(--mantine-color-dimmed)" />}
            key={form.key(`ingredients.${index}.subtext`)}
            {...form.getInputProps(`ingredients.${index}.subtext`)}
          />
        </Collapse>
      </Stack>
    </Paper>
  );
}
