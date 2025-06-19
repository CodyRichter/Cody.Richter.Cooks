import DesktopSortableRecipeInstruction from "./DesktopSortableRecipeInstruction";
import InstructionStep from "@/common/types/InstructionStep";
import MobileSortableRecipeInstruction from "./MobileSortableRecipeInstruction";
import React from "react";
import Recipe from "@/common/types/Recipe";
import { useMediaQuery } from "@mantine/hooks";

export default function SortableRecipeInstruction({
  recipe,
  instructionStep,
  index,
  setRecipe,
}: {
  recipe: Recipe;
  instructionStep: InstructionStep;
  index: number;
  setRecipe: any;
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
