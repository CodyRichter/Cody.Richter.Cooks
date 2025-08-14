import { Badge, Grid, Group, Paper, Text } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";

import DeleteRecipeModal from "@/components/recipes/delete/DeleteRecipeModal";
import { INITIAL_NETWORK_RESULT_WITH_LOADING } from "@/types/constants";
import Recipe from "@/types/Recipe";
import RecipeIngredientCard from "@/components/recipes/view/RecipeIngredientCard";
import RecipeInstructionsCard from "@/components/recipes/view/RecipeInstructionsCard";
import RecipeLoadingSkeleton from "@/components/recipes/view/RecipeLoadingSkeleton";
import RecipeNotFound from "@/components/error-handling/RecipeNotFound";
import ViewRecipeActionBar from "@/components/recipes/view/action-bar/ViewRecipeActionBar";
import { getRecipeFromNetwork } from "@/utils/network";
import { titleize } from "@/utils/recipeUtils";
import { useAuth } from "react-oidc-context";
import { useDisclosure } from "@mantine/hooks";
import { useRouter } from "next/router";

export default function ViewRecipe() {
  const router = useRouter();
  const recipe_id: string = router.query.recipe_id as string;

  const [networkStatus, setNetworkStatus] = useState(
    INITIAL_NETWORK_RESULT_WITH_LOADING
  );
  const [deleteModalOpened, { open, close }] = useDisclosure(false);

  const auth = useAuth();

  const recipe = useMemo(() => {
    const recipe = networkStatus.response as Recipe;
    if (!recipe) return null;

    recipe.tags = recipe.tags.map((tag) => {
      // Convert the tag to title case
      return titleize(tag);
    });

    return recipe;
  }, [networkStatus.response]);

  useEffect(() => {
    getRecipeFromNetwork(recipe_id, setNetworkStatus);
  }, [recipe_id]);

  const user_has_recipe_permission: boolean = useMemo(() => {
    return recipe?.username === auth.user?.profile?.["cognito:username"];
  }, [recipe, auth.user]);

  if (networkStatus.isLoading || !recipe) {
    return <RecipeLoadingSkeleton />;
  }

  if (networkStatus.error) {
    return (
      <Grid>
        <Grid.Col span={12}>
          <Text c="red" fw={500}>
            {networkStatus.error}
          </Text>
        </Grid.Col>
      </Grid>
    );
  }

  if (networkStatus.error === "404") {
    return <RecipeNotFound />;
  }

  return (
    <>
      <Grid>
        <Grid.Col span={12}>
          <Group justify="space-between" align="flex-start">
            <div>
              <Text fw={700} size="xl" mb={4}>
                {recipe.title}
              </Text>
              <Text c="dimmed" size="sm" mb={16}>
                by {recipe.username}
              </Text>
            </div>

            {auth.isAuthenticated && user_has_recipe_permission && (
              <ViewRecipeActionBar
                recipeId={recipe.id}
                openDeleteModal={open}
              />
            )}
          </Group>
        </Grid.Col>

        {recipe.tags.length > 0 && (
          <Grid.Col span={12}>
            <Paper
              shadow="sm"
              p="md"
              radius="md"
              withBorder
              style={{
                marginBottom: "24px",
              }}
            >
              <Text size="sm" c="dimmed" fw={500} mb={8}>
                Tags
              </Text>
              <Group gap="xs">
                {recipe.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="gradient"
                    gradient={{ from: "orange", to: "yellow", deg: 195 }}
                    radius="md"
                    size="md"
                    style={{
                      textTransform: "none",
                      fontWeight: 500,
                    }}
                  >
                    {titleize(tag)}
                  </Badge>
                ))}
              </Group>
            </Paper>
          </Grid.Col>
        )}

        {recipe.description && (
          <Grid.Col span={12}>
            <Paper shadow="sm" p="md" radius="md" withBorder mb="sm">
              <Text size="sm" c="dimmed" fw={500} mb={12}>
                Description
              </Text>
              <div
                dangerouslySetInnerHTML={{ __html: recipe.description }}
                style={{
                  lineHeight: 1.6,
                  fontSize: "16px",
                  fontFamily: "inherit",
                  fontWeight: 400,
                }}
              />
            </Paper>
          </Grid.Col>
        )}

        <Grid.Col span={12}>
          <RecipeIngredientCard ingredients={recipe.ingredients} />
        </Grid.Col>
        <Grid.Col span={12}>
          <RecipeInstructionsCard instructions={recipe.instructions} />
        </Grid.Col>
      </Grid>

      <DeleteRecipeModal
        recipeTitle={recipe.title}
        recipeId={recipe.id}
        opened={deleteModalOpened}
        close={close}
      />
    </>
  );
}
