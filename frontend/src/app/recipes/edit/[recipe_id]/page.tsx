'use client';

import { Container, Stack } from "@mantine/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "@mantine/form";

import EditRecipe from "@/components/recipes/edit/EditRecipe";
import RecipeEditHeader, { AutoSaveStatus } from "@/components/recipes/edit/header/RecipeEditHeader";
import { ApiErrorAlert } from "@/components/error-handling";
import { RecipeDetail, RecipeUpdate } from "@/types/Recipe";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { RecipeEditSkeleton } from "@/components/loading";
import { getRecipeValidationStatus, isRecipeValid } from "@/utils/recipeUtils";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
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

/**
 * Serializes recipe state for change deduplication and dirty checking.
 */
function getRecipeSnapshot(recipe: RecipeDetail): string {
  return JSON.stringify({
    title: recipe.title?.trim() || '',
    description: recipe.description?.trim() || '',
    tags: [...(recipe.tags || [])].sort(),
    cooking_time: recipe.cooking_time ?? null,
    serving_size: recipe.serving_size ?? null,
    ingredients: (recipe.ingredients || []).map((ing) => ({
      name: ing.name?.trim() || '',
      quantity: Number(ing.quantity) || 0,
      unit: ing.unit?.trim() || '',
      subtext: ing.subtext?.trim() || '',
      order_index: Number(ing.order_index) || 0,
    })),
    instructions: (recipe.instructions || []).map((inst) => ({
      title: inst.title?.trim() || '',
      description: inst.description?.trim() || '',
      step_number: Number(inst.step_number) || 0,
      timing: Number(inst.timing) || 0,
    })),
  });
}

function toRecipeUpdate(values: RecipeDetail): RecipeUpdate {
  return {
    title: values.title,
    description: values.description,
    tags: values.tags,
    cooking_time: values.cooking_time,
    serving_size: values.serving_size,
    ingredients: values.ingredients.map((ing) => ({
      name: ing.name,
      quantity: Number(ing.quantity) || 0,
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
}

interface EditRecipeFormProps {
  recipe: RecipeDetail;
  isAdminOverride: boolean;
  authorName: string | null;
  onBack: (values: RecipeDetail) => void;
}

function EditRecipeForm({
  recipe,
  isAdminOverride,
  authorName,
  onBack,
}: EditRecipeFormProps) {
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(() =>
    recipe.updated_at ? new Date(recipe.updated_at) : new Date()
  );
  const initialSnapshot = useMemo(() => getRecipeSnapshot(recipe), [recipe]);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string>(initialSnapshot);
  const [currentSnapshot, setCurrentSnapshot] = useState<string>(initialSnapshot);

  const form = useForm<RecipeDetail>({
    mode: 'uncontrolled',
    initialValues: recipe,
    validate: {
      title: (value: string) => (value?.trim().length < 3 ? 'Title must be at least 3 characters' : null),
    },
  });

  const [validationStatus, setValidationStatus] = useState(() =>
    getRecipeValidationStatus(recipe)
  );

  const { mutateAsync: updateRecipe } = useUpdateRecipe();

  const saveRecipe = useCallback(async (values: RecipeDetail, snapshot: string) => {
    setAutoSaveStatus('saving');
    try {
      await updateRecipe({ id: values.id, ...toRecipeUpdate(values) });
      setLastSavedSnapshot(snapshot);
      setAutoSaveStatus('saved');
      setLastSavedAt(new Date());
    } catch {
      setAutoSaveStatus('error');
    }
  }, [updateRecipe]);

  // Update validation, snapshot, and unsaved state when form values change
  const handleFormChange = useCallback(() => {
    const values = form.getValues();
    setValidationStatus(getRecipeValidationStatus(values));
    const nextSnapshot = getRecipeSnapshot(values);
    setCurrentSnapshot(nextSnapshot);
    setAutoSaveStatus((prev) => {
      if (nextSnapshot === lastSavedSnapshot) {
        return prev === 'unsaved' ? 'saved' : prev;
      }
      return 'unsaved';
    });
  }, [form, lastSavedSnapshot]);

  // Set up form watchers
  form.watch('title', handleFormChange);
  form.watch('description', handleFormChange);
  form.watch('tags', handleFormChange);
  form.watch('cooking_time', handleFormChange);
  form.watch('serving_size', handleFormChange);
  form.watch('ingredients', handleFormChange);
  form.watch('instructions', handleFormChange);

  // Auto-save effect
  useEffect(() => {
    if (!currentSnapshot || currentSnapshot === lastSavedSnapshot) return;

    const values = form.getValues();
    if (!values.id || !isRecipeValid(values)) {
      return;
    }

    const timer = setTimeout(() => saveRecipe(values, currentSnapshot), 1200);

    return () => clearTimeout(timer);
  }, [currentSnapshot, lastSavedSnapshot, form, saveRecipe]);

  // Performs manual Cmd+S save
  const performManualSave = useCallback(async () => {
    const values = form.getValues();
    if (!values.id || !isRecipeValid(values)) {
      return;
    }

    const snap = getRecipeSnapshot(values);
    if (snap === lastSavedSnapshot) {
      return;
    }

    await saveRecipe(values, snap);
  }, [form, lastSavedSnapshot, saveRecipe]);

  // Keyboard shortcut: Cmd+S / Ctrl+S to trigger immediate save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        performManualSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [performManualSave]);

  return (
    <Container size="xl" px="md" pb="xl">
      <Stack gap="md">
        <RecipeEditHeader
          title="Edit Recipe"
          mode="edit"
          validationStatus={validationStatus}
          autoSaveStatus={autoSaveStatus}
          lastSavedAt={lastSavedAt}
          backHref={`/recipes/view/${recipe.id}`}
          onBack={() => onBack(form.getValues())}
          isAdminOverride={isAdminOverride}
          authorName={authorName}
        />
        <EditRecipe form={form} />
      </Stack>
    </Container>
  );
}

function EditRecipeLoader() {
  const params = useParams();
  const queryClient = useQueryClient();
  const recipe_id = params?.recipe_id as string;

  const { data: originalRecipe, isLoading, error, refetch } = useRecipe(recipe_id);

  const { canEdit, isAdminOverride, isLoading: isPermissionsLoading } = useUserRecipePermissions(recipe_id);
  const { data: permissions } = useRecipePermissions(recipe_id);

  const authorName = useMemo(() => {
    if (!permissions || !Array.isArray(permissions)) return null;
    const owner = permissions.find((p) => p.role === 'owner');
    return owner ? owner.user_username : null;
  }, [permissions]);

  const normalizedRecipe = useMemo<RecipeDetail | null>(() => {
    if (!originalRecipe) return null;
    return {
      ...originalRecipe,
      instructions: (originalRecipe.instructions || []).map((inst) => ({
        ...inst,
        description: cleanDescriptionForEditing(inst.description),
      })),
    };
  }, [originalRecipe]);

  // The view page renders from this cache, so it shows edits that haven't been refetched yet
  const handleBackClick = useCallback((values: RecipeDetail) => {
    queryClient.setQueryData(['recipe', recipe_id], values);
  }, [queryClient, recipe_id]);

  if (isLoading || isPermissionsLoading) {
    return <RecipeEditSkeleton />;
  }

  if (!canEdit) {
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

  if (error || !normalizedRecipe) {
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
    <EditRecipeForm
      key={normalizedRecipe.id}
      recipe={normalizedRecipe}
      isAdminOverride={isAdminOverride}
      authorName={authorName}
      onBack={handleBackClick}
    />
  );
}

export default function EditRecipePage() {
  return (
    <ProtectedRoute fallback={<RecipeEditSkeleton />}>
      <EditRecipeLoader />
    </ProtectedRoute>
  );
}
