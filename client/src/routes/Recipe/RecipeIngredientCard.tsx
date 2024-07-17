import { Checkbox, Group, Stack, Text } from "@mantine/core";

import Ingredient from "src/common/types/Ingredient";
import React from "react";

export default function RecipeIngredientCard({
  ingredients,
}: {
  ingredients: Ingredient[];
}) {
  return (
    <Stack ml="md">
      <Text size="lg">Ingredients</Text>

      {ingredients.map((ingredient) => (
        <Group key={`ingredient-${ingredient.id}`} ml="md">
          <Checkbox>{ingredient.name}</Checkbox>
          <Text size="sm">
            {ingredient.quantity} {ingredient.unit} {ingredient.name}
          </Text>
          {ingredient.subtext && (
            <Text size="sm" c="dimmed" ml="sm">
              ({ingredient.subtext})
            </Text>
          )}
        </Group>
      ))}
    </Stack>
  );
}
