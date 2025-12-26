import { DndContext, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { InstructionStep } from "@/types/InstructionStep";
import React from "react";
import { RecipeDetail } from "@/types/Recipe";
import SortableRecipeInstruction from "@/components/recipes/edit/instructions/SortableRecipeInstruction";

interface EditRecipeInstructionsProps {
  recipe: RecipeDetail;
  setRecipe: (recipe: RecipeDetail) => void;
}

/**
 * The EditRecipeInstructions component is responsible for rendering the list of instructions
 * for a recipe. It allows users to drag and drop instructions to reorder them.
 * It uses the DnD Kit library for drag and drop functionality.
 */
export default function EditRecipeInstructions({
  recipe,
  setRecipe,
}: EditRecipeInstructionsProps) {
  const reorderInstructions = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!active || !over || !active.id || !over.id) {
      return;
    }
    if (active.id !== over.id) {
      setRecipe({
        ...recipe,
        instructions: arrayMove(
          recipe.instructions,
          recipe.instructions.findIndex(
            (instruction) => instruction.id === active.id
          ),
          recipe.instructions.findIndex(
            (instruction) => instruction.id === over.id
          )
        ),
      });
    }
  };

  return (
    <DndContext onDragEnd={reorderInstructions}>
      <SortableContext
        items={recipe.instructions}
        strategy={verticalListSortingStrategy}
      >
        {recipe.instructions.map(
          (instruction: InstructionStep, index: number) => (
            <SortableRecipeInstruction
              key={instruction.id}
              recipe={recipe}
              instructionStep={instruction}
              index={index}
              setRecipe={setRecipe}
            />
          )
        )}
      </SortableContext>
    </DndContext>
  );
}
