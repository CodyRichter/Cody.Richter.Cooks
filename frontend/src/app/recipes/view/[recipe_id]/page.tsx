'use client';

import { Badge, Divider, Group, Paper, Text, Title, Container, Stack, ActionIcon, Box, Tooltip, SegmentedControl, Button } from "@mantine/core";
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
    <Container size="xl" px="md">
      <Stack gap="lg">
        <Paper
          shadow="lg"
          p="lg"
          radius="lg"
          withBorder
          style={{
            borderLeft: "4px solid var(--mantine-color-orange-4)",
          }}
        >
          <Stack gap="lg">
            {/* Header Section */}
            <Group justify="space-between" align="flex-start" wrap="nowrap" style={{ alignItems: isMobile ? 'center' : 'flex-start' }}>
              <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
                <Title order={isMobile ? 3 : 2} fw={700} style={{ wordBreak: 'break-word' }}>{recipe.title}</Title>

                {/* Recipe metadata */}
                <Stack gap="6px">
                  {/* Row 1: General Info */}
                  <Group gap="xs" c="dimmed">
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
                  </Group>

                  {recipe.serving_size && (
                    <Group gap="xs" align="center" c="dimmed" wrap={isMobile ? "wrap" : "nowrap"}>
                      <Group gap="4px" style={{ flexShrink: 0, minWidth: isMobile ? 'unset' : '95px' }}>
                        <IconUsers size="0.9rem" stroke={1.5} />
                        <Text size="xs" fw={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {Math.round(recipe.serving_size * scaleFactor)} servings
                        </Text>
                      </Group>

                      <Text size="xs" c="gray.4" fw={700} visibleFrom="sm">•</Text>

                      <Group gap="xs" align="center" wrap="nowrap" style={{ flex: isMobile ? '1 1 100%' : 'unset', minWidth: 0 }}>
                        <Text size="xs" fw={600} style={{ flexShrink: 0 }}>Scale:</Text>
                        <SegmentedControl
                          fullWidth={isMobile}
                          size={isMobile ? "xs" : "xs"}
                          value={scaleFactor.toString()}
                          onChange={(val) => setScaleFactor(Number(val))}
                          data={[
                            { label: '1x', value: '1' },
                            { label: '2x', value: '2' },
                            { label: '3x', value: '3' },
                            { label: '4x', value: '4' },
                            { label: '5x', value: '5' },
                          ]}
                          color="orange"
                          radius="md"
                          transitionDuration={200}
                          style={{ flex: isMobile ? 1 : 'unset' }}
                        />
                      </Group>
                    </Group>
                  )}
                </Stack>

                {/* Tags */}
                {recipe.tags && recipe.tags.length > 0 && (
                  <Group gap="6px" mt="xs">
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

              {/* Action Buttons */}
              {auth.isAuthenticated && (
                <Box style={{ flexShrink: 0 }}>
                  {/* Mobile Actions (Stack) */}
                  <Stack gap="xs" hiddenFrom="sm">
                    {canEdit && (
                      <>
                        <Tooltip label="Edit">
                          <ActionIcon
                            variant="filled"
                            color="blue"
                            size="lg"
                            radius="xl"
                            onClick={handleEditClick}
                            style={{ transition: "all 0.2s ease" }}
                          >
                            <IconEdit size="1.2rem" stroke={1.5} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Share">
                          <ActionIcon
                            variant="filled"
                            color="teal"
                            size="lg"
                            radius="xl"
                            onClick={openShare}
                            style={{ transition: "all 0.2s ease" }}
                          >
                            <IconUserPlus size="1.2rem" stroke={1.5} />
                          </ActionIcon>
                        </Tooltip>
                      </>
                    )}

                    {canDelete && (
                      <Tooltip label="Delete">
                        <ActionIcon
                          variant="filled"
                          color="red"
                          size="lg"
                          radius="xl"
                          onClick={openDelete}
                          style={{ transition: "all 0.2s ease" }}
                        >
                          <IconTrash size="1.2rem" stroke={1.5} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </Stack>

                  {/* Desktop Actions (Group) */}
                  <Group gap="xs" visibleFrom="sm">
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
                </Box>
              )}
            </Group>

            <Divider />

            {/* Description Section */}
            {recipe.description && (
              <Box>
                <div
                  dangerouslySetInnerHTML={{ __html: recipe.description }}
                  onClick={handleDescriptionClick}
                  style={{
                    lineHeight: 1.6,
                    fontSize: "16px",
                    fontFamily: "inherit",
                    fontWeight: 400,
                    cursor: "auto", // Ensure standard cursor behavior unless hovering over links
                  }}
                />
              </Box>
            )}

            {/* Ingredients Section */}
            <RecipeIngredientCard
              ingredients={recipe.ingredients || []}
              scaleFactor={scaleFactor}
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
