import { Button, Divider, Group, NavLink, Skeleton } from "@mantine/core";
import {
  INITIAL_NETWORK_RESULT_WITH_LOADING,
  NetworkResult,
} from "@/common/network/constants";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import React, { useEffect } from "react";

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

  return (
    <>
      {networkResult.isLoading && <Skeleton h={28} mt="sm" animate={false} />}
      {networkResult.error && <Skeleton h={28} mt="sm" animate={false} />}
      {!networkResult.error && !networkResult.isLoading && (
        <div className="navigationSidebarContainer">
          <Group justify="center" mb="sm" mt="xs">
            <Button
              size="compact-md"
              onClick={handlePaginationBack}
              disabled={paginationIndex === 0}
              leftSection={<IconChevronLeft />}
            >
              Last Page
            </Button>
            <Button
              size="compact-md"
              onClick={handlePaginationForward}
              disabled={paginationIndex >= paginationKeys.length - 1}
              rightSection={<IconChevronRight />}
            >
              Next Page
            </Button>
          </Group>

          <Divider mb="xs" />

          {networkResult.response.recipes.map((recipe: RecipeListItem) => (
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
