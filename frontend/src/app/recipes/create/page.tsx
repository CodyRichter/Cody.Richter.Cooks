'use client';

import { Button, Group, Text, Container, Stack } from "@mantine/core";
import React from "react";
import { IconPlus } from "@tabler/icons-react";
import { useForm, UseFormReturnType } from "@mantine/form";

import EditRecipe from "@/components/recipes/edit/EditRecipe";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { isRecipeValid } from "@/utils/recipeUtils";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { useCreateRecipe } from "@/hooks/useRecipes";
import { RecipeCreate, RecipeDetail } from "@/types/Recipe";

export default function CreateRecipe() {
  const router = useRouter();

  const form: UseFormReturnType<RecipeDetail> = useForm<RecipeDetail>({
    initialValues: {
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
    },
    validate: {
      title: (value) => (value.trim().length < 3 ? 'Title must be at least 3 characters' : null),
    },
  });

  const { mutateAsync: createRecipe, isPending } = useCreateRecipe();

  // Disable the create button if the recipe is invalid or network is loading
  const disableCreateButton: boolean = !isRecipeValid(form.values) || isPending;

  const handleCreateRecipe = async () => {
    const { values } = form;

    if (!isRecipeValid(values)) {
      notifications.show({
        title: "Invalid Recipe",
        message: "Please ensure all fields are filled out before creating the recipe.",
        color: "red",
      });
      return;
    }

    // Convert RecipeDetail to RecipeUpdate for API
    const recipeToCreate: RecipeCreate = {
      title: values.title,
      description: values.description,
      tags: values.tags,
      cooking_time: values.cooking_time,
      serving_size: values.serving_size,
      ingredients: values.ingredients.map(ing => ({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        subtext: ing.subtext,
        order_index: ing.order_index
      })),
      instructions: values.instructions.map(inst => ({
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
      onError: (err) => {
        notifications.show({
          title: "Error Creating Recipe",
          message: err?.message || "Failed to create recipe. Please try again.",
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

          <EditRecipe form={form} />

          <Group justify="flex-end">
            <Button
              size="lg"
              radius="md"
              color="orange"
              variant="filled"
              w="200px"
              leftSection={<IconPlus size={20} />}
              loading={isPending}
              disabled={disableCreateButton}
              onClick={handleCreateRecipe}
              style={{
                boxShadow: '0 4px 12px rgba(255, 145, 0, 0.2)',
              }}
            >
              Create Recipe
            </Button>
          </Group>
        </Stack>
      </Container>
    </ProtectedRoute>
  );
}
