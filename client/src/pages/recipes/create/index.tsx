import { Button, Grid, Group, Text } from "@mantine/core";
import {
  INITIAL_NETWORK_RESULT_WITHOUT_LOADING,
  NetworkResult,
} from "@/common/types/constants";
import React, { useState } from "react";

import EditRecipe from "@/common/components/EditRecipe/EditRecipe";
import InvalidPermissionAlert from "@/common/components/ErrorMessages/InvalidPermissionAlert";
import { createRecipeFromNetwork } from "@/utils/network";
import { isRecipeValid } from "@/utils/recipeUtils";
import { notifications } from "@mantine/notifications";
import { useAuth } from "react-oidc-context";
import { useRouter } from "next/router";

export default function CreateRecipe() {
  const router = useRouter();
  const auth = useAuth();

  const [newRecipe, setNewRecipe] = useState<any>({
    id: crypto.randomUUID(),
    title: "",
    description: "",
    tags: [],
    ingredients: [],
    instructions: [],
  });

  const [networkResult, setNetworkResult] = useState<NetworkResult>(
    INITIAL_NETWORK_RESULT_WITHOUT_LOADING
  );

  // Disable the create button if the recipe is invalid or network is loading
  const disableCreateButton: boolean =
    !isRecipeValid(newRecipe) || networkResult.isLoading;

  function createNewRecipe() {
    if (!isRecipeValid(newRecipe)) {
      notifications.show({
        title: "Invalid Recipe",
        message:
          "Please ensure all fields are filled out before creating the recipe.",
        color: "red",
      });
      return;
    }

    createRecipeFromNetwork(newRecipe, setNetworkResult, auth);
  }

  // Handle network result changes
  React.useEffect(() => {
    if (
      !networkResult.isLoading &&
      networkResult.response &&
      !networkResult.error
    ) {
      // Success case
      notifications.show({
        title: "Recipe Created",
        message: "The recipe has been created successfully.",
        color: "teal",
      });
      router.push(`/recipes/view/${newRecipe.id}`);
    } else if (!networkResult.isLoading && networkResult.error) {
      // Error case
      notifications.show({
        title: "Error Creating New Recipe",
        message: networkResult.error,
        color: "red",
      });
    }
  }, [networkResult, newRecipe.id, router]);

  if (!auth.isAuthenticated) {
    return <InvalidPermissionAlert />;
  }

  return (
    <Grid>
      <Grid.Col>
        <Grid.Col span={12}>
          <Text fw={700} size="xl">
            Create New Recipe
          </Text>
        </Grid.Col>

        <Grid.Col span={12}>
          <EditRecipe recipe={newRecipe} setRecipe={setNewRecipe} />
        </Grid.Col>

        <Grid.Col span={12}>
          <Group justify="flex-end">
            <Button
              w="200px"
              loading={networkResult.isLoading}
              disabled={disableCreateButton}
              onClick={createNewRecipe}
            >
              Create Recipe
            </Button>
          </Group>
        </Grid.Col>
      </Grid.Col>
    </Grid>
  );
}
