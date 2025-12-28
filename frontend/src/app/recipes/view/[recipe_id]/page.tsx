'use client';

import { Badge, Divider, Group, Paper, Text, Title, Container, Stack, Menu, ActionIcon, Box } from "@mantine/core";
import { IconEdit, IconTrash, IconClock, IconUsers, IconShieldLock, IconDots } from "@tabler/icons-react";
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
          radius="lg"
          withBorder
          style={{
            borderLeft: "4px solid var(--mantine-color-orange-4)",
            backgroundColor: "var(--mantine-color-white)",
          }}
        >
          <Stack gap="lg">
            {/* Header Section */}
            <Group justify="space-between" align="flex-start">
              <Stack gap="sm" style={{ flex: 1 }}>
                <Title order={2} fw={700}>{recipe.title}</Title>

                {/* Recipe metadata */}
                <Group gap="xs" c="dimmed">
                  {recipe.cooking_time && (
                    <Group gap="4px">
                      <IconClock size="0.9rem" stroke={1.5} />
                      <Text size="xs" fw={600}>
                        {recipe.cooking_time}m
                      </Text>
                    </Group>
                  )}

                  {(recipe.cooking_time || recipe.serving_size) && (
                    <Text size="xs" c="gray.4" fw={700}>•</Text>
                  )}

                  {recipe.serving_size && (
                    <Group gap="4px">
                      <IconUsers size="0.9rem" stroke={1.5} />
                      <Text size="xs" fw={600}>
                        {Math.round(recipe.serving_size * scaleFactor)} servings
                        {scaleFactor !== 1 && (
                          <Text component="span" size="xs" c="dimmed" ml="4px">
                            (x{scaleFactor})
                          </Text>
                        )}
                      </Text>
                    </Group>
                  )}

                  <Text size="xs" c="gray.4" fw={700}>•</Text>

                  <Text size="xs" fw={600}>
                    {new Date(recipe.created_at).toLocaleDateString()}
                  </Text>
                </Group>

                {/* Tags */}
                {recipe.tags && recipe.tags.length > 0 && (
                  <Group gap="6px" mt="xs">
                    {recipe.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        color="orange.8"
                        radius="sm"
                        size="sm"
                        style={{
                          textTransform: "none",
                          fontWeight: 500,
                          borderWidth: "1px",
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
                <Group gap="xs" style={{ flexShrink: 0 }}>
                  {canEdit && (
                    <Button
                      variant="filled"
                      color="blue"
                      size="sm"
                      radius="xl"
                      leftSection={<IconEdit size="1rem" stroke={1.5} />}
                      onClick={handleEditClick}
                      style={{
                        transition: "all 0.2s ease",
                        fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(34, 139, 230, 0.15)',
                      }}
                    >
                      Edit
                    </Button>
                  )}

                  {(canEdit || canDelete) && (
                    <Menu position="bottom-end" shadow="md" width={180} radius="md">
                      <Menu.Target>
                        <ActionIcon
                          variant="light"
                          color="gray"
                          size="lg"
                          radius="xl"
                        >
                          <IconDots size="1.2rem" stroke={1.5} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        {canEdit && (
                          <Menu.Item
                            leftSection={<IconShieldLock size="1rem" />}
                            onClick={() => {}} // No-op for now
                          >
                            Manage Access
                          </Menu.Item>
                        )}

                        {canDelete && (
                          <>
                            {canEdit && <Menu.Divider />}
                            <Menu.Item
                              color="red"
                              leftSection={<IconTrash size="1rem" />}
                              onClick={open}
                            >
                              Delete Recipe
                            </Menu.Item>
                          </>
                        )}
                      </Menu.Dropdown>
                    </Menu>
                  )}
                </Group>
              )}
            </Group>

            <Divider />

            {/* Description Section */}
            {recipe.description && (
              <Box>
                <div
                  dangerouslySetInnerHTML={{ __html: recipe.description }}
                  style={{
                    lineHeight: 1.6,
                    fontSize: "16px",
                    fontFamily: "inherit",
                    fontWeight: 400,
                  }}
                />
              </Box>
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
