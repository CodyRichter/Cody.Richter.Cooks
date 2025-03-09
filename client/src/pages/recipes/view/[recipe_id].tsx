import { Button, Divider, Grid, Group, Text } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";

import DeleteRecipeModal from "@/common/components/ViewRecipe/DeleteRecipeModal";
import { INITIAL_NETWORK_RESULT } from "@/common/network/constants";
import Recipe from "@/common/types/Recipe";
import RecipeIngredientCard from "@/common/components/ViewRecipe/RecipeIngredientCard";
import RecipeInstructionsCard from "@/common/components/ViewRecipe/RecipeInstructionsCard";
import RecipeLoadingSkeleton from "@/common/components/ViewRecipe/RecipeLoadingSkeleton";
import RecipeNotFound from "@/common/components/ErrorMessages/RecipeNotFound";
import { getRecipeFromNetwork } from "@/utils/network";
import parse from "html-react-parser";
import { useAuth } from "react-oidc-context";
import { useDisclosure } from "@mantine/hooks";
import { useRouter } from "next/router";

export default function ViewRecipe() {
  const router = useRouter();
  const recipe_id: string = router.query.recipe_id as string;

  const [networkStatus, setNetworkStatus] = useState(INITIAL_NETWORK_RESULT);
  const [deleteModalOpened, { open, close }] = useDisclosure(false);

  const auth = useAuth();

  // Memoize the recipe data
  const recipe = useMemo(() => {
    return networkStatus.response as Recipe;
  }, [networkStatus.response]);

  useEffect(() => {
    getRecipeFromNetwork(recipe_id, setNetworkStatus);
  }, [recipe_id]);

  return (
    <>
      {networkStatus.isLoading && <RecipeLoadingSkeleton />}
      {networkStatus.error &&
        (networkStatus.error === "404" ? (
          <RecipeNotFound />
        ) : (
          <Grid>
            <Grid.Col span={12}>
              <Text c="red" fw={500}>
                {networkStatus.error}
              </Text>
            </Grid.Col>
          </Grid>
        ))}
      {!networkStatus.isLoading && !networkStatus.error && recipe && (
        <>
          <Grid>
            <Grid.Col>
              {auth.isAuthenticated && (
                <Grid.Col span={12} className="viewRecipeAdminHeader">
                  <Group>
                    <Text size="md" fw={500} ml="sm">
                      Actions
                    </Text>
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
            opened={deleteModalOpened}
            close={close}
          />
        </>
      )}
    </>
  );
}
