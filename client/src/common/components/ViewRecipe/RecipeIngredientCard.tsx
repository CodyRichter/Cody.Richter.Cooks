import { Card, Checkbox, Group, Stack, Text, Title } from "@mantine/core";

import Ingredient from "@/common/types/Ingredient";
import React from "react";
import { convertToFractionalRepresentation } from "@/utils/recipeUtils";

export default function RecipeIngredientCard({
  ingredients,
}: {
  ingredients: Ingredient[];
}) {
  return (
    <Card shadow="sm" radius="md" withBorder pb="lg">
      <Title order={4}>Ingredients</Title>
      <Stack mt="sm">
        {ingredients.map((ingredient) => (
          <Group key={`ingredient-${ingredient.id}`} ml="md">
            <Checkbox
              label={`${convertToFractionalRepresentation(
                ingredient.quantity
              )} ${ingredient.unit} ${ingredient.name}`}
            />
            {ingredient.subtext && (
              <Text size="sm" c="dimmed">
                ({ingredient.subtext})
              </Text>
            )}
          </Group>
        ))}
      </Stack>
    </Card>
  );
}
