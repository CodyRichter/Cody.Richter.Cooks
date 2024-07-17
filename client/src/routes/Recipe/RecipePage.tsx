import { Divider, Grid, Text } from "@mantine/core";
import React, { useEffect, useMemo } from "react";

import { BASE_URL } from "src/common/network/constants";
import Recipe from "src/common/types/Recipe";
import RecipeIngredientCard from "./RecipeIngredientCard";
import RecipeInstructionsCard from "./RecipeInstructionsCard";
import RecipeLoadingSkeleton from "./RecipeLoadingSkeleton";
import { useParams } from "react-router-dom";

const LOADING_NO_ERROR = { isLoading: true, error: "" };
const LOADED_NO_ERROR = { isLoading: false, error: "" };

function RecipePage() {
  const { recipeId } = useParams();

  const [networkStatus, setNetworkStatus] = React.useState(LOADING_NO_ERROR);
  const [rawRecipe, setRawRecipe] = React.useState<Recipe | null>(null);

  // Memoize the recipe data
  const recipe = useMemo(() => {
    return rawRecipe;
  }, [rawRecipe]);

  useEffect(() => {
    setNetworkStatus(LOADING_NO_ERROR);
    fetch(
      BASE_URL +
        `/recipes?` +
        new URLSearchParams({
          id: recipeId!,
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
              console.log("Recipe Load Success", data["recipe"]["title"]);
              setRawRecipe(data["recipe"] as Recipe);
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
  }, [recipeId]);

  return (
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
                <Text fw={700} size="xl">
                  {recipe.title}
                </Text>
              </Grid.Col>
              <Grid.Col span={12}>
                <Divider />
              </Grid.Col>
              <Grid.Col span={12}>
                <Text>{recipe.description}</Text>
              </Grid.Col>
            </Grid.Col>
            <Grid.Col span={12}>
              <RecipeIngredientCard ingredients={recipe.ingredients} />
            </Grid.Col>
            <Grid.Col span={12}>
              <RecipeInstructionsCard instructions={recipe.instructions} />
            </Grid.Col>
          </Grid>
        </>
      )}
    </>
  );
}

export default RecipePage;
