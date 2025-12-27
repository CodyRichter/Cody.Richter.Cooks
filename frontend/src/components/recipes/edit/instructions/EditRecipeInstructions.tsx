import { DndContext, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { InstructionStep } from "@/types/InstructionStep";
import React from "react";
import { RecipeDetail } from "@/types/Recipe";
import SortableRecipeInstruction from "@/components/recipes/edit/instructions/SortableRecipeInstruction";
import { UseFormReturnType } from "@mantine/form";
import { memo } from "react";

interface EditRecipeInstructionsProps {
  form: UseFormReturnType<RecipeDetail>;
}

/**
 * The EditRecipeInstructions component is responsible for rendering the list of instructions
 * for a recipe. It allows users to drag and drop instructions to reorder them.
 * It uses the DnD Kit library for drag and drop functionality.
 */
const EditRecipeInstructions = memo(({
  form,
}: EditRecipeInstructionsProps) => {
  // Subscribe to changes in instructions to handle re-ordering and additions
  form.watch('instructions', () => {});
  const instructions = form.getValues().instructions;

  const reorderInstructions = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!active || !over || !active.id || !over.id) {
      return;
    }
    if (active.id !== over.id) {
      const currentInstructions = form.getValues().instructions;
      const from = currentInstructions.findIndex((ins) => ins.id === active.id);
      const to = currentInstructions.findIndex((ins) => ins.id === over.id);
      form.reorderListItem('instructions', { from, to });
    }
  };

  return (
    <DndContext onDragEnd={reorderInstructions}>
      <SortableContext
        items={instructions}
        strategy={verticalListSortingStrategy}
      >
        {instructions.map(
          (instruction: InstructionStep, index: number) => (
            <SortableRecipeInstruction
              key={instruction.id}
              form={form}
              index={index}
            />
          )
        )}
      </SortableContext>
    </DndContext>
  );
});

EditRecipeInstructions.displayName = 'EditRecipeInstructions';

export default EditRecipeInstructions;
