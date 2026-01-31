import { ActionIcon, Button, Grid, Group, Text } from "@mantine/core";
import {
  INITIAL_NETWORK_RESULT_WITHOUT_LOADING,
  INITIAL_NETWORK_RESULT_WITH_LOADING,
  NetworkResult,
} from "@/types/constants";
import { getRecipeFromNetwork, updateRecipeFromNetwork } from "@/utils/network";
import { useEffect, useState } from "react";

import EditRecipe from "@/components/recipes/edit/EditRecipe";
import { IconChevronLeft } from "@tabler/icons-react";
import InvalidPermissionAlert from "@/components/error-handling/InvalidPermissionAlert";
import Recipe from "@/types/Recipe";
import RecipeLoadingSkeleton from "@/components/recipes/view/RecipeLoadingSkeleton";
import RecipeNotFound from "@/components/error-handling/RecipeNotFound";
import { isRecipeValid } from "@/utils/recipeUtils";
import { notifications } from "@mantine/notifications";
import { useAuth } from "react-oidc-context";
import { useRouter } from "next/router";

export default function EditRecipePage() {
  const router = useRouter();
  const auth = useAuth();
  const recipe_id: string = router.query.recipe_id as string;

  const [initialDataLoadStatus, setInitialDataLoadStatus] = useState(
    INITIAL_NETWORK_RESULT_WITH_LOADING
  );
  const [updateNetworkResult, setUpdateNetworkResult] = useState<NetworkResult>(
    INITIAL_NETWORK_RESULT_WITHOUT_LOADING
  );
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  // Load the recipe from the server
  useEffect(() => {
    getRecipeFromNetwork(recipe_id, setInitialDataLoadStatus);
  }, [recipe_id]);

  // Set the recipe state when the network status changes
  useEffect(() => {
    if (initialDataLoadStatus.response) {
      setRecipe(initialDataLoadStatus.response as Recipe);
    }
  }, [initialDataLoadStatus.response]);

  // Handle update network result changes
  useEffect(() => {
    if (
      !updateNetworkResult.isLoading &&
      updateNetworkResult.response &&
      !updateNetworkResult.error
    ) {
      // Success case
      notifications.show({
        title: "Recipe Updated",
        message: "The recipe has been updated successfully.",
        color: "teal",
      });
      router.push(`/recipes/view/${recipe?.id}`);
    } else if (!updateNetworkResult.isLoading && updateNetworkResult.error) {
      // Error case
      notifications.show({
        title: "Error Updating Recipe",
        message: updateNetworkResult.error,
        color: "red",
      });
    }
  }, [updateNetworkResult, recipe?.id, router]);

  // Disable the edit button if the recipe is invalid or network is loading
  const disableEditButton: boolean =
    !isRecipeValid(recipe) || updateNetworkResult.isLoading;

  // Save the recipe to the server
  function editRecipe() {
    if (!recipe || !isRecipeValid(recipe)) {
      notifications.show({
        title: "Invalid Recipe",
        message:
          "Please ensure all fields are filled out before updating the recipe.",
        color: "red",
      });
      return;
    }

    updateRecipeFromNetwork(recipe, setUpdateNetworkResult, auth);
  }

  if (!auth.isAuthenticated) {
    return <InvalidPermissionAlert />;
  }

  if (initialDataLoadStatus.isLoading || !recipe) {
    return <RecipeLoadingSkeleton />;
  }

  if (initialDataLoadStatus.error) {
    return (
      <Grid>
        <Grid.Col span={12}>
          <Text c="red" fw={500}>
            {initialDataLoadStatus.error}
          </Text>
        </Grid.Col>
      </Grid>
    );
  }

  if (initialDataLoadStatus.error === "404") {
    return <RecipeNotFound />;
  }

  return (
    <>
      <Grid>
        <Grid.Col>
          <Grid.Col span={12}>
            <Group>
              <ActionIcon
                onClick={() => {
                  router.push(`/recipes/view/${recipe.id}`);
                }}
                variant="subtle"
                size="lg"
                color="black"
              >
                <IconChevronLeft />
              </ActionIcon>
              <Text fw={700} size="xl">
                Edit Recipe
              </Text>
            </Group>
          </Grid.Col>

          <Grid.Col span={12}>
            <EditRecipe recipe={recipe} setRecipe={setRecipe} />
          </Grid.Col>

          <Grid.Col span={12}>
            <Group justify="flex-end">
              <Button
                w="200px"
                loading={updateNetworkResult.isLoading}
                disabled={disableEditButton}
                onClick={editRecipe}
              >
                Save Recipe
              </Button>
            </Group>
          </Grid.Col>
        </Grid.Col>
      </Grid>
    </>
  );
}
