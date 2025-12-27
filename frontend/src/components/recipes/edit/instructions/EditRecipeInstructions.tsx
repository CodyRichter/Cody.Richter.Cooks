import { DndContext, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { InstructionStep } from "@/types/InstructionStep";
import { RecipeDetail } from "@/types/Recipe";
import SortableRecipeInstruction from "@/components/recipes/edit/instructions/SortableRecipeInstruction";
import { UseFormReturnType } from "@mantine/form";
import { useState, useCallback } from "react";

interface EditRecipeInstructionsProps {
  form: UseFormReturnType<RecipeDetail>;
}

/**
 * The EditRecipeInstructions component renders the sortable list of instructions.
 * Uses form.watch() to react to list changes (add/remove/reorder).
 */
export default function EditRecipeInstructions({
  form,
}: EditRecipeInstructionsProps) {
  // Track instructions list - updated by form.watch callback
  const [instructions, setInstructions] = useState<InstructionStep[]>(
    () => form.getValues().instructions
  );

  // Subscribe to instruction list changes
  form.watch('instructions', ({ value }) => {
    setInstructions(value);
  });

  const reorderInstructions = useCallback((e: DragEndEvent) => {
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
  }, [form]);

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
              instructionId={instruction.id}
            />
          )
        )}
      </SortableContext>
    </DndContext>
  );
}
