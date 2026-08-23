import { DndContext, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { Ingredient } from "@/types/Ingredient";
import { RecipeDetail } from "@/types/Recipe";
import SortableRecipeIngredient from "@/components/recipes/edit/ingredients/SortableRecipeIngredient";
import { Box, Group, Text, UnstyledButton } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { IconPlus } from "@tabler/icons-react";

interface EditRecipeIngredientsProps {
  form: UseFormReturnType<RecipeDetail>;
}

/**
 * Renders the sortable list of ingredients with column header markers and drag-and-drop.
 */
export default function EditRecipeIngredients({
  form,
}: EditRecipeIngredientsProps) {
  // Subscribe to ingredients changes
  form.watch('ingredients', () => {});

  const ingredients = form.getValues().ingredients || [];

  const reorderIngredients = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!active || !over || !active.id || !over.id) {
      return;
    }
    if (active.id !== over.id) {
      const currentIngredients = form.getValues().ingredients;
      const from = currentIngredients.findIndex((ing) => ing.id === active.id);
      const to = currentIngredients.findIndex((ing) => ing.id === over.id);
      form.reorderListItem('ingredients', { from, to });
    }
  };

  const handleAddFirst = () => {
    const currentRecipe = form.getValues();
    form.insertListItem('ingredients', {
      id: crypto.randomUUID(),
      quantity: 0,
      name: "",
      unit: "",
      subtext: "",
      order_index: currentRecipe.ingredients?.length || 0,
      recipe_id: currentRecipe.id,
    });
  };

  return (
    <Box>
      {ingredients.length > 0 && (
        <Group gap="xs" px="xs" mb={4} wrap="nowrap" visibleFrom="sm">
          <Box w={28} />
          <Text size="xs" fw={700} c="dimmed" w={55} ta="center">
            QTY <Text span c="red" inherit>*</Text>
          </Text>
          <Text size="xs" fw={700} c="dimmed" w={70} pl={4}>
            UNIT <Text span c="red" inherit>*</Text>
          </Text>
          <Text size="xs" fw={700} c="dimmed" style={{ flex: 1 }} pl={4}>
            INGREDIENT NAME <Text span c="red" inherit>*</Text>
          </Text>
          <Box w={56} />
        </Group>
      )}

      {ingredients.length === 0 ? (
        <UnstyledButton
          onClick={handleAddFirst}
          p="lg"
          w="100%"
          ta="center"
          style={{
            border: '1px dashed var(--mantine-color-default-border)',
            borderRadius: 'var(--mantine-radius-md)',
            backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-7))',
            cursor: 'pointer',
            transition: 'border-color 150ms ease, background-color 150ms ease',
          }}
        >
          <Group justify="center" gap="xs">
            <IconPlus size={16} color="var(--mantine-color-orange-6)" />
            <Text size="sm" c="dimmed" fw={500}>
              Click to add your first ingredient
            </Text>
          </Group>
        </UnstyledButton>
      ) : (
        <DndContext onDragEnd={reorderIngredients}>
          <SortableContext
            items={ingredients}
            strategy={verticalListSortingStrategy}
          >
            {ingredients.map((ingredient: Ingredient, index: number) => (
              <SortableRecipeIngredient
                key={ingredient.id}
                form={form}
                index={index}
                ingredientId={ingredient.id}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </Box>
  );
}
