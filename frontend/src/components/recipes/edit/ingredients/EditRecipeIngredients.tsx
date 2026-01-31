import { DndContext, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { Ingredient } from "@/types/Ingredient";
import { RecipeDetail } from "@/types/Recipe";
import SortableRecipeIngredient from "@/components/recipes/edit/ingredients/SortableRecipeIngredient";
import { Grid, Text, Box } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";

interface EditRecipeIngredientsProps {
  form: UseFormReturnType<RecipeDetail>;
}

/**
 * The EditRecipeIngredients component renders the sortable list of ingredients.
 * Uses form.watch() to react to list changes (add/remove/reorder).
 */
export default function EditRecipeIngredients({
  form,
}: EditRecipeIngredientsProps) {
  // Subscribe to ingredients changes - this makes the component reactive to form updates
  form.watch('ingredients', () => {});

  // Get current ingredients from form
  const ingredients = form.getValues().ingredients;

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

  return (
    <Box>
      {ingredients.length > 0 && (
        <Grid gutter="xs" px="lg" mb="xs" style={{ paddingLeft: '64px', paddingRight: '120px' }}>
          <Grid.Col span={2}>
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">Qty</Text>
          </Grid.Col>
          <Grid.Col span={3}>
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">Unit</Text>
          </Grid.Col>
          <Grid.Col span={7}>
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">Ingredient Name</Text>
          </Grid.Col>
        </Grid>
      )}
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
    </Box>
  );
}
