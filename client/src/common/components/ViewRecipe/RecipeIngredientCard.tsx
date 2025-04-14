import {
  ActionIcon,
  Card,
  Checkbox,
  CopyButton,
  Group,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconClipboardCheck, IconCopy } from "@tabler/icons-react";

import Ingredient from "@/common/types/Ingredient";
import React from "react";
import { convertToFractionalRepresentation } from "@/utils/recipeUtils";

export default function RecipeIngredientCard({
  ingredients,
}: {
  ingredients: Ingredient[];
}) {
  const formattedIngredientsAsString = ingredients
    .map((ingredient) => {
      const quantity = convertToFractionalRepresentation(ingredient.quantity);
      const unit = ingredient.unit ? `${ingredient.unit} ` : "";
      const name = ingredient.name;
      const subtext = ingredient.subtext ? ` (${ingredient.subtext})` : "";
      return `- ${quantity} ${unit}${name}${subtext}`;
    })
    .join("\n");

  return (
    <Card shadow="sm" radius="md" withBorder pb="lg">
      <Group gap="xs">
        <Title order={4}>Ingredients</Title>
        <CopyButton value={formattedIngredientsAsString} timeout={2000}>
          {({ copied, copy }) => (
            <Tooltip
              label={
                copied ? "Ingredients Copied to Clipboard!" : "Copy Ingredients"
              }
              withArrow
              position="right"
            >
              <ActionIcon
                color={copied ? "teal" : "gray"}
                variant="subtle"
                onClick={copy}
              >
                {copied ? (
                  <IconClipboardCheck size={16} />
                ) : (
                  <IconCopy size={16} />
                )}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </Group>

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
