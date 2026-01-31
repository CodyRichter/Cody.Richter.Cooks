import DesktopSortableRecipeIngredient from "./DesktopSortableRecipeIngredient";
import Ingredient from "@/types/Ingredient";
import MobileSortableRecipeIngredient from "./MobileSortableRecipeIngredient";
import React from "react";
import Recipe from "@/types/Recipe";
import { useMediaQuery } from "@mantine/hooks";

export default function SortableRecipeIngredient({
  recipe,
  ingredient,
  index,
  setRecipe,
}: {
  recipe: Recipe;
  ingredient: Ingredient;
  index: number;
  setRecipe: any;
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
