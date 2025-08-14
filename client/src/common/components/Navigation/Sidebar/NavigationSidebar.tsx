import { Button, Divider, Group, NavLink, Stack } from "@mantine/core";
import {
  INITIAL_NETWORK_RESULT_WITH_LOADING,
  NetworkResult,
} from "@/common/types/constants";
import {
  IconArrowNarrowRight,
  IconChefHatFilled,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import React, { useEffect } from "react";

import NavigationSkeleton from "./NavigationSkeleton";
import { listRecipesFromNetwork } from "@/utils/network";
import { useRouter } from "next/router";

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

  const [networkResult, setNetworkResult] = React.useState<NetworkResult>(
    INITIAL_NETWORK_RESULT_WITH_LOADING
  );

  const [paginationKeys, setPaginationKeys] = React.useState<any>([undefined]);
  const [paginationIndex, setPaginationIndex] = React.useState<number>(0);

  useEffect(() => {
    if (paginationKeys.length > 0) {
      listRecipesFromNetwork(paginationKeys[paginationIndex], setNetworkResult);
    } else {
      listRecipesFromNetwork(undefined, setNetworkResult);
    }
  }, [paginationIndex]);

  useEffect(() => {
    // If there is a pagination key in the response, add it to the list of keys.
    // This will allow us to paginate through the results. However, we need to
    // make sure that we don't add the same key multiple times.
    if (
      networkResult.response?.paginationKey &&
      networkResult.response.paginationKey !== undefined
    ) {
      if (!paginationKeys.includes(networkResult.response.paginationKey)) {
        setPaginationKeys([
          ...paginationKeys,
          networkResult.response.paginationKey,
        ]);
      }
    }
  }, [networkResult.response]);

  function handlePaginationBack() {
    if (paginationIndex > 0) {
      setPaginationIndex(paginationIndex - 1);
    }
  }

  function handlePaginationForward() {
    if (paginationIndex < paginationKeys.length - 1) {
      setPaginationIndex(paginationIndex + 1);
    }
  }

  function handleRecipeClick(recipeId: string) {
    router.push(`/recipes/view/${recipeId}`);

    if (mobileOpened) {
      toggleMobile();
    }
  }

  // Check if a recipe is currently active based on URL
  const isRecipeActive = (recipeId: string) => {
    return router.asPath === `/recipes/view/${recipeId}`;
  };

  if (networkResult.isLoading) {
    return <NavigationSkeleton />;
  }

  if (networkResult.error) {
    return <NavigationSkeleton />;
  }

  return (
    <Stack justify="space-between" h="100%">
      <Stack gap={0} p="xs" mah="85%">
        {networkResult.response.recipes.map((recipe: RecipeListItem) => (
          <>
            <NavLink
              w="100%"
              miw="44px"
              key={`sidebar-recipe-${recipe.id}`}
              onClick={() => handleRecipeClick(recipe.id)}
              label={recipe.title}
              rightSection={
                isRecipeActive(recipe.id) ? (
                  <IconChefHatFilled size={20} color="#e2a478" />
                ) : (
                  <IconArrowNarrowRight size={20} color="gray" />
                )
              }
              active={isRecipeActive(recipe.id)}
              variant={isRecipeActive(recipe.id) ? "filled" : "subtle"}
              className={
                isRecipeActive(recipe.id)
                  ? "activeSidebarRecipe"
                  : "sidebarRecipe"
              }
            />
            <Divider color="#eee" />
          </>
        ))}
      </Stack>
      <div>
        <Divider mb="md" color="#eee" />
        <Group justify="space-between" mb="xl" mt="xs">
          <Button
            size="compact-md"
            variant="light"
            onClick={handlePaginationBack}
            disabled={paginationIndex === 0}
            leftSection={<IconChevronLeft size={16} />}
            ml="sm"
            w="40%"
            radius="md"
          >
            Previous
          </Button>
          <Button
            size="compact-md"
            variant="light"
            onClick={handlePaginationForward}
            disabled={paginationIndex >= paginationKeys.length - 1}
            rightSection={<IconChevronRight size={16} />}
            mr="sm"
            w="40%"
            radius="md"
          >
            Next
          </Button>
        </Group>
      </div>
    </Stack>
  );
}
