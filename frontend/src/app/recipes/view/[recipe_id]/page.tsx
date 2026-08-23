'use client';

import { Badge, Divider, Group, Paper, Text, Title, Container, Stack, Button } from "@mantine/core";
import { IconEdit, IconTrash, IconClock, IconUsers, IconChefHat, IconUserPlus } from "@tabler/icons-react";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { useState, useMemo } from "react";


import DeleteRecipeModal from "@/components/recipes/delete/DeleteRecipeModal";
import ShareRecipeModal from "@/components/recipes/share/ShareRecipeModal";
import RecipeIngredientCard from "@/components/recipes/view/RecipeIngredientCard";
import RecipeInstructionsCard from "@/components/recipes/view/RecipeInstructionsCard";
import RecipeLoadingSkeleton from "@/components/recipes/view/RecipeLoadingSkeleton";
import { ApiErrorAlert } from "@/components/error-handling";
import { titleize } from "@/utils/recipeUtils";
import { useAuth } from "@/contexts/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useRecipe } from "@/hooks/useRecipes";
import { useUserRecipePermissions, useRecipePermissions } from "@/hooks/useRecipePermissions";

export default function ViewRecipe() {
  const auth = useAuth();
  const router = useRouter();
  const params = useParams();
  const recipe_id = params?.recipe_id as string;

  const { navigateToRecipeEdit } = useAppNavigation();
  const [deleteModalOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [shareModalOpened, { open: openShare, close: closeShare }] = useDisclosure(false);
  const [scaleFactor, setScaleFactor] = useState(1);
  const isMobile = useMediaQuery('(max-width: 768px)', false, { getInitialValueInEffect: true });

  const { data: recipe, isLoading, error, refetch } = useRecipe(recipe_id);

  const { canEdit, canDelete, isOwner } = useUserRecipePermissions(recipe_id);
  const { data: permissions } = useRecipePermissions(recipe_id);

  const authorName = useMemo(() => {
    if (!permissions || !Array.isArray(permissions)) return null;
    const owner = permissions.find(p => p.role === 'owner');
    return owner ? owner.user_username : null;
  }, [permissions]);

  const handleEditClick = () => {
    navigateToRecipeEdit(recipe_id, recipe);
  };

  const handleDescriptionClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const link = target.closest('a');

    if (link && link.href) {
      const url = new URL(link.href, window.location.origin);
      if (url.origin === window.location.origin) {
        event.preventDefault();
        router.push(url.pathname + url.search + url.hash);
      }
    }
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
    <Container size="xl" px={{ base: "xs", sm: "md" }}>
      <Stack gap="lg">
        <Paper
          shadow="lg"
          p={{ base: "md", sm: "lg" }}
          radius="lg"
          withBorder
          style={{
            borderLeft: "4px solid var(--mantine-color-orange-4)",
          }}
        >
          <Stack gap="lg">
            {/* Header Section */}
            <Stack gap="sm">
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
                  <Title order={isMobile ? 3 : 2} fw={700} style={{ wordBreak: 'break-word' }}>
                    {recipe.title}
                  </Title>

                  {/* Recipe metadata */}
                  <Group gap="xs" c="dimmed" wrap="wrap">
                    {authorName && (
                      <>
                        <Group gap="4px">
                          <IconChefHat size="0.9rem" stroke={1.5} />
                          <Text size="xs" fw={600}>
                            By {authorName}
                          </Text>
                        </Group>
                        <Text size="xs" c="gray.4" fw={700}>•</Text>
                      </>
                    )}

                    {recipe.cooking_time && (
                      <>
                        <Group gap="4px">
                          <IconClock size="0.9rem" stroke={1.5} />
                          <Text size="xs" fw={600}>
                            {recipe.cooking_time}m
                          </Text>
                        </Group>
                        <Text size="xs" c="gray.4" fw={700}>•</Text>
                      </>
                    )}

                    <Text size="xs" fw={600}>
                      {new Date(recipe.created_at).toLocaleDateString()}
                    </Text>

                    {recipe.serving_size && (
                      <>
                        <Text size="xs" c="gray.4" fw={700}>•</Text>
                        <Group gap="4px">
                          <IconUsers size="0.9rem" stroke={1.5} />
                          <Text size="xs" fw={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {Math.round(recipe.serving_size * scaleFactor)} servings
                          </Text>
                        </Group>
                      </>
                    )}
                  </Group>

                  {/* Tags */}
                  {recipe.tags && recipe.tags.length > 0 && (
                    <Group gap="6px" mt="xs" wrap="wrap">
                      {recipe.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="light"
                          color="orange"
                          radius="md"
                          size="sm"
                          style={{
                            textTransform: "none",
                            fontWeight: 600,
                          }}
                        >
                          {titleize(tag)}
                        </Badge>
                      ))}
                    </Group>
                  )}
                </Stack>

                {/* Desktop Action Buttons */}
                {auth.isAuthenticated && (
                  <Group gap="xs" visibleFrom="sm" style={{ flexShrink: 0 }}>
                    {canEdit && (
                      <>
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
                        <Button
                          variant="filled"
                          color="teal"
                          size="sm"
                          radius="xl"
                          leftSection={<IconUserPlus size="1rem" stroke={1.5} />}
                          onClick={openShare}
                          style={{
                            transition: "all 0.2s ease",
                            fontWeight: 600,
                            boxShadow: '0 4px 12px rgba(22, 184, 153, 0.15)',
                          }}
                        >
                          Share
                        </Button>
                      </>
                    )}

                    {canDelete && (
                      <Button
                        variant="filled"
                        color="red"
                        size="sm"
                        radius="xl"
                        leftSection={<IconTrash size="1rem" stroke={1.5} />}
                        onClick={openDelete}
                        style={{
                          transition: "all 0.2s ease",
                          fontWeight: 600,
                          boxShadow: '0 4px 12px rgba(250, 82, 82, 0.15)',
                        }}
                      >
                        Delete
                      </Button>
                    )}
                  </Group>
                )}
              </Group>

              {/* Mobile Action Buttons (Full-Width Segment / Clean Bar) */}
              {auth.isAuthenticated && (canEdit || canDelete) && (
                <Group gap="xs" grow hiddenFrom="sm" mt="xs">
                  {canEdit && (
                    <>
                      <Button
                        variant="light"
                        color="blue"
                        size="sm"
                        radius="md"
                        leftSection={<IconEdit size="1.1rem" stroke={1.5} />}
                        onClick={handleEditClick}
                        style={{ fontWeight: 600 }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="light"
                        color="teal"
                        size="sm"
                        radius="md"
                        leftSection={<IconUserPlus size="1.1rem" stroke={1.5} />}
                        onClick={openShare}
                        style={{ fontWeight: 600 }}
                      >
                        Share
                      </Button>
                    </>
                  )}
                  {canDelete && (
                    <Button
                      variant="light"
                      color="red"
                      size="sm"
                      radius="md"
                      leftSection={<IconTrash size="1.1rem" stroke={1.5} />}
                      onClick={openDelete}
                      style={{ fontWeight: 600 }}
                    >
                      Delete
                    </Button>
                  )}
                </Group>
              )}
            </Stack>

            <Divider />

            {/* Description Section */}
            {recipe.description && (
              <div>
                <div
                  dangerouslySetInnerHTML={{ __html: recipe.description }}
                  onClick={handleDescriptionClick}
                  style={{
                    lineHeight: 1.6,
                    fontSize: "16px",
                    fontFamily: "inherit",
                    fontWeight: 400,
                    cursor: "auto",
                  }}
                />
              </div>
            )}

            {/* Ingredients Section */}
            <RecipeIngredientCard
              ingredients={recipe.ingredients || []}
              scaleFactor={scaleFactor}
              onScaleChange={setScaleFactor}
              servingSize={recipe.serving_size}
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
        close={closeDelete}
      />

      <ShareRecipeModal
        recipeId={recipe.id}
        isOwner={isOwner}
        opened={shareModalOpened}
        close={closeShare}
      />
    </Container>
  );
}
