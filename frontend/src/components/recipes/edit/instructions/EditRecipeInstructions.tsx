'use client';

import { DndContext, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { InstructionStep } from "@/types/InstructionStep";
import { RecipeDetail } from "@/types/Recipe";
import SortableRecipeInstruction from "@/components/recipes/edit/instructions/SortableRecipeInstruction";
import { Box, Group, Text, UnstyledButton } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { IconPlus } from "@tabler/icons-react";

interface EditRecipeInstructionsProps {
  form: UseFormReturnType<RecipeDetail>;
}

/**
 * The EditRecipeInstructions component renders the sortable list of instructions.
 */
export default function EditRecipeInstructions({
  form,
}: EditRecipeInstructionsProps) {
  // Subscribe to instructions changes
  form.watch('instructions', () => {});

  const instructions = form.getValues().instructions || [];

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

  const handleAddFirst = () => {
    const currentRecipe = form.getValues();
    form.insertListItem('instructions', {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      step_number: (currentRecipe.instructions?.length || 0) + 1,
      recipe_id: currentRecipe.id,
    });
  };

  return (
    <Box>
      {instructions.length === 0 ? (
        <UnstyledButton
          onClick={handleAddFirst}
          p="lg"
          w="100%"
          ta="center"
          style={{
            border: '1px dashed var(--mantine-color-default-border)',
            borderRadius: 'var(--mantine-radius-md)',
            backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-7))',
            cursor: 'pointer',
            transition: 'border-color 150ms ease, background-color 150ms ease',
          }}
        >
          <Group justify="center" gap="xs">
            <IconPlus size={16} color="var(--mantine-color-orange-6)" />
            <Text size="sm" c="dimmed" fw={500}>
              Click to add your first instruction step
            </Text>
          </Group>
        </UnstyledButton>
      ) : (
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
      )}
    </Box>
  );
}
