import {
  Button,
  Divider,
  Group,
  Paper,
  Stack,
  TextInput,
  NumberInput,
  Title,
} from "@mantine/core";
import React, { useState } from "react";

import EditRecipeIngredients from "./ingredients/EditRecipeIngredients";
import EditRecipeInstructions from "./instructions/EditRecipeInstructions";
import EditRecipeTags from "./tags/EditRecipeTags";
import { IconPlus, IconClock, IconUsers } from "@tabler/icons-react";
import { RecipeDetail } from "@/types/Recipe";
import { memo, useCallback } from "react";

// Import TipTap editor directly - Next.js handles code splitting
import TipTapEditorWrapper from "./description/TipTapEditorWrapper";

interface EditRecipeProps {
  recipe: RecipeDetail;
  setRecipe: (recipe: RecipeDetail) => void;
}

const EditRecipe = memo<EditRecipeProps>(({
  recipe,
  setRecipe,
}) => {
  // Due to how the TipTap RichTextEditor works, we need to use a separate state for the description
  // and update the recipe object when the description changes.
  const [description, setDescription] = useState(recipe.description || '');

  // Memoize the description update to prevent unnecessary re-renders
  const handleDescriptionChange = useCallback((newDescription: string) => {
    setDescription(newDescription);
    setRecipe({ ...recipe, description: newDescription });
  }, [recipe, setRecipe]);

  // Memoize the title change handler
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRecipe({ ...recipe, title: e.currentTarget.value });
  }, [recipe, setRecipe]);

  // Memoize the cooking time change handler
  const handleCookingTimeChange = useCallback((value: string | number) => {
    setRecipe({ ...recipe, cooking_time: typeof value === 'string' ? parseInt(value) || undefined : value || undefined });
  }, [recipe, setRecipe]);

  // Memoize the serving size change handler
  const handleServingSizeChange = useCallback((value: string | number) => {
    setRecipe({ ...recipe, serving_size: typeof value === 'string' ? parseInt(value) || undefined : value || undefined });
  }, [recipe, setRecipe]);

  return (
    <Paper
      shadow="lg"
      p="lg"
      radius="md"
      withBorder
      style={{ borderLeft: "6px solid #e2a478" }}
    >
      <Stack gap="lg">
        {/* Header Section */}
        <Stack gap="sm">
          {/* Recipe Title */}
          <TextInput
            label="Recipe Title"
            size="md"
            placeholder="French Onion Soup"
            value={recipe.title}
            withAsterisk
            onChange={handleTitleChange}
            styles={{
              input: {
                fontSize: '1.5rem',
                fontWeight: 600,
              }
            }}
          />

          {/* Recipe metadata */}
          <Group gap="md">
            <NumberInput
              label="Cooking Time"
              placeholder="30"
              value={recipe.cooking_time || ''}
              onChange={handleCookingTimeChange}
              min={0}
              max={1440}
              step={5}
              suffix=" minutes"
              leftSection={<IconClock size="1rem" />}
              style={{ flex: 1 }}
            />

            <NumberInput
              label="Serving Size"
              placeholder="4"
              value={recipe.serving_size || ''}
              onChange={handleServingSizeChange}
              min={1}
              max={50}
              suffix=" servings"
              leftSection={<IconUsers size="1rem" />}
              style={{ flex: 1 }}
            />
          </Group>

          {/* Recipe Tags */}
          <EditRecipeTags
            recipe={recipe}
            setRecipe={(updatedRecipe) => setRecipe(updatedRecipe as RecipeDetail)}
          />
        </Stack>

        <Divider />

        {/* Description Section */}
        <Stack gap="sm">
          <Title order={4}>Description</Title>
          <TipTapEditorWrapper
            description={description}
            setDescription={handleDescriptionChange}
          />
        </Stack>

        {/* Ingredients Section */}
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Title order={4}>Ingredients</Title>
            <Button
              variant="outline"
              size="sm"
              leftSection={<IconPlus size="1rem" />}
              onClick={() => {
                const newIngredients = [...recipe.ingredients];
                newIngredients.push({
                  id: crypto.randomUUID(),
                  quantity: 0,
                  name: "",
                  unit: "",
                  subtext: "",
                  order_index: newIngredients.length,
                  recipe_id: recipe.id,
                });
                setRecipe({ ...recipe, ingredients: newIngredients });
              }}
            >
              Add Ingredient
            </Button>
          </Group>

          <EditRecipeIngredients recipe={recipe} setRecipe={setRecipe} />
        </Stack>

        {/* Instructions Section */}
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Title order={4}>Instructions</Title>
            <Button
              variant="outline"
              size="sm"
              leftSection={<IconPlus size="1rem" />}
              onClick={() => {
                const newInstructions = [...recipe.instructions];
                newInstructions.push({
                  id: crypto.randomUUID(),
                  title: "",
                  description: "",
                  step_number: newInstructions.length + 1,
                  recipe_id: recipe.id,
                });
                setRecipe({ ...recipe, instructions: newInstructions });
              }}
            >
              Add Step
            </Button>
          </Group>

          <EditRecipeInstructions recipe={recipe} setRecipe={setRecipe} />
        </Stack>
      </Stack>
    </Paper>
  );
});

EditRecipe.displayName = 'EditRecipe';

export default EditRecipe;