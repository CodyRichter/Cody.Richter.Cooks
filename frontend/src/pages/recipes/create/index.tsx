import { Button, Group, Text, Container, Stack } from "@mantine/core";
import React, { useState } from "react";

import EditRecipe from "../../../components/recipes/edit/EditRecipe";
import ProtectedRoute from "../../../components/auth/ProtectedRoute";
import { isRecipeValid } from "../../../utils/recipeUtils";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/router";
import { useCreateRecipe } from "../../../hooks/useRecipes";
import { RecipeCreate, RecipeDetail } from "../../../types/Recipe";

export default function CreateRecipe() {
  const router = useRouter();

  const [newRecipe, setNewRecipe] = useState<RecipeDetail>({
    id: "temp-new-recipe",
    title: "",
    description: "",
    tags: [],
    cooking_time: undefined,
    serving_size: undefined,
    ingredients: [],
    instructions: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const { mutateAsync: createRecipe, isPending, error } = useCreateRecipe();

  // Disable the create button if the recipe is invalid or network is loading
  const disableCreateButton: boolean = !isRecipeValid(newRecipe) || isPending;

  const handleCreateRecipe = async () => {
    if (!isRecipeValid(newRecipe)) {
      notifications.show({
        title: "Invalid Recipe",
        message: "Please ensure all fields are filled out before creating the recipe.",
        color: "red",
      });
      return;
    }

    // Convert RecipeDetail to RecipeCreate for API
    const recipeToCreate: RecipeCreate = {
      title: newRecipe.title,
      description: newRecipe.description,
      tags: newRecipe.tags,
      cooking_time: newRecipe.cooking_time,
      serving_size: newRecipe.serving_size,
      ingredients: newRecipe.ingredients.map(ing => ({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        subtext: ing.subtext,
        order_index: ing.order_index
      })),
      instructions: newRecipe.instructions.map(inst => ({
        title: inst.title,
        description: inst.description,
        step_number: inst.step_number,
        timing: inst.timing
      }))
    };

    createRecipe(recipeToCreate, {
      onSuccess: (createdRecipe) => {
        notifications.show({
          title: "Recipe Created",
          message: "The recipe has been created successfully.",
          color: "teal",
        });
        router.push(`/recipes/view/${createdRecipe.id}`);
      },
      onError: () => {
        notifications.show({
          title: "Error Creating Recipe",
          message: error?.message || "Failed to create recipe. Please try again.",
          color: "red",
        });
      }
    });
  };

  return (
    <ProtectedRoute>
      <Container size="xl" px="md">
        <Stack gap="lg">
          <Text fw={700} size="xl">
            Create New Recipe
          </Text>

          <EditRecipe recipe={newRecipe} setRecipe={setNewRecipe} />

          <Group justify="flex-end">
            <Button
              w="200px"
              loading={isPending}
              disabled={disableCreateButton}
              onClick={handleCreateRecipe}
            >
              Create Recipe
            </Button>
          </Group>
        </Stack>
      </Container>
    </ProtectedRoute>
  );
}
