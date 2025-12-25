import {
  ActionIcon,
  Checkbox,
  CopyButton,
  Divider,
  Group,
  SegmentedControl,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconCheck, IconClipboardCheck, IconCopy } from "@tabler/icons-react";
import React, { useState } from "react";

import Ingredient from "@/types/Ingredient";
import { convertToFractionalRepresentation } from "@/utils/recipeUtils";
import { useMediaQuery } from "@mantine/hooks";

interface RecipeIngredientCardProps {
  ingredients: Ingredient[];
  scaleFactor?: number;
  setScaleFactor?: (scaleFactor: number) => void;
}

function ChangeScaleFactorMobile({
  scaleFactor,
  setScaleFactor,
  setIsEditingScaleFactor,
}: {
  scaleFactor: number;
  setScaleFactor?: (scaleFactor: number) => void;
  setIsEditingScaleFactor: (isEditingScaleFactor: boolean) => void;
}) {
  return (
    <Group gap="xs" key="scale-slider-group-mobile">
      <SegmentedControl
        value={scaleFactor.toString()}
        onChange={(value) => setScaleFactor?.(parseFloat(value))}
        color="blue"
        size="sm"
        data={[
          { label: "1", value: "1" },
          { label: "2", value: "2" },
          { label: "3", value: "3" },
          { label: "4", value: "4" },
          { label: "5", value: "5" },
        ]}
      />

      <Divider orientation="vertical" />

      <ActionIcon
        onClick={() => setIsEditingScaleFactor(false)}
        variant="subtle"
      >
        <IconCheck size={16} />
      </ActionIcon>
    </Group>
  );
}

function ChangeScaleFactorDesktop({
  scaleFactor,
  setScaleFactor,
  setIsEditingScaleFactor,
}: {
  scaleFactor: number;
  setScaleFactor?: (scaleFactor: number) => void;
  setIsEditingScaleFactor: (isEditingScaleFactor: boolean) => void;
}) {
  return (
    <Group gap="xs" key="scale-slider-group-desktop">
      <SegmentedControl
        value={scaleFactor.toString()}
        onChange={(value) => setScaleFactor?.(parseFloat(value))}
        color="blue"
        size="sm"
        data={[
          { label: "1x", value: "1" },
          { label: "2x", value: "2" },
          { label: "3x", value: "3" },
          { label: "4x", value: "4" },
          { label: "5x", value: "5" },
        ]}
      />

      <Divider orientation="vertical" />

      <ActionIcon
        onClick={() => setIsEditingScaleFactor(false)}
        variant="subtle"
      >
        <IconCheck size={16} />
      </ActionIcon>
    </Group>
  );
}

export default function RecipeIngredientCard({
  ingredients,
  scaleFactor = 1,
  setScaleFactor,
}: RecipeIngredientCardProps) {
  const [isEditingScaleFactor, setIsEditingScaleFactor] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Guard against undefined ingredients
  if (!ingredients || ingredients.length === 0) {
    return (
      <Stack gap="sm">
        <Title order={4}>Ingredients</Title>
        <Text c="dimmed" size="sm">No ingredients added yet.</Text>
      </Stack>
    );
  }

  const formattedIngredientsAsString = ingredients
    .map((ingredient) => {
      const quantity = convertToFractionalRepresentation(
        ingredient.quantity * scaleFactor
      );
      const unit = ingredient.unit ? `${ingredient.unit} ` : "";
      const name = ingredient.name;
      const subtext = ingredient.subtext ? ` (${ingredient.subtext})` : "";
      return `${quantity} ${unit}${name}${subtext}`;
    })
    .join("\n");

  return (
    <>
      <Group gap="xs" mb="sm">
        <Title order={4}>Ingredients</Title>
        {isEditingScaleFactor && setScaleFactor ? (
          isMobile ? (
            <ChangeScaleFactorMobile
              scaleFactor={scaleFactor}
              setScaleFactor={setScaleFactor}
              setIsEditingScaleFactor={setIsEditingScaleFactor}
            />
          ) : (
            <ChangeScaleFactorDesktop
              scaleFactor={scaleFactor}
              setScaleFactor={setScaleFactor}
              setIsEditingScaleFactor={setIsEditingScaleFactor}
            />
          )
        ) : (
          <Group gap="xs">
            <CopyButton value={formattedIngredientsAsString} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip
                  label={
                    copied
                      ? "Ingredients Copied to Clipboard!"
                      : "Copy Ingredients"
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
            {setScaleFactor && (
              <ActionIcon
                onClick={() => setIsEditingScaleFactor(true)}
                variant="subtle"
                color="gray"
              >
                {scaleFactor}x
              </ActionIcon>
            )}
          </Group>
        )}
      </Group>

      <Stack gap="xs">
        {ingredients.map((ingredient) => (
          <Group key={`ingredient-${ingredient.id}`} ml="md">
            <Checkbox
              label={`${convertToFractionalRepresentation(
                ingredient.quantity * scaleFactor
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
    </>
  );
}
