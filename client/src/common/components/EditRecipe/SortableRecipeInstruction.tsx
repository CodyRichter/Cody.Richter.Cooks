import {
  ActionIcon,
  Button,
  Flex,
  Group,
  Popover,
  Stack,
  TextInput,
  Textarea,
  em,
} from "@mantine/core";
import {
  IconExclamationMark,
  IconGripVertical,
  IconTrash,
} from "@tabler/icons-react";

import { CSS } from "@dnd-kit/utilities";
import InstructionStep from "@/common/types/InstructionStep";
import React from "react";
import Recipe from "@/common/types/Recipe";
import { useMediaQuery } from "@mantine/hooks";
import { useSortable } from "@dnd-kit/sortable";

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
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: instructionStep.id,
    });

  const isMobile = useMediaQuery(`(max-width: ${em(750)})`);

  return (
    <Group
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(
          transform ? { ...transform, x: 0 } : null
        ),
        transition: transition,
      }}
      className="sortableItem"
    >
      <Stack gap="xs">
        <ActionIcon
          variant="subtle"
          color="gray"
          className="sortableMoveIcon"
          {...attributes}
          {...listeners}
        >
          <IconGripVertical size={30} />
        </ActionIcon>
      </Stack>

      <Flex
        mih={55}
        gap="md"
        justify="flex-start"
        align="flex-end"
        direction="row"
        wrap="wrap"
        style={{
          borderBottom: "1px solid #e0e0e0",
          paddingBottom: 20,
          paddingTop: 10,
        }}
      >
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
                Delete Step {instructionStep.title}
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
    </Group>
  );
}
