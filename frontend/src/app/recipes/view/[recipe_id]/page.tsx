'use client';

import { Badge, Divider, Group, Paper, Text, Title, Container, Stack } from "@mantine/core";
import { IconEdit, IconTrash, IconClock, IconUsers } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";

import { Button } from "@mantine/core";
import DeleteRecipeModal from "@/components/recipes/delete/DeleteRecipeModal";
import RecipeIngredientCard from "@/components/recipes/view/RecipeIngredientCard";
import RecipeInstructionsCard from "@/components/recipes/view/RecipeInstructionsCard";
import RecipeLoadingSkeleton from "@/components/recipes/view/RecipeLoadingSkeleton";
import { ApiErrorAlert } from "@/components/error-handling";
import { titleize } from "@/utils/recipeUtils";
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "next/navigation";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useRecipe } from "@/hooks/useRecipes";
import { useUserRecipePermissions } from "@/hooks/useRecipePermissions";

export default function ViewRecipe() {
  const auth = useAuth();
  const params = useParams();
  const recipe_id = params?.recipe_id as string;

  const { navigateToRecipeEdit } = useAppNavigation();
  const [deleteModalOpened, { open, close }] = useDisclosure(false);
  const [scaleFactor, setScaleFactor] = useState(1);

  const { data: recipe, isLoading, error, refetch } = useRecipe(recipe_id);

  const { canEdit, canDelete } = useUserRecipePermissions(recipe_id);

  const handleEditClick = () => {
    navigateToRecipeEdit(recipe_id, recipe);
  };

  if (isLoading) {
    return <RecipeLoadingSkeleton />;
  }

  if (error || !recipe) {
    return (
      <Container size="md" py="xl">
        <ApiErrorAlert
          error={error}
          onRetry={refetch}
          title="Failed to load recipe"
        />
      </Container>
    );
  }

  return (
    <Container size="xl" px="md">
      <Stack gap="lg">
        <Paper
          shadow="lg"
          p="lg"
          radius="md"
          withBorder
          style={{ borderLeft: "6px solid #e2a478" }}
        >
          <Stack gap="lg">
            {/* Header Section */}
            <Group justify="space-between" align="flex-start">
              <Stack gap="sm" style={{ flex: 1 }}>
                <Title order={2} fw={700}>{recipe.title}</Title>

                {/* Recipe metadata */}
                <Group gap="md">
                  {recipe.cooking_time && (
                    <Group gap="xs">
                      <IconClock size="1rem" />
                      <Text size="sm" c="dimmed">
                        {recipe.cooking_time} minutes
                      </Text>
                    </Group>
                  )}

                  {recipe.serving_size && (
                    <Group gap="xs">
                      <IconUsers size="1rem" />
                      <Text size="sm" c="dimmed">
                        {Math.round(recipe.serving_size * scaleFactor)} servings
                        {scaleFactor !== 1 && (
                          <Text component="span" size="xs" c="dimmed" ml="xs">
                            (originally {recipe.serving_size})
                          </Text>
                        )}
                      </Text>
                    </Group>
                  )}

                  <Text size="sm" c="dimmed">
                    Created {new Date(recipe.created_at).toLocaleDateString()}
                  </Text>
                </Group>

                {/* Tags */}
                {recipe.tags && recipe.tags.length > 0 && (
                  <Group gap="xs" mt="sm">
                    <Text size="sm" c="dimmed" fw={400}>
                      Tags:
                    </Text>
                    {recipe.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="light"
                        color="orange"
                        radius="md"
                        size="lg"
                        style={{
                          textTransform: "none",
                          fontWeight: 700,
                        }}
                      >
                        {titleize(tag)}
                      </Badge>
                    ))}
                  </Group>
                )}
              </Stack>

              {/* Action Buttons */}
              {auth.isAuthenticated && (canEdit || canDelete) && (
                <Group gap="sm" style={{ flexShrink: 0 }}>
                  {canEdit && (
                    <Button
                      variant="outline"
                      color="blue"
                      size="sm"
                      radius="sm"
                      leftSection={<IconEdit size="1rem" />}
                      onClick={handleEditClick}
                      style={{
                        transition: "all 0.2s ease",
                      }}
                    >
                      Edit
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="outline"
                      color="red"
                      size="sm"
                      radius="sm"
                      leftSection={<IconTrash size="1rem" />}
                      onClick={open}
                      style={{
                        transition: "all 0.2s ease",
                      }}
                    >
                      Delete
                    </Button>
                  )}
                </Group>
              )}
            </Group>

            <Divider />

            {/* Description Section */}
            {recipe.description && (
              <Stack gap="sm">
                <Title order={4}>Description</Title>
                <div
                  dangerouslySetInnerHTML={{ __html: recipe.description }}
                  style={{
                    lineHeight: 1.6,
                    fontSize: "16px",
                    fontFamily: "inherit",
                    fontWeight: 400,
                  }}
                />
              </Stack>
            )}

            {/* Ingredients Section */}
            <RecipeIngredientCard
              ingredients={recipe.ingredients || []}
              scaleFactor={scaleFactor}
              setScaleFactor={setScaleFactor}
            />

            {/* Instructions Section */}
            <RecipeInstructionsCard instructions={recipe.instructions || []} />
          </Stack>
        </Paper>
      </Stack>

      <DeleteRecipeModal
        recipeTitle={recipe.title}
        recipeId={recipe.id}
        opened={deleteModalOpened}
        close={close}
      />
    </Container>
  );
}
