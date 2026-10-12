import DesktopSortableRecipeIngredient from "@/components/recipes/edit/ingredients/DesktopSortableRecipeIngredient";
import MobileSortableRecipeIngredient from "@/components/recipes/edit/ingredients/MobileSortableRecipeIngredient";
import { RecipeDetail } from "@/types/Recipe";
import { useMediaQuery } from "@mantine/hooks";
import { UseFormReturnType } from "@mantine/form";

interface SortableRecipeIngredientProps {
  form: UseFormReturnType<RecipeDetail>;
  index: number;
  ingredientId: string;
}

/**
 * Responsive wrapper that renders the appropriate sortable ingredient component.
 * memo() is not used here since the form prop doesn't benefit from memoization.
 */
export default function SortableRecipeIngredient({
  form,
  index,
  ingredientId,
}: SortableRecipeIngredientProps) {
  // Only rendered client-side behind ProtectedRoute, so the real value is safe on first render
  const isMobile = useMediaQuery("(max-width: 768px)", false, { getInitialValueInEffect: false });

  if (isMobile) {
    return (
      <MobileSortableRecipeIngredient
        form={form}
        index={index}
        ingredientId={ingredientId}
      />
    );
  }

  return (
    <DesktopSortableRecipeIngredient
      form={form}
      index={index}
      ingredientId={ingredientId}
    />
  );
}
