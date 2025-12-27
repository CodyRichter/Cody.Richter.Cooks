import DesktopSortableRecipeIngredient from "@/components/recipes/edit/ingredients/DesktopSortableRecipeIngredient";
import MobileSortableRecipeIngredient from "@/components/recipes/edit/ingredients/MobileSortableRecipeIngredient";
import { RecipeDetail } from "@/types/Recipe";
import { useMediaQuery } from "@mantine/hooks";
import { UseFormReturnType } from "@mantine/form";
import { memo } from "react";

const SortableRecipeIngredient = memo(({
  form,
  index,
}: {
  form: UseFormReturnType<RecipeDetail>;
  index: number;
}) => {
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (isMobile) {
    return (
      <MobileSortableRecipeIngredient
        form={form}
        index={index}
      />
    );
  } else {
    return (
      <DesktopSortableRecipeIngredient
        form={form}
        index={index}
      />
    );
  }
});

SortableRecipeIngredient.displayName = 'SortableRecipeIngredient';

export default SortableRecipeIngredient;
