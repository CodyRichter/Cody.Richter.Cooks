'use client';

import { Container, Stack } from "@mantine/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "@mantine/form";

import EditRecipe from "@/components/recipes/edit/EditRecipe";
import RecipeEditHeader, { AutoSaveStatus } from "@/components/recipes/edit/header/RecipeEditHeader";
import { ApiErrorAlert } from "@/components/error-handling";
import { RecipeDetail, RecipeUpdate } from "@/types/Recipe";
import RecipeLoadingSkeleton from "@/components/recipes/view/RecipeLoadingSkeleton";
import { getRecipeValidationStatus, isRecipeValid } from "@/utils/recipeUtils";
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "next/navigation";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useRecipe } from "@/hooks/useRecipes";
import { useRecipePermissions, useUserRecipePermissions } from "@/hooks/useRecipePermissions";
import { recipeApi } from "@/services/apiServices";

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

  // Auto-save state
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const lastSavedSnapshotRef = useRef<string>('');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      lastSavedSnapshotRef.current = getRecipeSnapshot(normalizedRecipe);
      setAutoSaveStatus('saved');
      setLastSavedAt(new Date(normalizedRecipe.updated_at || Date.now()));
      hasInitialized.current = true;
    }
  }, [originalRecipe, form]);

  // Performs background auto-save or manual Cmd+S save
  const performAutoSave = useCallback(async () => {
    const values = form.getValues();
    if (!values.id || !isRecipeValid(values)) {
      return;
    }

    const currentSnapshot = getRecipeSnapshot(values);
    if (currentSnapshot === lastSavedSnapshotRef.current) {
      return;
    }

    setAutoSaveStatus('saving');

    const updateData: RecipeUpdate = {
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

    try {
      await recipeApi.updateRecipe(values.id, updateData);
      lastSavedSnapshotRef.current = getRecipeSnapshot(form.getValues());
      setAutoSaveStatus('saved');
      setLastSavedAt(new Date());
    } catch {
      setAutoSaveStatus('error');
    }
  }, [form]);

  // Watch for form changes to trigger debounced auto-save and update validation HUD
  const handleFormChange = useCallback(() => {
    if (!hasInitialized.current) return;

    const values = form.getValues();
    setValidationStatus(getRecipeValidationStatus(values));

    const currentSnapshot = getRecipeSnapshot(values);
    if (currentSnapshot === lastSavedSnapshotRef.current) {
      if (autoSaveStatus === 'unsaved') {
        setAutoSaveStatus('saved');
      }
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      return;
    }

    // Mark as unsaved
    setAutoSaveStatus('unsaved');

    // Debounce auto-save (1200ms)
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      performAutoSave();
    }, 1200);
  }, [form, autoSaveStatus, performAutoSave]);

  // Set up form watchers in an effect to avoid reading refs during render
  useEffect(() => {
    const unsubscribers = [
      form.watch('title', handleFormChange),
      form.watch('description', handleFormChange),
      form.watch('tags', handleFormChange),
      form.watch('cooking_time', handleFormChange),
      form.watch('serving_size', handleFormChange),
      form.watch('ingredients', handleFormChange),
      form.watch('instructions', handleFormChange),
    ];

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [form, handleFormChange]);

  // Keyboard shortcut: Cmd+S / Ctrl+S to trigger immediate save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
          autoSaveTimerRef.current = null;
        }
        performAutoSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [performAutoSave]);

  // Clean up auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const hasPermission = auth.isAuthenticated && canEdit;

  const handleBackClick = () => {
    navigateToRecipe(recipe_id, form.getValues());
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
          validationStatus={validationStatus}
          autoSaveStatus={autoSaveStatus}
          lastSavedAt={lastSavedAt}
          onBack={handleBackClick}
          isAdminOverride={isAdminOverride}
          authorName={authorName}
        />
        <EditRecipe form={form} />
      </Stack>
    </Container>
  );
}
