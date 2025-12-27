'use client';

import { ActionIcon, Button, Group, Text, Container, Stack, Tooltip } from "@mantine/core";
import { useEffect, useMemo, useRef } from "react";
import { useForm, UseFormReturnType } from "@mantine/form";

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

  // No longer using formVersion state as it causes re-renders on every keystroke.
  // We'll use form.watch() in components that need reactivity.

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

  // Update mutation
  const { mutate: updateRecipe, isPending: isUpdating } = useUpdateRecipe();

  // Sync originalRecipe to form once loaded
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (originalRecipe && !hasInitialized.current) {
      form.initialize(originalRecipe);
      hasInitialized.current = true;
    }
  }, [originalRecipe, form]);

  // Check if user has permission to edit this recipe
  const hasPermission = useMemo(() => {
    return auth.isAuthenticated && canEdit;
  }, [auth.isAuthenticated, canEdit]);

  // Handle back navigation with optimistic updates
  const handleBackClick = () => {
    navigateToRecipe(recipe_id, form.getValues());
  };

  // Save the recipe to the server
  const handleSaveRecipe = async () => {
    const values = form.getValues();

    if (!isRecipeValid(values)) {
      notifications.show({
        title: "Invalid Recipe",
        message: "Please ensure all fields are filled out correctly before updating the recipe.",
        color: "red",
      });
      return;
    }

    // Convert RecipeDetail to RecipeUpdate format
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
        order_index: ing.order_index
      })),
      instructions: values.instructions.map((inst) => ({
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
        navigateToRecipe(values.id, values);
      },
      onError: (err) => {
        notifications.show({
          title: "Error Updating Recipe",
          message: err?.message || "Failed to update recipe. Please try again.",
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

  if (error || !originalRecipe) {
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

        <EditRecipe form={form} />

        <Group justify="flex-end">
          <SaveRecipeButton
            form={form}
            loading={isUpdating}
            onSave={handleSaveRecipe}
          />
        </Group>
      </Stack>
    </Container>
  );
}

/**
 * Optimized Save button component that only re-renders when necessary
 */
function SaveRecipeButton({
  form,
  loading,
  onSave,
}: {
  form: UseFormReturnType<RecipeDetail>;
  loading: boolean;
  onSave: () => void;
}) {
  // Subscribe this component to changes in these fields to update button state
  // Calling watch in the component body subscribes the component to re-renders
  form.watch('title', () => {});
  form.watch('description', () => {});
  form.watch('ingredients', () => {});
  form.watch('instructions', () => {});
  form.watch('cooking_time', () => {});
  form.watch('serving_size', () => {});
  form.watch('tags', () => {});

  const values = form.getValues();
  const isValid = isRecipeValid(values);
  const dirty = form.isDirty();

  return (
    <Button
      size="lg"
      radius="md"
      color="orange"
      variant="filled"
      w="200px"
      leftSection={<IconDeviceFloppy size={20} />}
      loading={loading}
      disabled={!isValid || loading || !dirty}
      onClick={onSave}
      style={{
        boxShadow: '0 4px 12px rgba(255, 145, 0, 0.2)',
      }}
    >
      Save Recipe
    </Button>
  );
}
