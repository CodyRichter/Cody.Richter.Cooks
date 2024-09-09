import { Container, Divider, NavLink, Skeleton, Text } from "@mantine/core";
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

interface NavigationSidebarProps {
  mobileOpened: boolean;
  desktopOpened: boolean;
  toggleMobile(): void;
  toggleDesktop(): void;
}

export default function NavigationSidebar({
  mobileOpened,
  desktopOpened,
  toggleMobile,
  toggleDesktop,
}: NavigationSidebarProps) {
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

  function handleRecipeClick(recipeId: string) {
    router.push(`/recipes/view/${recipeId}`);

    if (mobileOpened) {
      toggleMobile();
    }
  }

  return (
    <>
      {networkStatus.isLoading && <Skeleton h={28} mt="sm" animate={false} />}
      {networkStatus.error && <Skeleton h={28} mt="sm" animate={false} />}
      {!networkStatus.error && !networkStatus.isLoading && (
        <div className="navigationSidebarContainer">
          <Text fw={300} ml="md" mb="sm" mt="xs" size="xl">
            Available Recipes
          </Text>

          <Divider mb="xs" />

          {recipeList.map((recipe) => (
            <NavLink
              w="100%"
              key={`sidebar-recipe-${recipe.id}`}
              onClick={() => handleRecipeClick(recipe.id)}
              label={recipe.title}
              rightSection={<IconChevronRight />}
              color="orange"
            />
          ))}
        </div>
      )}
    </>
  );
}
