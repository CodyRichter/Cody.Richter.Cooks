import { ActionIcon, Alert, Button, Grid, Group, Text } from "@mantine/core";
import { useEffect, useState } from "react";

import { BASE_URL } from "@/common/network/constants";
import EditRecipe from "@/common/components/EditRecipe/EditRecipe";
import { IconChevronLeft } from "@tabler/icons-react";
import InvalidPermissionAlert from "@/common/components/Permissions/InvalidPermissionAlert";
import Recipe from "@/common/types/Recipe";
import RecipeLoadingSkeleton from "@/common/components/ViewRecipe/RecipeLoadingSkeleton";
import { notifications } from "@mantine/notifications";
import { useAuth } from "react-oidc-context";
import { useRouter } from "next/router";

const LOADING_NO_ERROR = { isLoading: true, error: "" };
const LOADED_NO_ERROR = { isLoading: false, error: "" };

export default function EditRecipePage() {
  const router = useRouter();
  const auth = useAuth();
  const recipe_id: string = router.query.recipe_id as string;

  const [networkStatus, setNetworkStatus] = useState(LOADING_NO_ERROR);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isEditButtonLoading, setIsEditButtonLoading] = useState(false);

  // Load the recipe from the server
  useEffect(() => {
    setNetworkStatus(LOADING_NO_ERROR);
    if (!recipe_id) {
      setNetworkStatus({
        isLoading: false,
        error: "No recipe ID provided. Please try again later.",
      });
      return;
    }
    fetch(
      BASE_URL +
        `/recipes?` +
        new URLSearchParams({
          id: recipe_id!,
        }),
      {
        method: "GET",
      }
    )
      .then((response) => {
        if (response.ok) {
          response
            .json()
            .then((data) => {
              setRecipe(data["recipe"] as Recipe);
              setNetworkStatus(LOADED_NO_ERROR);
            })
            .catch((e) => {
              console.error("Recipe Load Error", e);
              setNetworkStatus({
                isLoading: false,
                error:
                  "An error occurred while fetching the recipe. Please try again later.",
              });
            });
        }
      })
      .catch((e) => {
        console.error("Recipe Load Error", e);
        setNetworkStatus({
          isLoading: false,
          error:
            "An error occurred while fetching the recipe. Please try again later.",
        });
      });
  }, [recipe_id]);

  function isRecipeValid(): boolean {
    if (!recipe) {
      return false;
    }

    const baseFieldsValid =
      !!recipe &&
      !!recipe.id &&
      !!recipe.title &&
      recipe.title.length > 0 &&
      !!recipe.description &&
      recipe.description.length > 0 &&
      recipe.ingredients.length > 0 &&
      recipe.instructions.length > 0;

    // Check if all ingredients have a name and quantity
    const ingredientsValid = recipe.ingredients.every(
      (ingredient) =>
        !!ingredient.name && !!ingredient.quantity && !!ingredient.unit
    );

    // Check if all instructions have a step
    const instructionsValid = recipe.instructions.every(
      (instruction) =>
        !!instruction.step_number &&
        !!instruction.title &&
        !!instruction.description
    );

    return baseFieldsValid && ingredientsValid && instructionsValid;
  }

  // Disable the create button if the recipe is invalid
  const disableEditButton: boolean = !isRecipeValid();

  // Save the recipe to the server
  function editRecipe() {
    setIsEditButtonLoading(true);

    if (!recipe || !isRecipeValid) {
      notifications.show({
        title: "Invalid Recipe",
        message:
          "Please ensure all fields are filled out before updating the recipe.",
        color: "red",
      });
      setIsEditButtonLoading(false);
      return;
    }

    fetch(`${BASE_URL}/recipes`, {
      method: "POST",
      body: JSON.stringify(recipe),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.user?.id_token}`,
      },
    })
      .then((response) => {
        if (response.ok) {
          response
            .json()
            .then((data) => {
              // Notify of success and redirect to the recipe's page
              notifications.show({
                title: "Recipe Updated",
                message: "The recipe has been updated successfully.",
                color: "teal",
              });
              router.push(`/recipes/view/${recipe.id}`);
            })
            .catch((e) => {
              console.error("Unable to Parse Recipe", e);
              notifications.show({
                title: "Error Creating New Recipe",
                message: `An error has occurred while saving the recipe. Please try again later. Details (parse): [${e}]`,
                color: "red",
              });
            });
        } else {
          notifications.show({
            title: "Error Creating New Recipe",
            message: `An error has occurred while saving the recipe. Please try again later. Details (response): [${response.status}]`,
            color: "red",
          });
        }
      })
      .catch((e) => {
        console.error("Unable to Create Recipe", e);
        notifications.show({
          title: "Error Creating New Recipe",
          message: `An error has occurred while saving the recipe. Please try again later. Details (load): [${e}]`,
          color: "red",
        });
      })
      .finally(() => {
        setIsEditButtonLoading(false);
      });
  }

  return !auth.isAuthenticated ? (
    <InvalidPermissionAlert />
  ) : (
    <>
      {networkStatus.isLoading && <RecipeLoadingSkeleton />}
      {networkStatus.error && (
        <Grid>
          <Grid.Col span={12}>
            <Text c="red" fw={500}>
              {networkStatus.error}
            </Text>
          </Grid.Col>
        </Grid>
      )}
      {!networkStatus.isLoading && !networkStatus.error && recipe && (
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
                    loading={isEditButtonLoading}
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
      )}
    </>
  );
}
