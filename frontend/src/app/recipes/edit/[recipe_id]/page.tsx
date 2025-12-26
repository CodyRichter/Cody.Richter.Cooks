'use client';

import { ActionIcon, Button, Group, Text, Container, Stack, Tooltip } from "@mantine/core";
import { useState, useMemo } from "react";

import EditRecipe from "@/components/recipes/edit/EditRecipe";
import { IconChevronLeft, IconDeviceFloppy } from "@tabler/icons-react";
import { ApiErrorAlert } from "@/components/error-handling";
import { RecipeDetail, RecipeUpdate } from "@/types/Recipe";
import RecipeLoadingSkeleton from "@/components/recipes/view/RecipeLoadingSkeleton";
import { isRecipeValid } from "@/utils/recipeUtils";
import { notifications } from "@mantine/notifications";
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "next/navigation";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useRecipe, useUpdateRecipe } from "@/hooks/useRecipes";
import { useUserRecipePermissions } from "@/hooks/useRecipePermissions";

export default function EditRecipePage() {
  const params = useParams();
  const { navigateToRecipe } = useAppNavigation();
  const auth = useAuth();
  const recipe_id = params?.recipe_id as string;

  // Load the recipe data
  const { data: originalRecipe, isLoading, error, refetch } = useRecipe(recipe_id);

  // Get user permissions for this recipe
  const { canEdit } = useUserRecipePermissions(recipe_id);

  // Local state for editing - initialize directly from originalRecipe
  const [recipe, setRecipe] = useState<RecipeDetail | null>(originalRecipe || null);

  // Update mutation
  const { mutate: updateRecipe, isPending: isUpdating, error: updateError } = useUpdateRecipe();

  // Update local state when original recipe loads (only if not already set)
  if (originalRecipe && !recipe) {
    setRecipe(originalRecipe);
  }

  // Check if user has permission to edit this recipe
  const hasPermission = useMemo(() => {
    return auth.isAuthenticated && canEdit;
  }, [auth.isAuthenticated, canEdit]);

  // Disable the edit button if the recipe is invalid or updating
  const disableEditButton: boolean = !recipe || !isRecipeValid(recipe) || isUpdating;

  // Handle back navigation with optimistic updates
  const handleBackClick = () => {
    navigateToRecipe(recipe_id, recipe || undefined);
  };

  // Save the recipe to the server
  const handleSaveRecipe = async () => {
    if (!recipe || !isRecipeValid(recipe)) {
      notifications.show({
        title: "Invalid Recipe",
        message: "Please ensure all fields are filled out before updating the recipe.",
        color: "red",
      });
      return;
    }

    // Convert RecipeDetail to RecipeUpdate format
    const updateData: RecipeUpdate & { id: string } = {
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      tags: recipe.tags,
      cooking_time: recipe.cooking_time,
      serving_size: recipe.serving_size,
      ingredients: recipe.ingredients.map(ing => ({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        subtext: ing.subtext,
        order_index: ing.order_index
      })),
      instructions: recipe.instructions.map(inst => ({
        title: inst.title,
        description: inst.description,
        step_number: inst.step_number,
        timing: inst.timing
      }))
    };

    updateRecipe(updateData, {
      onSuccess: () => {
        notifications.show({
          title: "Recipe Updated",
          message: "The recipe has been updated successfully.",
          color: "teal",
        });
        navigateToRecipe(recipe.id, recipe);
      },
      onError: () => {
        notifications.show({
          title: "Error Updating Recipe",
          message: updateError?.message || "Failed to update recipe. Please try again.",
          color: "red",
        });
      }
    });
  };

  if (isLoading) {
    return <RecipeLoadingSkeleton />;
  }

  if (!hasPermission) {
    const permissionError = new Error('You do not have permission to edit this recipe.');
    return (
      <Container size="md" py="xl">
        <ApiErrorAlert
          error={permissionError}
          showRetry={false}
          title="Access Denied"
        />
      </Container>
    );
  }

  if (error || !recipe) {
    return (
      <Container size="md" py="xl">
        <ApiErrorAlert
          error={error}
          onRetry={refetch}
          title="Failed to load recipe"
        />
      </Container>
    );
  }

  return (
    <Container size="xl" px="md">
      <Stack gap="lg">
        <Group gap="sm">
          <Tooltip label="Back to Recipe">
            <ActionIcon
              onClick={handleBackClick}
              variant="light"
              size="lg"
              color="gray"
              radius="md"
            >
              <IconChevronLeft size={20} />
            </ActionIcon>
          </Tooltip>
          <Text fw={800} size="xl" style={{ letterSpacing: '-0.02em' }}>
            Edit Recipe
          </Text>
        </Group>

        <EditRecipe recipe={recipe} setRecipe={setRecipe} />

        <Group justify="flex-end">
          <Button
            size="lg"
            radius="md"
            color="orange"
            variant="filled"
            w="200px"
            leftSection={<IconDeviceFloppy size={20} />}
            loading={isUpdating}
            disabled={disableEditButton}
            onClick={handleSaveRecipe}
            style={{
              boxShadow: '0 4px 12px rgba(255, 145, 0, 0.2)',
            }}
          >
            Save Recipe
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
