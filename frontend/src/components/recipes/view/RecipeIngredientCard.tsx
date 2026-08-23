import {
  ActionIcon,
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
import { useMediaQuery } from "@mantine/hooks";

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
  const isMobile = useMediaQuery("(max-width: 768px)", false, {
    getInitialValueInEffect: true,
  });

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
        const newTop = child.getBoundingClientRect().top;
        const deltaY = oldTop - newTop;

        if (deltaY !== 0) {
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

  if (!ingredients || ingredients.length === 0) {
    return (
      <Paper
        withBorder={!isMobile}
        shadow={isMobile ? "none" : "xs"}
        radius={isMobile ? 0 : "lg"}
        p={isMobile ? 0 : "lg"}
        bg={isMobile ? "transparent" : undefined}
        h="100%"
        style={{ display: "flex", flexDirection: "column" }}
      >
        <Stack gap="sm" style={{ flex: 1 }}>
          <Title order={3} size="h4" fw={700}>
            Ingredients
          </Title>
          <Text c="dimmed" size="sm">
            No ingredients added yet.
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper
      withBorder={!isMobile}
      shadow={isMobile ? "none" : "xs"}
      radius={isMobile ? 0 : "lg"}
      p={isMobile ? 0 : "lg"}
      bg={isMobile ? "transparent" : undefined}
      h="100%"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <Stack gap="sm" style={{ flex: 1 }}>
        {/* Title Bar */}
        <Group justify="space-between" align="center" wrap="nowrap">
          <Title order={3} size="h4" fw={700}>
            Ingredients
          </Title>

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
                  variant="subtle"
                  color={copied ? "teal" : "gray"}
                  px="xs"
                  leftSection={
                    copied ? (
                      <IconClipboardCheck size={14} color="var(--mantine-color-teal-6)" />
                    ) : (
                      <IconCopy size={14} />
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

        {/* Scaling Controls Bar - Stepper is anchored right, Reset appears on left so + never shifts */}
        {onScaleChange && (
          <Box
            p={isMobile ? "4px 0" : "6px 10px"}
            style={{
              backgroundColor: isMobile
                ? "transparent"
                : "var(--mantine-color-default-hover)",
              borderRadius: "var(--mantine-radius-md)",
              border: isMobile
                ? "none"
                : "1px solid var(--mantine-color-default-border)",
            }}
          >
            <Group justify="space-between" align="center" gap="xs" wrap="nowrap">
              {/* Left: Label + Reset button */}
              <Group gap={6} align="center" wrap="nowrap">
                <IconUsers size={16} stroke={1.5} style={{ opacity: 0.75 }} />
                <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: "0.5px" }}>
                  {servingSize ? "Servings" : "Scale"}
                </Text>

                {isScaled && (
                  <Button
                    size="xs"
                    variant="subtle"
                    color="orange"
                    radius="sm"
                    leftSection={<IconRotate size={12} stroke={2} />}
                    onClick={() => onScaleChange(1)}
                    style={{
                      fontWeight: 600,
                      paddingLeft: 6,
                      paddingRight: 6,
                      height: 22,
                      fontSize: "0.75rem",
                    }}
                  >
                    Reset
                  </Button>
                )}
              </Group>

              {/* Right: Stepper controls stay anchored on right without shifting */}
              <Group
                gap={2}
                align="center"
                wrap="nowrap"
                style={{
                  backgroundColor: "var(--mantine-color-body)",
                  borderRadius: "var(--mantine-radius-md)",
                  border: "1px solid var(--mantine-color-default-border)",
                  padding: "2px 6px",
                  flexShrink: 0,
                }}
              >
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={handleDecrement}
                  disabled={servingSize ? (currentServings ?? 1) <= 1 : scaleFactor <= 0.25}
                  aria-label={servingSize ? "Decrease servings" : "Decrease scale"}
                  style={{ minWidth: 26, minHeight: 26 }}
                >
                  <IconMinus size={12} stroke={2.5} />
                </ActionIcon>

                <Text
                  size="xs"
                  fw={700}
                  style={{
                    minWidth: "2.5rem",
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
                  style={{ minWidth: 26, minHeight: 26 }}
                >
                  <IconPlus size={12} stroke={2.5} />
                </ActionIcon>
              </Group>
            </Group>
          </Box>
        )}

        <Divider />

        {/* Ingredient Items List */}
        <Stack
          gap="2px"
          ref={containerRef}
          style={{
            overflowAnchor: "none",
            width: "100%",
            flex: 1,
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
                p="6px 4px"
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
                <Group align="flex-start" wrap="nowrap" gap="xs">
                  <Checkbox
                    color="orange"
                    checked={isChecked}
                    readOnly
                    tabIndex={-1}
                    size="sm"
                    styles={{
                      root: { pointerEvents: "none", marginTop: 2 },
                    }}
                  />
                  <Stack gap={1} style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      size="sm"
                      style={{
                        textDecoration: isChecked ? "line-through" : "none",
                        color: isChecked
                          ? "var(--mantine-color-dimmed)"
                          : "inherit",
                        transition: "all 0.2s ease",
                        lineHeight: 1.35,
                        wordBreak: "break-word",
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
                          lineHeight: 1.25,
                          wordBreak: "break-word",
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
    </Paper>
  );
}
