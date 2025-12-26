import DesktopSortableRecipeIngredient from "@/components/recipes/edit/ingredients/DesktopSortableRecipeIngredient";
import { Ingredient } from "@/types/Ingredient";
import MobileSortableRecipeIngredient from "@/components/recipes/edit/ingredients/MobileSortableRecipeIngredient";
import { RecipeDetail } from "@/types/Recipe";
import { useMediaQuery } from "@mantine/hooks";

export default function SortableRecipeIngredient({
  recipe,
  ingredient,
  index,
  setRecipe,
}: {
  recipe: RecipeDetail;
  ingredient: Ingredient;
  index: number;
  setRecipe: (recipe: RecipeDetail) => void;
}) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (isMobile) {
    return (
      <MobileSortableRecipeIngredient
        recipe={recipe}
        ingredient={ingredient}
        index={index}
        setRecipe={setRecipe}
      />
    );
  } else {
    return (
      <DesktopSortableRecipeIngredient
        recipe={recipe}
        ingredient={ingredient}
        index={index}
        setRecipe={setRecipe}
      />
    );
  }
}
