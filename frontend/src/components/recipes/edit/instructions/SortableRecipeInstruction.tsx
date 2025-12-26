import DesktopSortableRecipeInstruction from "@/components/recipes/edit/instructions/DesktopSortableRecipeInstruction";
import { InstructionStep } from "@/types/InstructionStep";
import MobileSortableRecipeInstruction from "@/components/recipes/edit/instructions/MobileSortableRecipeInstruction";
import React from "react";
import { RecipeDetail } from "@/types/Recipe";
import { useMediaQuery } from "@mantine/hooks";

export default function SortableRecipeInstruction({
  recipe,
  instructionStep,
  index,
  setRecipe,
}: {
  recipe: RecipeDetail;
  instructionStep: InstructionStep;
  index: number;
  setRecipe: (recipe: RecipeDetail) => void;
}) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (isMobile) {
    return (
      <MobileSortableRecipeInstruction
        recipe={recipe}
        instructionStep={instructionStep}
        index={index}
        setRecipe={setRecipe}
      />
    );
  }

  return (
    <DesktopSortableRecipeInstruction
      recipe={recipe}
      instructionStep={instructionStep}
      index={index}
      setRecipe={setRecipe}
    />
  );
}
