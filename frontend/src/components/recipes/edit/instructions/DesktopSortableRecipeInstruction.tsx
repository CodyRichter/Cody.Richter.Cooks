import {
  ActionIcon,
  Button,
  Flex,
  Group,
  Popover,
  TextInput,
  Textarea,
} from "@mantine/core";
import {
  IconExclamationMark,
  IconGripVertical,
  IconTrash,
} from "@tabler/icons-react";

import { CSS } from "@dnd-kit/utilities";
import InstructionStep from "@/types/InstructionStep";
import React from "react";
import Recipe, { RecipeDetail } from "@/types/Recipe";
import { useSortable } from "@dnd-kit/sortable";

export default function DesktopSortableRecipeInstruction({
  recipe,
  instructionStep,
  index,
  setRecipe,
}: {
  recipe: RecipeDetail;
  instructionStep: InstructionStep;
  index: number;
  setRecipe: (recipe: RecipeDetail) => void;
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
      className="sortableItem"
    >
      <ActionIcon
        variant="subtle"
        color="gray"
        className="sortableMoveIcon"
        {...attributes}
        {...listeners}
        style={{
          height: 80,
          width: 30,
          borderRadius: 8,
        }}
      >
        <IconGripVertical size={24} />
      </ActionIcon>

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
          width: "80%",
        }}
      >
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
          value={instructionStep.description}
          onChange={(e) => {
            const newInstructions = [...recipe.instructions];
            newInstructions[index].description = e.currentTarget.value;
            setRecipe({ ...recipe, instructions: newInstructions });
          }}
        />
      </Flex>
      <Popover position="left" withArrow trapFocus shadow="md">
        <Popover.Target>
          <ActionIcon
            variant="outline"
            color="red"
            size="md"
            style={{
              height: 70, // Full height of the row
              borderRadius: 8,
            }}
          >
            <IconTrash size={20} />
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
    </Group>
  );
}
