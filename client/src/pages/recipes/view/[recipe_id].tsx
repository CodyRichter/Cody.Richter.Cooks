import { Badge, Divider, Grid, Group, Paper, Text, Title } from "@mantine/core";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@mantine/core";
import DeleteRecipeModal from "@/components/recipes/delete/DeleteRecipeModal";
import { INITIAL_NETWORK_RESULT_WITH_LOADING } from "@/types/constants";
import Recipe from "@/types/Recipe";
import RecipeIngredientCard from "@/components/recipes/view/RecipeIngredientCard";
import RecipeInstructionsCard from "@/components/recipes/view/RecipeInstructionsCard";
import RecipeLoadingSkeleton from "@/components/recipes/view/RecipeLoadingSkeleton";
import RecipeNotFound from "@/components/error-handling/RecipeNotFound";
import { getRecipeFromNetwork } from "@/utils/network";
import { titleize } from "@/utils/recipeUtils";
import { useAuth } from "react-oidc-context";
import { useRouter } from "next/router";

export default function ViewRecipe() {
  const router = useRouter();
  const recipe_id: string = router.query.recipe_id as string;

  const isMobile = useMediaQuery("(max-width: 768px)");

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
        <Paper
          shadow="lg"
          p="lg"
          radius="md"
          withBorder
          mb="md"
          style={{ borderLeft: "6px solid #e2a478" }}
          w="100%"
        >
          <Grid.Col span={12}>
            <Group justify="space-between" align="flex-start">
              <div>
                <Group gap="sm" align="center" mb={16}>
                  <Title order={2}>{recipe.title}</Title>
                  <Text c="dimmed" size="sm">
                    by {recipe.username}
                  </Text>
                </Group>

                {recipe.tags.length > 0 && (
                  <div>
                    <Group gap="xs" align="center" mt="sm">
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
                  </div>
                )}
              </div>

              {auth.isAuthenticated && user_has_recipe_permission && (
                <Group w={isMobile ? "100%" : "auto"}>
                  <Button
                    variant="outline"
                    color="blue"
                    size="sm"
                    radius="sm"
                    w={isMobile ? "100%" : "auto"}
                    leftSection={<IconEdit size={24} />}
                    onClick={() => {
                      router.push(`/recipes/edit/${recipe.id}`);
                    }}
                    style={{
                      transition: "all 0.2s ease",
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    color="red"
                    size="sm"
                    radius="sm"
                    w={isMobile ? "100%" : "auto"}
                    leftSection={<IconTrash size={24} />}
                    onClick={open}
                    style={{
                      transition: "all 0.2s ease",
                    }}
                  >
                    Delete
                  </Button>
                </Group>
              )}
            </Group>
          </Grid.Col>

          <Grid.Col span={12}>
            <Divider />
          </Grid.Col>

          <Grid.Col span={12}>
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
          </Grid.Col>

          <Grid.Col span={12} mb="lg">
            <RecipeIngredientCard ingredients={recipe.ingredients} />
          </Grid.Col>

          <Grid.Col span={12}>
            <RecipeInstructionsCard instructions={recipe.instructions} />
          </Grid.Col>
        </Paper>
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
