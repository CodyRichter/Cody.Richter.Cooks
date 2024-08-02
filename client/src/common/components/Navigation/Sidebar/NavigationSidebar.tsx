import { Container, NavLink, Skeleton, Text } from "@mantine/core";
import React, { useEffect } from "react";

import { BASE_URL } from "@/common/network/constants";
import { IconChevronRight } from "@tabler/icons-react";
import { useRouter } from "next/router";

const LOADING_NO_ERROR = { isLoading: true, error: "" };
const LOADED_NO_ERROR = { isLoading: false, error: "" };

interface RecipeListItem {
  id: string;
  title: string;
}

export default function NavigationSidebar() {
  const router = useRouter();

  const [recipeList, setRecipeList] = React.useState<RecipeListItem[]>([]);
  const [networkStatus, setNetworkStatus] = React.useState({
    isLoading: true,
    error: "",
  });

  useEffect(() => {
    setNetworkStatus(LOADING_NO_ERROR);
    fetch(BASE_URL + "/recipes", {
      method: "GET",
    })
      .then((response) => {
        if (response.ok) {
          response
            .json()
            .then((data) => {
              setRecipeList(data["recipes"] as RecipeListItem[]);
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
  }, []);

  return (
    <>
      {networkStatus.isLoading && <Skeleton h={28} mt="sm" animate={false} />}
      {networkStatus.error && <Skeleton h={28} mt="sm" animate={false} />}
      {!networkStatus.error && !networkStatus.isLoading && (
        <Container mt="sm" ml="xs">
          <Text fw={300} ml="sm" mb="md" size="xl">
            Recipes
          </Text>

          {recipeList.map((recipe) => (
            <NavLink
              key={`sidebar-recipe-${recipe.id}`}
              onClick={() => router.push(`/recipes/view/${recipe.id}`)}
              label={recipe.title}
              leftSection={<IconChevronRight />}
              variant="subtle"
              color="orange"
            />
          ))}
        </Container>
      )}
    </>
  );
}
