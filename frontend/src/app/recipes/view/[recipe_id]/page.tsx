'use client';

import {
  Alert,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconChefHat,
  IconClock,
  IconEdit,
  IconShieldCheck,
  IconTrash,
  IconUserPlus,
  IconUsers,
} from "@tabler/icons-react";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { ApiErrorAlert } from "@/components/error-handling";
import DeleteRecipeModal from "@/components/recipes/delete/DeleteRecipeModal";
import RecipeIngredientCard from "@/components/recipes/view/RecipeIngredientCard";
import RecipeInstructionsCard from "@/components/recipes/view/RecipeInstructionsCard";
import RecipeLoadingSkeleton from "@/components/recipes/view/RecipeLoadingSkeleton";
import ShareRecipeModal from "@/components/recipes/share/ShareRecipeModal";
import { titleize } from "@/utils/recipeUtils";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { useRecipe } from "@/hooks/useRecipes";
import { useRecipePermissions, useUserRecipePermissions } from "@/hooks/useRecipePermissions";

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

  const { canEdit, canDelete, isOwner, isAdminOverride } = useUserRecipePermissions(recipe_id);
  const { data: permissions } = useRecipePermissions(recipe_id);

  const authorName = useMemo(() => {
    if (!permissions || !Array.isArray(permissions)) return null;
    const owner = permissions.find((p) => p.role === 'owner');
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

  const hasActions = auth.isAuthenticated && (canEdit || canDelete);

  return (
    <Container size="xl" px={{ base: "xs", sm: "md" }} py={{ base: "xs", sm: "md" }}>
      <Stack gap={isMobile ? "lg" : "md"}>
        {/* Section 1: Overview & Details */}
        <Paper
          shadow={isMobile ? "none" : "xs"}
          p={isMobile ? 0 : "xl"}
          radius={isMobile ? 0 : "lg"}
          withBorder={!isMobile}
          bg={isMobile ? "transparent" : undefined}
        >
          <Stack gap="md">
            {/* Admin Override Notice Banner */}
            {isAdminOverride && (
              <Alert
                icon={<IconShieldCheck size="1.25rem" />}
                title="Administrator Access"
                color="blue"
                variant="light"
                radius="md"
              >
                You have full access to view, edit, share, and delete this recipe because you are an Administrator.
                {authorName && (
                  <Text component="span" fw={600}>
                    {' '}(Owned by {authorName})
                  </Text>
                )}
              </Alert>
            )}

            {/* Top Bar: Title & Desktop Actions */}
            <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
              <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
                <Title
                  order={1}
                  size={isMobile ? "h2" : "h1"}
                  fw={800}
                  style={{ wordBreak: 'break-word', letterSpacing: '-0.5px' }}
                >
                  {recipe.title}
                </Title>

                {/* Recipe Metadata Pills */}
                <Group gap="xs" c="dimmed" wrap="wrap">
                  {authorName && (
                    <>
                      <Group gap={4} align="center">
                        <IconChefHat size="0.95rem" stroke={1.75} />
                        <Text size="xs" fw={600}>
                          By {authorName}
                        </Text>
                      </Group>
                      <Text size="xs" c="gray.4" fw={700}>•</Text>
                    </>
                  )}

                  {isAdminOverride && (
                    <>
                      <Badge
                        leftSection={<IconShieldCheck size="0.85rem" stroke={2} />}
                        color="blue"
                        variant="light"
                        size="sm"
                        radius="sm"
                        style={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        Admin Permissions
                      </Badge>
                      <Text size="xs" c="gray.4" fw={700}>•</Text>
                    </>
                  )}

                  {recipe.cooking_time && (
                    <>
                      <Group gap={4} align="center">
                        <IconClock size="0.95rem" stroke={1.75} />
                        <Text size="xs" fw={600}>
                          {recipe.cooking_time} mins
                        </Text>
                      </Group>
                      <Text size="xs" c="gray.4" fw={700}>•</Text>
                    </>
                  )}

                  {recipe.serving_size && (
                    <>
                      <Group gap={4} align="center">
                        <IconUsers size="0.95rem" stroke={1.75} />
                        <Text size="xs" fw={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {recipe.serving_size} {recipe.serving_size === 1 ? 'serving' : 'servings'}
                        </Text>
                      </Group>
                      <Text size="xs" c="gray.4" fw={700}>•</Text>
                    </>
                  )}

                  <Text size="xs" fw={600}>
                    {new Date(recipe.created_at).toLocaleDateString()}
                  </Text>
                </Group>

                {/* Tags */}
                {recipe.tags && recipe.tags.length > 0 && (
                  <Group gap="6px" mt={4} wrap="wrap">
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

              {/* Desktop Action Buttons with matching outlines */}
              {hasActions && (
                <Group gap="xs" visibleFrom="sm" style={{ flexShrink: 0 }}>
                  {canEdit && (
                    <>
                      <Button
                        variant="light"
                        color="orange"
                        size="sm"
                        radius="md"
                        leftSection={<IconEdit size="1rem" stroke={1.75} />}
                        onClick={handleEditClick}
                        style={{ fontWeight: 600 }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        radius="md"
                        leftSection={<IconUserPlus size="1rem" stroke={1.75} />}
                        onClick={openShare}
                        style={{ fontWeight: 600 }}
                      >
                        Share
                      </Button>
                    </>
                  )}

                  {canDelete && (
                    <Button
                      variant="default"
                      c="red.6"
                      size="sm"
                      radius="md"
                      leftSection={<IconTrash size="1rem" stroke={1.75} />}
                      onClick={openDelete}
                      style={{ fontWeight: 600 }}
                    >
                      Delete
                    </Button>
                  )}
                </Group>
              )}
            </Group>

            {/* Mobile Action Bar with matching outlines */}
            {hasActions && (
              <Group gap="xs" grow hiddenFrom="sm" mt="xs">
                {canEdit && (
                  <>
                    <Button
                      variant="light"
                      color="orange"
                      size="sm"
                      radius="md"
                      leftSection={<IconEdit size="1rem" stroke={1.75} />}
                      onClick={handleEditClick}
                      style={{ fontWeight: 600 }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      radius="md"
                      leftSection={<IconUserPlus size="1rem" stroke={1.75} />}
                      onClick={openShare}
                      style={{ fontWeight: 600 }}
                    >
                      Share
                    </Button>
                  </>
                )}
                {canDelete && (
                  <Button
                    variant="default"
                    c="red.6"
                    size="sm"
                    radius="md"
                    leftSection={<IconTrash size="1rem" stroke={1.75} />}
                    onClick={openDelete}
                    style={{ fontWeight: 600 }}
                  >
                    Delete
                  </Button>
                )}
              </Group>
            )}

            {/* Description Section */}
            {recipe.description && (
              <>
                <Divider />
                <Box
                  className="recipe-description-content"
                  dangerouslySetInnerHTML={{ __html: recipe.description }}
                  onClick={handleDescriptionClick}
                  style={{
                    cursor: "auto",
                  }}
                />
              </>
            )}
          </Stack>
        </Paper>

        {isMobile && <Divider />}

        {/* 2-Column Desktop Grid / Stacked Seamless Mobile Flow */}
        <Grid gap="md" style={{ alignItems: "stretch" }}>
          {/* Section 2: Ingredients */}
          <Grid.Col
            span={{ base: 12, md: 5, lg: 4 }}
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <RecipeIngredientCard
              ingredients={recipe.ingredients || []}
              scaleFactor={scaleFactor}
              onScaleChange={setScaleFactor}
              servingSize={recipe.serving_size}
            />
          </Grid.Col>

          {isMobile && (
            <Grid.Col span={12}>
              <Divider />
            </Grid.Col>
          )}

          {/* Section 3: Instructions */}
          <Grid.Col
            span={{ base: 12, md: 7, lg: 8 }}
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <RecipeInstructionsCard instructions={recipe.instructions || []} />
          </Grid.Col>
        </Grid>
      </Stack>

      <DeleteRecipeModal
        recipeTitle={recipe.title}
        recipeId={recipe.id}
        isAdminOverride={isAdminOverride}
        authorName={authorName}
        opened={deleteModalOpened}
        close={closeDelete}
      />

      <ShareRecipeModal
        recipeId={recipe.id}
        isOwner={isOwner}
        isAdminOverride={isAdminOverride}
        authorName={authorName}
        opened={shareModalOpened}
        close={closeShare}
      />
    </Container>
  );
}
