'use client';

import { Container, Stack } from "@mantine/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "@mantine/form";

import EditRecipe from "@/components/recipes/edit/EditRecipe";
import RecipeEditHeader from "@/components/recipes/edit/header/RecipeEditHeader";
import { ApiErrorAlert } from "@/components/error-handling";
import { RecipeDetail, RecipeUpdate } from "@/types/Recipe";
import RecipeLoadingSkeleton from "@/components/recipes/view/RecipeLoadingSkeleton";
import { getRecipeValidationStatus, isRecipeValid } from "@/utils/recipeUtils";
import { notifications } from "@mantine/notifications";
import { formatNotificationError } from "@/utils/notificationUtils";
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "next/navigation";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useRecipe, useUpdateRecipe } from "@/hooks/useRecipes";
import { useRecipePermissions, useUserRecipePermissions } from "@/hooks/useRecipePermissions";

/**
 * Normalizes instruction description by stripping raw HTML paragraph/break tags into plain text for editing.
 */
function cleanDescriptionForEditing(desc?: string): string {
  if (!desc) return '';
  return desc
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>\s*<p>/gi, '\n\n')
    .replace(/<p>/gi, '')
    .replace(/<\/p>/gi, '')
    .trim();
}

export default function EditRecipePage() {
  const params = useParams();
  const { navigateToRecipe } = useAppNavigation();
  const auth = useAuth();
  const recipe_id = params?.recipe_id as string;

  // Load the recipe data
  const { data: originalRecipe, isLoading, error, refetch } = useRecipe(recipe_id);

  // Get user permissions for this recipe
  const { canEdit, isAdminOverride } = useUserRecipePermissions(recipe_id);
  const { data: permissions } = useRecipePermissions(recipe_id);

  const authorName = useMemo(() => {
    if (!permissions || !Array.isArray(permissions)) return null;
    const owner = permissions.find((p) => p.role === 'owner');
    return owner ? owner.user_username : null;
  }, [permissions]);

  // Initialize form
  const form = useForm<RecipeDetail>({
    mode: 'uncontrolled',
    initialValues: originalRecipe || {
      id: '',
      title: '',
      description: '',
      tags: [],
      ingredients: [],
      instructions: [],
      cooking_time: undefined,
      serving_size: undefined,
      created_at: '',
      updated_at: '',
    },
    validate: {
      title: (value: string) => (value?.trim().length < 3 ? 'Title must be at least 3 characters' : null),
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

  // Update mutation
  const { mutate: updateRecipe, isPending: isUpdating } = useUpdateRecipe();

  // Sync originalRecipe to form once loaded (with normalized instruction descriptions)
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (originalRecipe && !hasInitialized.current) {
      const normalizedRecipe: RecipeDetail = {
        ...originalRecipe,
        instructions: (originalRecipe.instructions || []).map((inst) => ({
          ...inst,
          description: cleanDescriptionForEditing(inst.description),
        })),
      };
      form.initialize(normalizedRecipe);
      setValidationStatus(getRecipeValidationStatus(normalizedRecipe));
      hasInitialized.current = true;
    }
  }, [originalRecipe, form]);

  const hasPermission = auth.isAuthenticated && canEdit;

  const handleBackClick = () => {
    navigateToRecipe(recipe_id, form.getValues());
  };

  const handleSaveRecipe = async () => {
    const values = form.getValues();

    if (!isRecipeValid(values)) {
      notifications.show({
        title: "Incomplete Recipe",
        message: "Please ensure all required fields are filled out correctly before saving.",
        color: "red",
      });
      return;
    }

    const updateData: RecipeUpdate & { id: string } = {
      id: values.id,
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

    updateRecipe(updateData, {
      onSuccess: () => {
        notifications.show({
          title: "Recipe Updated",
          message: "The recipe has been updated successfully.",
          color: "teal",
        });
        navigateToRecipe(values.id, values);
      },
      onError: (err) => {
        notifications.show({
          title: "Error Updating Recipe",
          message: formatNotificationError(err),
          color: "red",
        });
      },
    });
  };

  if (isLoading) {
    return <RecipeLoadingSkeleton />;
  }

  if (!hasPermission) {
    const permissionError = new Error('You do not have permission to edit this recipe.');
    return (
      <Container size="xl" py="xl">
        <ApiErrorAlert
          error={permissionError}
          showRetry={false}
          title="Access Denied"
        />
      </Container>
    );
  }

  if (error || !originalRecipe) {
    return (
      <Container size="xl" py="xl">
        <ApiErrorAlert
          error={error}
          onRetry={refetch}
          title="Failed to load recipe"
        />
      </Container>
    );
  }

  return (
    <Container size="xl" px="md" pb="xl">
      <Stack gap="md">
        <RecipeEditHeader
          title="Edit Recipe"
          mode="edit"
          isPending={isUpdating}
          validationStatus={validationStatus}
          onSave={handleSaveRecipe}
          onBack={handleBackClick}
          isAdminOverride={isAdminOverride}
          authorName={authorName}
        />

        <EditRecipe form={form} />
      </Stack>
    </Container>
  );
}
