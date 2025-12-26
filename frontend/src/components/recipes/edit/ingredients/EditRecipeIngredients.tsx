import { DndContext, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { Ingredient } from "@/types/Ingredient";
import { RecipeDetail } from "@/types/Recipe";
import SortableRecipeIngredient from "@/components/recipes/edit/ingredients/SortableRecipeIngredient";
import { Grid, Text, Box } from "@mantine/core";

interface EditRecipeIngredientsProps {
  recipe: RecipeDetail;
  setRecipe: (recipe: RecipeDetail) => void;
}

/**
 * The EditRecipeIngredients component is responsible for rendering the list of ingredients
 * for a recipe. It allows users to drag and drop ingredients to reorder them.
 * It uses the DnD Kit library for drag and drop functionality.
 */
export default function EditRecipeIngredients({
  recipe,
  setRecipe,
}: EditRecipeIngredientsProps) {
  const reorderIngredients = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!active || !over || !active.id || !over.id) {
      return;
    }
    if (active.id !== over.id) {
      setRecipe({
        ...recipe,
        ingredients: arrayMove(
          recipe.ingredients,
          recipe.ingredients.findIndex(
            (ingredient) => ingredient.id === active.id
          ),
          recipe.ingredients.findIndex(
            (ingredient) => ingredient.id === over.id
          )
        ),
      });
    }
  };

  return (
    <Box>
      {recipe.ingredients.length > 0 && (
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
          items={recipe.ingredients}
          strategy={verticalListSortingStrategy}
        >
          {recipe.ingredients.map((ingredient: Ingredient, index: number) => (
            <SortableRecipeIngredient
              key={ingredient.id}
              recipe={recipe}
              ingredient={ingredient}
              index={index}
              setRecipe={setRecipe}
            />
          ))}
        </SortableContext>
      </DndContext>
    </Box>
  );
}
