import { Divider, Grid, Text } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";

import { BASE_URL } from "@/common/network/constants";
import Recipe from "@/common/types/Recipe";
import RecipeIngredientCard from "@/common/components/ViewRecipe/RecipeIngredientCard";
import RecipeInstructionsCard from "@/common/components/ViewRecipe/RecipeInstructionsCard";
import RecipeLoadingSkeleton from "@/common/components/ViewRecipe/RecipeLoadingSkeleton";
import { useRouter } from "next/router";

const LOADING_NO_ERROR = { isLoading: true, error: "" };
const LOADED_NO_ERROR = { isLoading: false, error: "" };

export default function ViewRecipe() {
  const router = useRouter();
  const recipe_id: string = router.query.recipe_id as string;

  const [networkStatus, setNetworkStatus] = useState(LOADING_NO_ERROR);
  const [rawRecipe, setRawRecipe] = useState<Recipe | null>(null);

  // Memoize the recipe data
  const recipe = useMemo(() => {
    return rawRecipe;
  }, [rawRecipe]);

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
  }, [recipe_id]);

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
