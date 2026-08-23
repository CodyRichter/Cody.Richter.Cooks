import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  CopyButton,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconClipboardCheck,
  IconCopy,
  IconMinus,
  IconPlus,
  IconRotate,
  IconUsers,
} from "@tabler/icons-react";
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";

import { Ingredient } from "@/types/Ingredient";
import { convertToFractionalRepresentation } from "@/utils/recipeUtils";

interface RecipeIngredientCardProps {
  ingredients: Ingredient[];
  scaleFactor?: number;
  onScaleChange?: (scale: number) => void;
  servingSize?: number;
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
  onScaleChange,
  servingSize,
}: RecipeIngredientCardProps) {
  const [checkedIngredientIds, setCheckedIngredientIds] = useState<Set<string>>(
    new Set()
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const positionsRef = useRef<Map<string, number>>(new Map());

  const isScaled = Math.abs(scaleFactor - 1) > 0.001;

  // Calculate current active servings based on base servingSize and scaleFactor
  const currentServings = servingSize
    ? Math.max(1, Math.round(servingSize * scaleFactor))
    : null;

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

  // Stepper handlers
  const handleDecrement = () => {
    if (!onScaleChange) return;
    if (servingSize && currentServings) {
      if (currentServings > 1) {
        const targetServings = currentServings - 1;
        onScaleChange(targetServings / servingSize);
      }
    } else {
      const newScale = Math.max(0.25, parseFloat((scaleFactor - 0.5).toFixed(2)));
      onScaleChange(newScale);
    }
  };

  const handleIncrement = () => {
    if (!onScaleChange) return;
    if (servingSize && currentServings) {
      const targetServings = currentServings + 1;
      onScaleChange(targetServings / servingSize);
    } else {
      const newScale = parseFloat((scaleFactor + 0.5).toFixed(2));
      onScaleChange(newScale);
    }
  };

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
    <Stack gap="sm">
      {/* Title Bar */}
      <Group gap="xs" align="center">
        <Title order={4}>Ingredients</Title>
        <Badge variant="light" color="gray" size="sm">
          {ingredients.length} {ingredients.length === 1 ? "item" : "items"}
        </Badge>
      </Group>

      {/* All-in-One Ingredients Actions Bar */}
      <Paper
        p="xs"
        radius="md"
        withBorder
        style={{
          backgroundColor: "var(--mantine-color-default-hover)",
        }}
      >
        <Group justify="space-between" align="center" gap="sm" wrap="wrap">
          {/* Left: Scaling Stepper & Reset Controls */}
          {onScaleChange ? (
            <Group gap="xs" align="center" wrap="wrap" style={{ flex: 1, minWidth: "160px" }}>
              <Group gap={6} align="center">
                <IconUsers size={18} stroke={1.5} style={{ opacity: 0.75 }} />
                <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: "0.5px" }}>
                  {servingSize ? "Servings" : "Scale"}
                </Text>
              </Group>

              {/* Stepper with comfortable touch targets */}
              <Group
                gap={4}
                align="center"
                style={{
                  backgroundColor: "var(--mantine-color-body)",
                  borderRadius: "var(--mantine-radius-md)",
                  border: "1px solid var(--mantine-color-default-border)",
                  padding: "3px 6px",
                }}
              >
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={handleDecrement}
                  disabled={servingSize ? (currentServings ?? 1) <= 1 : scaleFactor <= 0.25}
                  aria-label={servingSize ? "Decrease servings" : "Decrease scale"}
                  style={{ minWidth: 28, minHeight: 28 }}
                >
                  <IconMinus size={14} stroke={2.5} />
                </ActionIcon>

                <Text
                  size="sm"
                  fw={700}
                  style={{
                    minWidth: "3.5rem",
                    textAlign: "center",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {servingSize
                    ? `${currentServings}`
                    : `${scaleFactor}x`}
                </Text>

                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={handleIncrement}
                  aria-label={servingSize ? "Increase servings" : "Increase scale"}
                  style={{ minWidth: 28, minHeight: 28 }}
                >
                  <IconPlus size={14} stroke={2.5} />
                </ActionIcon>
              </Group>

              {isScaled && (
                <Button
                  size="xs"
                  variant="light"
                  color="orange"
                  radius="sm"
                  leftSection={<IconRotate size={14} stroke={2} />}
                  onClick={() => onScaleChange(1)}
                  style={{ fontWeight: 600 }}
                >
                  Reset
                </Button>
              )}
            </Group>
          ) : (
            <Box />
          )}

          {/* Right: Divided Clipboard/Utility Action */}
          <Group gap="xs" align="center" style={{ flexShrink: 0 }}>
            {onScaleChange && (
              <Divider
                orientation="vertical"
                style={{
                  height: "1.5rem",
                  alignSelf: "center",
                }}
              />
            )}

            <CopyButton value={formattedIngredientsAsString} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip
                  label={
                    copied
                      ? "Ingredients Copied to Clipboard!"
                      : "Copy Ingredients"
                  }
                  withArrow
                  position="top"
                >
                  <Button
                    size="xs"
                    variant="default"
                    radius="sm"
                    color={copied ? "teal" : undefined}
                    leftSection={
                      copied ? (
                        <IconClipboardCheck size={16} color="var(--mantine-color-teal-6)" />
                      ) : (
                        <IconCopy size={16} />
                      )
                    }
                    onClick={copy}
                    style={{ fontWeight: 600 }}
                  >
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
        </Group>
      </Paper>

      {/* Ingredient Items List */}
      <Stack
        gap="4px"
        ref={containerRef}
        style={{
          overflowAnchor: "none",
          width: "100%",
        }}
      >
        {sortedIngredients.map((ingredient) => {
          const isChecked = checkedIngredientIds.has(ingredient.id);
          return (
            <Box
              key={`ingredient-${ingredient.id}`}
              data-ingredient-id={ingredient.id}
              onClick={() => toggleIngredient(ingredient.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleIngredient(ingredient.id);
                }
              }}
              tabIndex={0}
              role="checkbox"
              aria-checked={isChecked}
              p="xs"
              style={{
                width: "100%",
                borderRadius: "var(--mantine-radius-md)",
                cursor: "pointer",
                userSelect: "none",
                transition: "background-color 0.15s ease",
                backgroundColor: isChecked
                  ? "transparent"
                  : undefined,
              }}
              className="recipe-ingredient-row"
            >
              <Group align="flex-start" wrap="nowrap" gap="sm">
                <Checkbox
                  color="orange"
                  checked={isChecked}
                  readOnly
                  tabIndex={-1}
                  styles={{
                    root: { pointerEvents: "none", marginTop: 2 },
                  }}
                />
                <Stack gap={2} style={{ flex: 1 }}>
                  <Text
                    size="sm"
                    style={{
                      textDecoration: isChecked ? "line-through" : "none",
                      color: isChecked
                        ? "var(--mantine-color-dimmed)"
                        : "inherit",
                      transition: "all 0.2s ease",
                      lineHeight: 1.4,
                    }}
                  >
                    {formatIngredient(ingredient, scaleFactor)}
                  </Text>
                  {ingredient.subtext && (
                    <Text
                      size="xs"
                      c="dimmed"
                      style={{
                        textDecoration: isChecked ? "line-through" : "none",
                        transition: "all 0.2s ease",
                        lineHeight: 1.3,
                      }}
                    >
                      {ingredient.subtext}
                    </Text>
                  )}
                </Stack>
              </Group>
            </Box>
          );
        })}
      </Stack>
    </Stack>
  );
}
