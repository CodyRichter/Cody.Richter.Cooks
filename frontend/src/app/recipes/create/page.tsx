'use client';

import { Container, Stack } from "@mantine/core";
import React, { useState } from "react";
import { useForm, UseFormReturnType } from "@mantine/form";

import EditRecipe from "@/components/recipes/edit/EditRecipe";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RecipeEditHeader from "@/components/recipes/edit/header/RecipeEditHeader";
import { getRecipeValidationStatus, isRecipeValid } from "@/utils/recipeUtils";
import { notifications } from "@mantine/notifications";
import { formatNotificationError } from "@/utils/notificationUtils";
import { useRouter } from "next/navigation";
import { useCreateRecipe } from "@/hooks/useRecipes";
import { RecipeCreate, RecipeDetail } from "@/types/Recipe";

export default function CreateRecipe() {
  const router = useRouter();

  const form: UseFormReturnType<RecipeDetail> = useForm<RecipeDetail>({
    mode: 'uncontrolled',
    initialValues: {
      id: "temp-new-recipe",
      title: "",
      description: "",
      tags: [],
      cooking_time: undefined,
      serving_size: undefined,
      ingredients: [
        {
          id: crypto.randomUUID(),
          quantity: 0,
          name: "",
          unit: "",
          subtext: "",
          order_index: 0,
          recipe_id: "temp-new-recipe",
        },
      ],
      instructions: [
        {
          id: crypto.randomUUID(),
          title: "",
          description: "",
          step_number: 1,
          recipe_id: "temp-new-recipe",
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    validate: {
      title: (value) => (value?.trim().length < 3 ? 'Title must be at least 3 characters' : null),
    },
  });

  const [validationStatus, setValidationStatus] = useState(() =>
    getRecipeValidationStatus(form.getValues())
  );

  // Keep validation status updated
  form.watch('title', () => setValidationStatus(getRecipeValidationStatus(form.getValues())));
  form.watch('description', () => setValidationStatus(getRecipeValidationStatus(form.getValues())));
  form.watch('ingredients', () => setValidationStatus(getRecipeValidationStatus(form.getValues())));
  form.watch('instructions', () => setValidationStatus(getRecipeValidationStatus(form.getValues())));

  const { mutateAsync: createRecipe, isPending } = useCreateRecipe();

  const handleCreateRecipe = async () => {
    const values = form.getValues();

    if (!isRecipeValid(values)) {
      notifications.show({
        title: "Incomplete Recipe",
        message: "Please ensure all required fields (title, story, ingredients, and instructions) are filled out.",
        color: "red",
      });
      return;
    }

    const recipeToCreate: RecipeCreate = {
      title: values.title,
      description: values.description,
      tags: values.tags,
      cooking_time: values.cooking_time,
      serving_size: values.serving_size,
      ingredients: values.ingredients.map((ing) => ({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        subtext: ing.subtext,
        order_index: ing.order_index,
      })),
      instructions: values.instructions.map((inst) => ({
        title: inst.title,
        description: inst.description,
        step_number: inst.step_number,
        timing: inst.timing,
      })),
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
          message: formatNotificationError(err),
          color: "red",
        });
      },
    });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ProtectedRoute>
      <Container size="xl" px="md" pb="xl">
        <Stack gap="md">
          <RecipeEditHeader
            title="Create New Recipe"
            mode="create"
            isPending={isPending}
            validationStatus={validationStatus}
            onSave={handleCreateRecipe}
            onBack={handleBack}
          />

          <EditRecipe form={form} />
        </Stack>
      </Container>
    </ProtectedRoute>
  );
}
