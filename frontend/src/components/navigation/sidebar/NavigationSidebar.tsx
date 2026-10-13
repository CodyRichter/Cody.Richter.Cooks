import {
  Divider,
  Group,
  Kbd,
  NavLink,
  Stack,
  TextInput,
  Skeleton,
  ActionIcon,
  Text,
  CloseButton,
} from "@mantine/core";
import {
  IconArrowNarrowRight,
  IconChefHatFilled,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import React, { useEffect, useRef, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RecipeListItem } from "@/types/Recipe";
import { PaginatedResponse } from "@/types/api";
import { useRecipes, useRecipe } from "@/hooks/useRecipes";
import { useDebouncedValue, useOs } from "@mantine/hooks";
import { SIDEBAR_RECIPES_PER_PAGE } from "@/config/pagination";
import { LinkPendingIcon } from "@/components/navigation/LinkPendingIcon";
import { SidebarListSkeleton } from "@/components/loading";
import { ApiErrorAlert } from "@/components/error-handling";

interface NavigationSidebarProps {
  mobileOpened: boolean;
  desktopOpened: boolean;
  toggleMobile(): void;
  toggleDesktop(): void;
  initialRecipes?: PaginatedResponse<RecipeListItem>;
}

// The OS is only known after mount; the hint keeps its space until then so the input doesn't shift
function SearchShortcutText({ os }: { os: string }) {
  const isMac = os === "macos" || os === "undetermined";
  const isKnown = os === "macos" || os === "windows" || os === "linux";
  return (
    <div dir="ltr" style={{ visibility: isKnown ? "visible" : "hidden" }}>
      <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>+<Kbd>K</Kbd>
    </div>
  );
}

export default function NavigationSidebar({
  mobileOpened,
  toggleMobile,
  initialRecipes,
}: NavigationSidebarProps) {
  const pathname = usePathname();
  const os = useOs();

  const searchbarRef = useRef<HTMLInputElement>(null);
  const [searchText, setSearchText] = React.useState<string>("");
  const [debouncedSearchText] = useDebouncedValue(searchText, 300);

  const [currentPage, setCurrentPage] = useState(1);

  const updateSearchText = (text: string) => {
    setSearchText(text);
    setCurrentPage(1);
  };

  // Load recipes using react-query hook
  const {
    data: recipesResponse,
    isLoading,
    isPlaceholderData,
    error,
  } = useRecipes(
    {
      page: currentPage,
      limit: SIDEBAR_RECIPES_PER_PAGE,
      q: debouncedSearchText || undefined,
    },
    { initialData: currentPage === 1 && !debouncedSearchText ? initialRecipes : undefined }
  );

  const recipes = recipesResponse?.items || [];
  const totalResults = recipesResponse?.total || 0;
  const hasNextPage = recipesResponse?.has_next || false;
  const hasPrevPage = recipesResponse?.has_prev || false;

  const activeRecipeMatch = pathname.match(/^\/recipes\/view\/([^/]+)/);
  const activeRecipeId = activeRecipeMatch ? activeRecipeMatch[1] : null;

  const isActiveRecipeInList = recipes.some((r) => r.id === activeRecipeId);
  const isSearchActive = !!debouncedSearchText;

  const shouldFetchActiveRecipe =
    !!activeRecipeId && !isActiveRecipeInList && !isSearchActive;

  const { data: activeRecipeData } = useRecipe(activeRecipeId || "", {
    enabled: shouldFetchActiveRecipe,
  });

  // Known from the URL alone, so the slot is laid out before the recipe's title arrives
  const showCurrentlyViewing = shouldFetchActiveRecipe && !isLoading;

  // Handle Focus Searchbar on Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (os === "macos" && event.metaKey && event.key === "k") ||
        ((os === "windows" || os === "linux") &&
          event.ctrlKey &&
          event.key === "k")
      ) {
        event.preventDefault();
        searchbarRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [os]);

  function handlePaginationBack() {
    if (hasPrevPage) {
      setCurrentPage(currentPage - 1);
    }
  }

  function handlePaginationForward() {
    if (hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  }

  // The destination's skeleton shows instantly, so the drawer can close right away
  function handleRecipeClick() {
    if (mobileOpened) {
      toggleMobile();
    }
  }

  // Check if a recipe is currently active based on URL
  const isRecipeActive = (recipeId: string) => {
    return pathname === `/recipes/view/${recipeId}`;
  };

  return (
    <Stack justify="space-between" h="100%">
      <Stack gap={0} p="xs" mah="85%">
        <TextInput
          radius="md"
          placeholder="Search recipes"
          rightSection={
            searchText ? (
              <CloseButton
                onClick={() => updateSearchText("")}
                aria-label="Clear search"
              />
            ) : (
              <SearchShortcutText os={os} />
            )
          }
          rightSectionWidth={searchText ? 35 : 80}
          variant="filled"
          ref={searchbarRef}
          value={searchText}
          onChange={(event) => updateSearchText(event.currentTarget.value)}
        />

        <Divider mt="md" mb="sm" />

        {showCurrentlyViewing && activeRecipeId && (
          <>
            <Text size="xs" c="dimmed" fw={700} ml="xs" mt="xs" mb={4} style={{ letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Currently Viewing
            </Text>
            <NavLink
              component={Link}
              href={`/recipes/view/${activeRecipeId}`}
              w="100%"
              miw="44px"
              onClick={handleRecipeClick}
              label={activeRecipeData?.title ?? <Skeleton h={18} w="70%" radius="sm" />}
              rightSection={<IconChefHatFilled size={20} color="var(--mantine-color-orange-4)" />}
              active
              variant="filled"
              className="activeSidebarRecipe"
              style={{
                borderLeft: '3px solid var(--mantine-color-orange-4)',
                backgroundColor: 'light-dark(var(--mantine-color-orange-0), rgba(247, 103, 7, 0.15))',
              }}
            />
            <Divider my="xs" variant="dotted" />
          </>
        )}

        {isLoading ? (
          <SidebarListSkeleton />
        ) : error ? (
          <ApiErrorAlert error={error} size="sm" title="Couldn't load recipes" showRetry={false} />
        ) : (
          <Stack gap={0} className="refreshable" data-refreshing={isPlaceholderData || undefined}>
            {recipes.map((recipe: RecipeListItem) => (
              <NavLink
                key={`sidebar-recipe-${recipe.id}`}
                component={Link}
                href={`/recipes/view/${recipe.id}`}
                w="100%"
                miw="44px"
                onClick={handleRecipeClick}
                label={recipe.title}
                rightSection={
                  isRecipeActive(recipe.id) ? (
                    <IconChefHatFilled size={20} color="var(--mantine-color-orange-4)" />
                  ) : (
                    <LinkPendingIcon size={20} icon={<IconArrowNarrowRight size={20} color="gray" />} />
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
            ))}
          </Stack>
        )}
      </Stack>
      <div>
        <Divider mb="md" />
        <Group justify="center" gap="sm" mb="xl" mt="xs">
          <ActionIcon
            variant="light"
            size="lg"
            radius="md"
            onClick={handlePaginationBack}
            disabled={!hasPrevPage}
            aria-label="Previous page"
          >
            <IconChevronLeft size={18} />
          </ActionIcon>

          <Text size="sm" fw={600} c="dimmed">
            Page {currentPage} of {Math.ceil(totalResults / SIDEBAR_RECIPES_PER_PAGE) || 1}
          </Text>

          <ActionIcon
            variant="light"
            size="lg"
            radius="md"
            onClick={handlePaginationForward}
            disabled={!hasNextPage}
            aria-label="Next page"
          >
            <IconChevronRight size={18} />
          </ActionIcon>
        </Group>
      </div>
    </Stack>
  );
}
