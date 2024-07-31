import {
  ActionIcon,
  Grid,
  NumberInput,
  Paper,
  TextInput,
  Textarea,
} from "@mantine/core";

import { IconTrash } from "@tabler/icons-react";
import InstructionStep from "src/common/types/InstructionStep";
import React from "react";
import Recipe from "src/common/types/Recipe";

interface EditRecipeInstructionsProps {
  recipe: Recipe;
  setRecipe: (recipe: Recipe) => void;
}

export default function EditRecipeInstructions({
  recipe,
  setRecipe,
}: EditRecipeInstructionsProps) {
  return (
    <Grid.Col span={12}>
      {recipe.instructions
        .sort((a, b) => a.step_number - b.step_number)
        .map((instructionStep: InstructionStep, index: number) => (
          <Paper shadow="sm" p="md" mb="sm">
            <Grid
              key={`ingredient-${index}`}
              justify="flex-start"
              align="flex-end"
            >
              <Grid.Col span={2}>
                <NumberInput
                  label="Step Number"
                  value={instructionStep.step_number}
                  withAsterisk
                  min={1}
                  onChange={(newValue) => {
                    const newInstructions = [...recipe.instructions];
                    newInstructions[index].step_number = newValue as number;
                    setRecipe({ ...recipe, instructions: newInstructions });
                  }}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="Title"
                  placeholder="Dice onions..."
                  value={instructionStep.title}
                  withAsterisk
                  onChange={(e) => {
                    const newInstructions = [...recipe.instructions];
                    newInstructions[index].title = e.currentTarget.value;
                    setRecipe({ ...recipe, instructions: newInstructions });
                  }}
                />
              </Grid.Col>

              <Grid.Col span={8}>
                <Textarea
                  label="Description"
                  placeholder="Using a 10in chef's knife, cut the onions into small pieces..."
                  withAsterisk
                  autosize
                  maxRows={8}
                  value={instructionStep.description}
                  onChange={(e) => {
                    const newInstructions = [...recipe.instructions];
                    newInstructions[index].description = e.currentTarget.value;
                    setRecipe({ ...recipe, instructions: newInstructions });
                  }}
                />
              </Grid.Col>

              <Grid.Col span={1}>
                <ActionIcon
                  variant="filled"
                  color="red"
                  aria-label="Gradient action icon"
                  onClick={() => {
                    const newInstructions = [...recipe.instructions];
                    // Update the step numbers of the remaining instructions
                    for (let i = index + 1; i < newInstructions.length; i++) {
                      newInstructions[i].step_number -= 1;
                    }
                    newInstructions.splice(index, 1);
                    setRecipe({ ...recipe, instructions: newInstructions });
                  }}
                >
                  <IconTrash style={{ width: 24, height: 24 }} />
                </ActionIcon>
              </Grid.Col>
            </Grid>
          </Paper>
        ))}
    </Grid.Col>
  );
}
