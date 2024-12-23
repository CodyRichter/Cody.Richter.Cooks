import {
  ActionIcon,
  Button,
  Divider,
  Flex,
  NumberInput,
  Popover,
  TextInput,
} from "@mantine/core";
import {
  IconExclamationMark,
  IconInfoCircle,
  IconTrash,
} from "@tabler/icons-react";

import Ingredient from "@/common/types/Ingredient";
import React from "react";
import Recipe from "@/common/types/Recipe";

interface EditRecipeIngredientsProps {
  recipe: Recipe;
  setRecipe: (recipe: Recipe) => void;
}

export default function EditRecipeIngredients({
  recipe,
  setRecipe,
}: EditRecipeIngredientsProps) {
  return recipe.ingredients.map((ingredient: Ingredient, index: number) => (
    <>
      <Flex
        mih={65}
        key={`ingredient-${index}`}
        gap="md"
        justify="flex-start"
        align="flex-end"
        direction="row"
        wrap="wrap"
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
      <Divider mt="xl" mb="xl" />
    </>
  ));
}
