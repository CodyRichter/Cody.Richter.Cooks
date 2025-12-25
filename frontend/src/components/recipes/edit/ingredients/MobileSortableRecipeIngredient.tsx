import {
  ActionIcon,
  Button,
  Flex,
  Group,
  NumberInput,
  Popover,
  Stack,
  Text,
  TextInput,
  Paper,
  Tooltip,
} from "@mantine/core";
import {
  IconExclamationMark,
  IconGripVertical,
  IconInfoCircle,
  IconTrash,
  IconScale,
  IconToolsKitchen2,
} from "@tabler/icons-react";
import React from "react";

import { CSS } from "@dnd-kit/utilities";
import Ingredient from "@/types/Ingredient";
import { RecipeDetail } from "@/types/Recipe";
import { useSortable } from "@dnd-kit/sortable";

export default function MobileSortableRecipeIngredient({
  recipe,
  ingredient,
  index,
  setRecipe,
}: {
  recipe: RecipeDetail;
  ingredient: Ingredient;
  index: number;
  setRecipe: (recipe: RecipeDetail) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: ingredient.id,
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
      <Group gap="sm" align="center" wrap="nowrap">
        <ActionIcon
          variant="subtle"
          color="gray"
          className="sortableMoveIcon"
          {...attributes}
          {...listeners}
          size="lg"
          style={{ touchAction: "none", cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <IconGripVertical size={20} />
        </ActionIcon>

        <Stack gap="xs" style={{ flex: 1 }}>
          <Group gap="xs" wrap="nowrap" align="center">
            <NumberInput
              placeholder="0"
              value={ingredient.quantity}
              withAsterisk
              allowNegative={false}
              size="sm"
              radius="md"
              variant="unstyled"
              hideControls
              styles={{ input: { fontWeight: 700, width: '40px', textAlign: 'center' } }}
              onChange={(newValue) => {
                const newIngredients = [...recipe.ingredients];
                newIngredients[index].quantity = newValue as number;
                setRecipe({ ...recipe, ingredients: newIngredients });
              }}
            />
            <TextInput
              placeholder="Unit"
              value={ingredient.unit}
              size="sm"
              radius="md"
              variant="unstyled"
              withAsterisk
              styles={{ input: { fontWeight: 500, fontStyle: 'italic', width: '60px' } }}
              onChange={(e) => {
                const newIngredients = [...recipe.ingredients];
                newIngredients[index].unit = e.currentTarget.value;
                setRecipe({ ...recipe, ingredients: newIngredients });
              }}
            />
            <TextInput
              placeholder="Ingredient Name"
              value={ingredient.name}
              size="sm"
              radius="md"
              variant="unstyled"
              withAsterisk
              style={{ flex: 1 }}
              styles={{ input: { fontWeight: 600 } }}
              onChange={(e) => {
                const newIngredients = [...recipe.ingredients];
                newIngredients[index].name = e.currentTarget.value;
                setRecipe({ ...recipe, ingredients: newIngredients });
              }}
            />
          </Group>

          {ingredient.subtext && (
            <Text size="xs" c="dimmed" fs="italic" pl="sm">
              {ingredient.subtext}
            </Text>
          )}
        </Stack>

        <Group gap={4} wrap="nowrap">
          <Popover width={280} position="bottom-end" withArrow trapFocus shadow="md">
            <Popover.Target>
              <ActionIcon variant="subtle" color="blue" size="md">
                <IconInfoCircle size={18} />
              </ActionIcon>
            </Popover.Target>
            <Popover.Dropdown p="md">
              <TextInput
                label="Notes"
                placeholder="e.g. Can substitute with..."
                value={ingredient.subtext}
                size="sm"
                radius="md"
                onChange={(e) => {
                  const newIngredients = [...recipe.ingredients];
                  newIngredients[index].subtext = e.currentTarget.value;
                  setRecipe({ ...recipe, ingredients: newIngredients });
                }}
              />
            </Popover.Dropdown>
          </Popover>

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
                  const newIngredients = [...recipe.ingredients];
                  newIngredients.splice(index, 1);
                  setRecipe({ ...recipe, ingredients: newIngredients });
                }}
                leftSection={<IconExclamationMark size={14} />}
              >
                Delete
              </Button>
            </Popover.Dropdown>
          </Popover>
        </Group>
      </Group>
    </Paper>
  );
}
