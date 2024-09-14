import {
  ActionIcon,
  Grid,
  NumberInput,
  Paper,
  TextInput,
  Textarea,
  em,
} from "@mantine/core";

import { IconTrash } from "@tabler/icons-react";
import InstructionStep from "@/common/types/InstructionStep";
import React from "react";
import Recipe from "@/common/types/Recipe";
import { useMediaQuery } from "@mantine/hooks";

interface EditRecipeInstructionsProps {
  recipe: Recipe;
  setRecipe: (recipe: Recipe) => void;
}

export default function EditRecipeInstructions({
  recipe,
  setRecipe,
}: EditRecipeInstructionsProps) {
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`);

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
              <Grid.Col span={{ base: 8, sm: 2 }}>
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
              <Grid.Col span={{ base: 12, sm: 6 }}>
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

              <Grid.Col span={{ base: 12, sm: 8 }}>
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

              <Grid.Col span={{ base: 12, sm: 1 }}>
                <ActionIcon
                  variant="filled"
                  color="red"
                  w={isMobile ? "100%" : "auto"}
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
