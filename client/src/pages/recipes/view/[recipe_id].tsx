import { Badge, Button, Divider, Grid, Group, Text } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";

import DeleteRecipeModal from "@/common/components/ViewRecipe/DeleteRecipeModal";
import { INITIAL_NETWORK_RESULT_WITH_LOADING } from "@/common/network/constants";
import { IconTool } from "@tabler/icons-react";
import Recipe from "@/common/types/Recipe";
import RecipeIngredientCard from "@/common/components/ViewRecipe/RecipeIngredientCard";
import RecipeInstructionsCard from "@/common/components/ViewRecipe/RecipeInstructionsCard";
import RecipeLoadingSkeleton from "@/common/components/ViewRecipe/RecipeLoadingSkeleton";
import RecipeNotFound from "@/common/components/ErrorMessages/RecipeNotFound";
import { getRecipeFromNetwork } from "@/utils/network";
import parse from "html-react-parser";
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
        <Grid.Col>
          {auth.isAuthenticated && user_has_recipe_permission && (
            <Grid.Col span={12} className="viewRecipeAdminHeader">
              <Group>
                <IconTool size={24} style={{ marginLeft: "8px" }} />
                <Divider orientation="vertical" />
                <Button
                  onClick={() => {
                    router.push(`/recipes/edit/${recipe.id}`);
                  }}
                >
                  Edit
                </Button>
                <Button color="red" onClick={open}>
                  Delete
                </Button>
              </Group>
            </Grid.Col>
          )}

          <Grid.Col span={12}>
            <Text fw={700} size="xl">
              {recipe.title}
            </Text>
            <Text c="dimmed" size="sm">
              by {recipe.username}
            </Text>
          </Grid.Col>
          <Grid.Col span={12}>
            {recipe.tags.map((tag) => (
              <Badge
                mr="xs"
                key={tag}
                variant="gradient"
                gradient={{ from: "orange", to: "yellow", deg: 195 }}
                radius="md"
                size="lg"
                style={{
                  textTransform: "none",
                }}
              >
                {titleize(tag)}
              </Badge>
            ))}
          </Grid.Col>
          <Grid.Col span={12}>
            <Divider />
          </Grid.Col>
          <Grid.Col span={12}>{parse(recipe.description)}</Grid.Col>
        </Grid.Col>
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
