import {
  Accordion,
  ActionIcon,
  Button,
  Flex,
  Group,
  Popover,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import {
  IconExclamationMark,
  IconGripVertical,
  IconPencilExclamation,
  IconTrash,
} from "@tabler/icons-react";

import { CSS } from "@dnd-kit/utilities";
import InstructionStep from "@/common/types/InstructionStep";
import React from "react";
import Recipe from "@/common/types/Recipe";
import { useSortable } from "@dnd-kit/sortable";

export default function MobileSortableRecipeInstruction({
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
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: instructionStep.id,
    });

  return (
    <Group
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(
          transform ? { ...transform, x: 0 } : null
        ),
        transition: transition,
      }}
      mt="sm"
      mb="sm"
    >
      <ActionIcon
        variant="subtle"
        color="gray"
        className="sortableMoveIcon"
        {...attributes}
        {...listeners}
      >
        <IconGripVertical size={24} />
      </ActionIcon>
      <Stack
        gap="sm"
        style={{
          width: "85%",
        }}
      >
        <Accordion variant="separated">
          <Accordion.Item value="instruction-details">
            <Accordion.Control>
              {instructionStep.title && instructionStep.description ? (
                <Text>{instructionStep.title}</Text>
              ) : (
                <Group>
                  <IconPencilExclamation size={20} color="red" />
                  <Text c="red">Details Missing...</Text>
                </Group>
              )}
            </Accordion.Control>

            <Accordion.Panel>
              <TextInput
                label="Title"
                placeholder="Dice onions..."
                value={instructionStep.title}
                size="sm"
                radius="md"
                style={{ width: "100%" }}
                withAsterisk
                onChange={(e) => {
                  const newInstructions = [...recipe.instructions];
                  newInstructions[index].title = e.currentTarget.value;
                  setRecipe({ ...recipe, instructions: newInstructions });
                }}
              />

              <Textarea
                label="Description"
                placeholder="Using a 10in chef's knife, cut the onions into small pieces..."
                withAsterisk
                autosize
                size="sm"
                radius="md"
                style={{ width: "100%" }}
                maxRows={8}
                minRows={2}
                mt="sm"
                value={instructionStep.description}
                onChange={(e) => {
                  const newInstructions = [...recipe.instructions];
                  newInstructions[index].description = e.currentTarget.value;
                  setRecipe({ ...recipe, instructions: newInstructions });
                }}
              />

              <Flex gap="sm" justify="flex-start" mt="sm">
                <Popover position="bottom" withArrow trapFocus shadow="md">
                  <Popover.Target>
                    <Button
                      variant="outline"
                      color="red"
                      size="xs"
                      leftSection={<IconTrash size={18} />}
                      style={{ width: "100%" }}
                    >
                      Delete
                    </Button>
                  </Popover.Target>
                  <Popover.Dropdown>
                    <Button
                      color="red"
                      onClick={() => {
                        const newInstructions = [...recipe.instructions];
                        newInstructions.splice(index, 1);
                        setRecipe({ ...recipe, instructions: newInstructions });
                      }}
                      rightSection={
                        <IconExclamationMark
                          style={{ width: 20, height: 20 }}
                        />
                      }
                      leftSection={
                        <IconExclamationMark
                          style={{ width: 20, height: 20 }}
                        />
                      }
                    >
                      Confirm Delete
                    </Button>
                  </Popover.Dropdown>
                </Popover>
              </Flex>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Stack>
    </Group>
  );
}
