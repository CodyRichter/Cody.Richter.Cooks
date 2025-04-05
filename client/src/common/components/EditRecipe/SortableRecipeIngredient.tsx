import {
  ActionIcon,
  Button,
  Divider,
  Flex,
  Group,
  NumberInput,
  Popover,
  TextInput,
} from "@mantine/core";
import {
  IconExclamationMark,
  IconGripVertical,
  IconInfoCircle,
  IconTrash,
} from "@tabler/icons-react";

import { CSS } from "@dnd-kit/utilities";
import Ingredient from "@/common/types/Ingredient";
import React from "react";
import Recipe from "@/common/types/Recipe";
import { useSortable } from "@dnd-kit/sortable";

export default function SortableRecipeIngredient({
  recipe,
  ingredient,
  index,
  setRecipe,
}: {
  recipe: Recipe;
  ingredient: Ingredient;
  index: number;
  setRecipe: any;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: ingredient.id,
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
          paddingBottom: 10,
        }}
      >
        <NumberInput
          label="Quantity"
          value={ingredient.quantity}
          withAsterisk
          allowNegative={false}
          size="xs"
          radius="md"
          rightSection={<></>}
          style={{ width: 100 }}
          maxLength={10}
          minLength={1}
          onChange={(newValue) => {
            const newIngredients = [...recipe.ingredients];
            newIngredients[index].quantity = newValue as number;
            setRecipe({ ...recipe, ingredients: newIngredients });
          }}
        />

        <TextInput
          label="Units"
          placeholder="Tbsp..."
          value={ingredient.unit}
          size="xs"
          radius="md"
          style={{ width: 100 }}
          withAsterisk
          onChange={(e) => {
            const newIngredients = [...recipe.ingredients];
            newIngredients[index].unit = e.currentTarget.value;
            setRecipe({ ...recipe, ingredients: newIngredients });
          }}
        />

        <TextInput
          label="Name"
          placeholder="Onions..."
          value={ingredient.name}
          size="xs"
          radius="md"
          style={{ width: 200 }}
          withAsterisk
          onChange={(e) => {
            const newIngredients = [...recipe.ingredients];
            newIngredients[index].name = e.currentTarget.value;
            setRecipe({ ...recipe, ingredients: newIngredients });
          }}
        />

        <Popover width={250} position="right" withArrow trapFocus shadow="md">
          <Popover.Target>
            <ActionIcon variant="outline" color="gray">
              <IconInfoCircle style={{ width: 20, height: 20 }} />
            </ActionIcon>
          </Popover.Target>
          <Popover.Dropdown>
            <TextInput
              label="Additional Information"
              placeholder="[Optional] Can substitute with..."
              value={ingredient.subtext}
              size="xs"
              radius="md"
              onChange={(e) => {
                const newIngredients = [...recipe.ingredients];
                newIngredients[index].subtext = e.currentTarget.value;
                setRecipe({ ...recipe, ingredients: newIngredients });
              }}
            />
          </Popover.Dropdown>
        </Popover>

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
                const newIngredients = [...recipe.ingredients];
                newIngredients.splice(index, 1);
                setRecipe({ ...recipe, ingredients: newIngredients });
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
      </Flex>
    </Group>
  );
}
