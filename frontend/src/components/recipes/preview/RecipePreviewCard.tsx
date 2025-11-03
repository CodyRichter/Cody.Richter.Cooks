import { Card, Text, Badge, Group, Stack, Box, ThemeIcon } from "@mantine/core";
import { IconClock, IconUsers, IconChefHat } from "@tabler/icons-react";
import { useAppNavigation } from "../../../hooks/useAppNavigation";
import { memo, useCallback, useMemo } from "react";
import { RecipeListItem } from "../../../types/Recipe";

interface RecipePreviewCardProps {
  recipe: RecipeListItem;
}

const RecipePreviewCard = memo<RecipePreviewCardProps>(({
  recipe,
}) => {
  const { navigateToRecipe } = useAppNavigation();

  const handleClick = useCallback(() => {
    navigateToRecipe(recipe.id, recipe);
  }, [navigateToRecipe, recipe]);

  // Generate a consistent color based on recipe title
  const cardColor = useMemo(() => {
    const colors = ['blue', 'green', 'orange', 'purple', 'teal', 'pink', 'indigo', 'cyan'];
    const hash = recipe.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }, [recipe.title]);

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      onClick={handleClick}
      style={{
        cursor: "pointer",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        minHeight: "200px",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      {/* Header section with icon and gradient */}
      <Card.Section>
        <Box
          style={{
            height: 80,
            background: `linear-gradient(135deg, var(--mantine-color-${cardColor}-6), var(--mantine-color-${cardColor}-4))`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative background pattern */}
          <Box
            style={{
              position: 'absolute',
              top: -10,
              right: -10,
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
            }}
          />
          <Box
            style={{
              position: 'absolute',
              bottom: -15,
              left: -15,
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
            }}
          />

          <ThemeIcon
            size="xl"
            variant="white"
            color={cardColor}
            radius="md"
          >
            <IconChefHat size="1.5rem" />
          </ThemeIcon>
        </Box>
      </Card.Section>

      <Stack gap="sm" mt="md" style={{ flex: 1 }}>
        <Text fw={500} lineClamp={2} size="lg">
          {recipe.title}
        </Text>

        {/* Recipe metadata */}
        <Group gap="xs" mt="auto">
          {recipe.cooking_time && (
            <Badge
              variant="light"
              color={cardColor}
              size="sm"
              leftSection={<IconClock size="0.8rem" />}
            >
              {recipe.cooking_time}m
            </Badge>
          )}

          {recipe.serving_size && (
            <Badge
              variant="light"
              color="gray"
              size="sm"
              leftSection={<IconUsers size="0.8rem" />}
            >
              {recipe.serving_size} servings
            </Badge>
          )}
        </Group>
      </Stack>
    </Card>
  );
});

RecipePreviewCard.displayName = 'RecipePreviewCard';

export default RecipePreviewCard;