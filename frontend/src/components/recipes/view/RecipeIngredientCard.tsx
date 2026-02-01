import {
  ActionIcon,
  Checkbox,
  CopyButton,
  Group,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconClipboardCheck, IconCopy } from "@tabler/icons-react";
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";


import { Ingredient } from "@/types/Ingredient";
import { convertToFractionalRepresentation } from "@/utils/recipeUtils";


interface RecipeIngredientCardProps {
  ingredients: Ingredient[];
  scaleFactor?: number;
}


const formatIngredient = (ingredient: Ingredient, scaleFactor: number) => {
  const quantity = convertToFractionalRepresentation(
    ingredient.quantity * scaleFactor
  );
  const unit = ingredient.unit ? `${ingredient.unit} ` : "";
  const name = ingredient.name;
  return `${quantity} ${unit}${name}`;
};

export default function RecipeIngredientCard({
  ingredients,
  scaleFactor = 1,
}: RecipeIngredientCardProps) {
  const [checkedIngredientIds, setCheckedIngredientIds] = useState<Set<string>>(
    new Set()
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const positionsRef = useRef<Map<string, number>>(new Map());

  const toggleIngredient = (id: string) => {
    // Capture "First" positions before state update
    if (containerRef.current) {
      const children = Array.from(containerRef.current.children);
      const positions = new Map<string, number>();
      children.forEach((child) => {
        const ingredientId = (child as HTMLElement).dataset.ingredientId;
        if (ingredientId) {
          positions.set(ingredientId, child.getBoundingClientRect().top);
        }
      });
      positionsRef.current = positions;
    }

    const newChecked = new Set(checkedIngredientIds);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedIngredientIds(newChecked);
  };

  useLayoutEffect(() => {
    if (!containerRef.current || positionsRef.current.size === 0) return;

    const children = Array.from(containerRef.current.children);
    children.forEach((child) => {
      const ingredientId = (child as HTMLElement).dataset.ingredientId;
      const oldTop = positionsRef.current.get(ingredientId || "");

      if (oldTop !== undefined) {
        // "Last" position
        const newTop = child.getBoundingClientRect().top;
        const deltaY = oldTop - newTop;

        if (deltaY !== 0) {
          // "Invert" and "Play"
          child.animate(
            [
              { transform: `translateY(${deltaY}px)` },
              { transform: "translateY(0)" },
            ],
            {
              duration: 300,
              easing: "cubic-bezier(0.2, 0, 0, 1)",
            }
          );
        }
      }
    });

    // Reset for next transition
    positionsRef.current = new Map();
  }, [checkedIngredientIds]);

  const sortedIngredients = useMemo(() => {
    return [...(ingredients || [])].sort((a, b) => {
      const aChecked = checkedIngredientIds.has(a.id);
      const bChecked = checkedIngredientIds.has(b.id);
      if (aChecked === bChecked) return 0;
      return aChecked ? 1 : -1;
    });
  }, [ingredients, checkedIngredientIds]);

  const formattedIngredientsAsString = useMemo(() => {
    return (ingredients || [])
      .map((ingredient) => {
        const text = formatIngredient(ingredient, scaleFactor);
        const subtext = ingredient.subtext ? ` (${ingredient.subtext})` : "";
        return `${text}${subtext}`;
      })
      .join("\n");
  }, [ingredients, scaleFactor]);

  // Guard against undefined ingredients
  if (!ingredients || ingredients.length === 0) {
    return (
      <Stack gap="sm">
        <Title order={4}>Ingredients</Title>
        <Text c="dimmed" size="sm">
          No ingredients added yet.
        </Text>
      </Stack>
    );
  }

  return (
    <>
      <Group gap="xs" mb="sm">
        <Title order={4}>Ingredients</Title>
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
        </Group>
      </Group>

      <Stack
        gap="xs"
        ref={containerRef}
        style={{
          overflowAnchor: "none",
          width: "100%",
        }}
      >
        {sortedIngredients.map((ingredient) => {
          const isChecked = checkedIngredientIds.has(ingredient.id);
          return (
            <Group
              key={`ingredient-${ingredient.id}`}
              ml="md"
              data-ingredient-id={ingredient.id}
              style={{
                width: "100%",
                minHeight: "1.5rem",
              }}
            >
              <Checkbox
                checked={isChecked}
                onChange={() => toggleIngredient(ingredient.id)}
                label={
                  <Text
                    style={{
                      textDecoration: isChecked ? "line-through" : "none",
                      color: isChecked
                        ? "var(--mantine-color-dimmed)"
                        : "inherit",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {formatIngredient(ingredient, scaleFactor)}
                  </Text>
                }
              />
              {ingredient.subtext && (
                <Text
                  size="sm"
                  c="dimmed"
                  style={{
                    textDecoration: isChecked ? "line-through" : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  ({ingredient.subtext})
                </Text>
              )}
            </Group>
          );
        })}
      </Stack>
    </>
  );
}
