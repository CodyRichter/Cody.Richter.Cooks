'use client';

import {
  ActionIcon,
  Collapse,
  Grid,
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

interface DesktopSortableRecipeIngredientProps {
  form: UseFormReturnType<RecipeDetail>;
  index: number;
  ingredientId: string;
}

/**
 * Desktop layout for a structured, accessible sortable ingredient row.
 */
export default function DesktopSortableRecipeIngredient({
  form,
  index,
  ingredientId,
}: DesktopSortableRecipeIngredientProps) {
  const initialSubtext = form.getValues().ingredients[index]?.subtext;
  const [showSubtext, setShowSubtext] = useState<boolean>(!!initialSubtext);
  const totalCount = form.getValues().ingredients?.length || 0;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: ingredientId,
      disabled: totalCount <= 1,
    });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentRecipe = form.getValues();
      form.insertListItem('ingredients', {
        id: crypto.randomUUID(),
        quantity: 0,
        name: "",
        unit: "",
        subtext: "",
        order_index: currentRecipe.ingredients.length,
        recipe_id: currentRecipe.id,
      });
    }
  };

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
        <Group gap="xs" align="center" wrap="nowrap">
          {/* Drag Handle with Tooltip and accessible signifiers */}
          <Tooltip
            label={totalCount > 1 ? "Drag to reorder ingredient" : "Add more ingredients to reorder"}
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
                flexShrink: 0,
              }}
              aria-label="Drag ingredient to reorder"
            >
              <IconGripVertical size={16} />
            </ActionIcon>
          </Tooltip>

          {/* Quantity */}
          <NumberInput
            placeholder="0"
            withAsterisk
            hideControls
            allowNegative={false}
            decimalScale={2}
            min={0}
            size="sm"
            radius="md"
            w={55}
            styles={{ input: { fontWeight: 600, textAlign: 'center', paddingLeft: 4, paddingRight: 4 } }}
            key={form.key(`ingredients.${index}.quantity`)}
            {...form.getInputProps(`ingredients.${index}.quantity`)}
            onKeyDown={handleKeyDown}
          />

          {/* Unit */}
          <TextInput
            placeholder="Unit"
            size="sm"
            radius="md"
            withAsterisk
            w={70}
            styles={{ input: { fontWeight: 500, paddingLeft: 6, paddingRight: 6 } }}
            key={form.key(`ingredients.${index}.unit`)}
            {...form.getInputProps(`ingredients.${index}.unit`)}
            onKeyDown={handleKeyDown}
          />

          {/* Ingredient Name (Concise placeholder to prevent clipping) */}
          <TextInput
            placeholder="e.g. Olive oil"
            size="sm"
            radius="md"
            withAsterisk
            style={{ flex: 1, minWidth: 90 }}
            styles={{ input: { fontWeight: 500 } }}
            key={form.key(`ingredients.${index}.name`)}
            {...form.getInputProps(`ingredients.${index}.name`)}
            onKeyDown={handleKeyDown}
          />

          {/* Actions */}
          <Group gap={2} wrap="nowrap" style={{ flexShrink: 0 }}>
            <Tooltip label={showSubtext ? "Hide note" : "Add note / prep info"} position="top" withArrow>
              <ActionIcon
                variant={showSubtext ? "light" : "subtle"}
                color={showSubtext ? "orange" : "gray"}
                size="md"
                radius="md"
                onClick={() => setShowSubtext((prev) => !prev)}
                aria-label="Toggle ingredient note"
              >
                {showSubtext ? <IconNotesOff size={16} /> : <IconNotes size={16} />}
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Remove ingredient" position="top" withArrow>
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

        {/* Collapsible Subtext / Prep Note */}
        <Collapse expanded={showSubtext}>
          <Grid pl={28} pr={4} pt={4}>
            <Grid.Col span={12}>
              <TextInput
                placeholder="Optional prep note (e.g. finely diced)..."
                size="xs"
                radius="md"
                variant="filled"
                leftSection={<IconNotes size={13} color="var(--mantine-color-dimmed)" />}
                key={form.key(`ingredients.${index}.subtext`)}
                {...form.getInputProps(`ingredients.${index}.subtext`)}
                onKeyDown={handleKeyDown}
              />
            </Grid.Col>
          </Grid>
        </Collapse>
      </Stack>
    </Paper>
  );
}
