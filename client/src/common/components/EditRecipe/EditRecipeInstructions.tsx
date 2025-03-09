import {
  ActionIcon,
  Button,
  Divider,
  Flex,
  NumberInput,
  Popover,
  TextInput,
  Textarea,
  em,
} from "@mantine/core";
import { IconExclamationMark, IconTrash } from "@tabler/icons-react";

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

  return recipe.instructions
    .sort((a, b) => a.step_number - b.step_number)
    .map((instructionStep: InstructionStep, index: number) => (
      <div key={`instruction-${instructionStep.id}`}>
        <Flex
          mih={150}
          gap="md"
          justify="flex-start"
          align="flex-end"
          direction="row"
          wrap="wrap"
          mb="lg"
        >
          <NumberInput
            label="Step #"
            value={instructionStep.step_number}
            withAsterisk
            allowNegative={false}
            min={1}
            size="sm"
            radius="md"
            rightSection={<></>}
            style={{ width: 55 }}
            maxLength={3}
            minLength={1}
            onChange={(newValue) => {
              const newInstructions = [...recipe.instructions];
              newInstructions[index].step_number = newValue as number;
              setRecipe({ ...recipe, instructions: newInstructions });
            }}
          />
          <TextInput
            label="Title"
            placeholder="Dice onions..."
            value={instructionStep.title}
            size="sm"
            radius="md"
            style={{ width: 500 }}
            withAsterisk
            onChange={(e) => {
              const newInstructions = [...recipe.instructions];
              newInstructions[index].title = e.currentTarget.value;
              setRecipe({ ...recipe, instructions: newInstructions });
            }}
          />

          {/* On desktop, the delete button is displayed as an icon with a popover confirmation */}
          {!isMobile && (
            <Popover position="right" withArrow trapFocus shadow="md">
              <Popover.Target>
                <ActionIcon
                  variant="outline"
                  color="red"
                  aria-label="Gradient action icon"
                >
                  <IconTrash style={{ width: 20, height: 20 }} />
                </ActionIcon>
              </Popover.Target>
              <Popover.Dropdown>
                <Button
                  color="red"
                  onClick={() => {
                    const newInstructions = [...recipe.instructions];
                    // Update the step numbers of the remaining instructions
                    for (let i = index + 1; i < newInstructions.length; i++) {
                      newInstructions[i].step_number -= 1;
                    }
                    newInstructions.splice(index, 1);
                    setRecipe({ ...recipe, instructions: newInstructions });
                  }}
                  rightSection={
                    <IconExclamationMark style={{ width: 20, height: 20 }} />
                  }
                  leftSection={
                    <IconExclamationMark style={{ width: 20, height: 20 }} />
                  }
                >
                  Confirm Delete
                </Button>
              </Popover.Dropdown>
            </Popover>
          )}
          <Textarea
            label="Description"
            placeholder="Using a 10in chef's knife, cut the onions into small pieces..."
            withAsterisk
            autosize
            size="sm"
            radius="md"
            style={{ width: isMobile ? "100%" : "85%" }}
            maxRows={8}
            value={instructionStep.description}
            onChange={(e) => {
              const newInstructions = [...recipe.instructions];
              newInstructions[index].description = e.currentTarget.value;
              setRecipe({ ...recipe, instructions: newInstructions });
            }}
          />
          {/* On mobile, the delete button is displayed at the bottom of the section and in full width */}
          {isMobile && (
            <Popover position="bottom" withArrow trapFocus shadow="md">
              <Popover.Target>
                <Button
                  fullWidth
                  color="red"
                  variant="outline"
                  size="xs"
                  leftSection={<IconTrash style={{ width: 20, height: 20 }} />}
                >
                  Delete Step {instructionStep.step_number}
                </Button>
              </Popover.Target>
              <Popover.Dropdown>
                <Button
                  color="red"
                  onClick={() => {
                    const newInstructions = [...recipe.instructions];
                    // Update the step numbers of the remaining instructions
                    for (let i = index + 1; i < newInstructions.length; i++) {
                      newInstructions[i].step_number -= 1;
                    }
                    newInstructions.splice(index, 1);
                    setRecipe({ ...recipe, instructions: newInstructions });
                  }}
                  rightSection={
                    <IconExclamationMark style={{ width: 20, height: 20 }} />
                  }
                  leftSection={
                    <IconExclamationMark style={{ width: 20, height: 20 }} />
                  }
                >
                  Confirm Delete
                </Button>
              </Popover.Dropdown>
            </Popover>
          )}
        </Flex>
        <Divider mt="md" />
      </div>
    ));
}
