import {
  Button,
  Collapse,
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

import { useRouter, usePathname } from "next/navigation";
import { RecipeListItem } from "@/types/Recipe";
import { useRecipes, useRecipe } from "@/hooks/useRecipes";
import { useFocusWithin, useDebouncedValue, useOs } from "@mantine/hooks";



interface NavigationSidebarProps {
  mobileOpened: boolean;
  desktopOpened: boolean;
  toggleMobile(): void;
  toggleDesktop(): void;
}

function SearchShortcutText({ os }: { os: string }) {
  if (os === "macos") {
    return (
      <div dir="ltr">
        <Kbd>⌘</Kbd>+<Kbd>K</Kbd>
      </div>
    );
  } else if (os === "windows" || os === "linux") {
    return (
      <div dir="ltr">
        <Kbd>Ctrl</Kbd>+<Kbd>K</Kbd>
      </div>
    );
  } else {
    return null;
  }
}

export default function NavigationSidebar({
  mobileOpened,
  toggleMobile,
}: NavigationSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const os = useOs();

  const searchbarRef = useRef<HTMLInputElement>(null);
  const { focused: searchbarFocused } = useFocusWithin();
  const [searchText, setSearchText] = React.useState<string>("");
  const [debouncedSearchText] = useDebouncedValue(searchText, 300);

  const [currentPage, setCurrentPage] = useState(1);

  // Load recipes using react-query hook
  const {
    data: recipesResponse,
    isLoading,
    error: queryError
  } = useRecipes({
    page: currentPage,
    limit: 10,
    q: debouncedSearchText || undefined
  });

  const recipes = recipesResponse?.items || [];
  const totalResults = recipesResponse?.total || 0;
  const hasNextPage = recipesResponse?.has_next || false;
  const hasPrevPage = recipesResponse?.has_prev || false;
  const error = queryError ? (queryError as Error).message : null;

  const activeRecipeMatch = pathname.match(/^\/recipes\/view\/([^/]+)/);
  const activeRecipeId = activeRecipeMatch ? activeRecipeMatch[1] : null;

  const isActiveRecipeInList = recipes.some((r) => r.id === activeRecipeId);
  const isSearchActive = !!debouncedSearchText;

  const shouldFetchActiveRecipe =
    !!activeRecipeId && !isActiveRecipeInList && !isSearchActive;

  const { data: activeRecipeData } = useRecipe(activeRecipeId || "", {
    enabled: shouldFetchActiveRecipe,
  });

  const displayRecipes = [...recipes];
  let injectedRecipeId: string | null = null;

  if (shouldFetchActiveRecipe && activeRecipeData) {
    if (!displayRecipes.some((r) => r.id === activeRecipeData.id)) {
      displayRecipes.unshift({
        id: activeRecipeData.id,
        title: activeRecipeData.title,
        cooking_time: activeRecipeData.cooking_time,
        serving_size: activeRecipeData.serving_size,
        created_at: activeRecipeData.created_at,
      });
      injectedRecipeId = activeRecipeData.id;
    }
  }

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

  function handleRecipeClick(recipeId: string) {
    router.push(`/recipes/view/${recipeId}`);

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
                onClick={() => setSearchText("")}
                aria-label="Clear search"
              />
            ) : (
              <SearchShortcutText os={os} />
            )
          }
          rightSectionWidth={searchText ? 35 : (os === "macos" ? 65 : 80)}
          variant="filled"
          ref={searchbarRef}
          value={searchText}
          onChange={(event) => setSearchText(event.currentTarget.value)}
        />

        <Collapse in={searchbarFocused} mt="sm">
          <Button fullWidth disabled={searchText.length === 0}>
            Search
          </Button>
        </Collapse>

        <Divider mt="md" mb="sm" color="#eee" />

        {isLoading ? (
          <Stack gap="md" mt="md">
            {[...Array(10)].map((_, idx) => (
              <Skeleton
                h={22}
                w="90%"
                radius="sm"
                key={`sidebar-skeleton-${idx}`}
                ml="sm"
              />
            ))}
          </Stack>
        ) : error ? (
           <div style={{ padding: 'var(--mantine-spacing-md)', color: 'var(--mantine-color-error)' }}>
             {error}
           </div>
        ) : (
          displayRecipes.map((recipe: RecipeListItem) => (
            <React.Fragment key={`sidebar-recipe-${recipe.id}`}>
              {injectedRecipeId === recipe.id && (
                <Text size="xs" c="dimmed" fw={700} ml="xs" mt="xs" mb={4} style={{ letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  Currently Viewing
                </Text>
              )}
              <NavLink
                w="100%"
                miw="44px"
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
                style={injectedRecipeId === recipe.id ? {
                  borderLeft: '3px solid var(--mantine-color-orange-4)',
                  backgroundColor: 'var(--mantine-color-orange-0)',
                } : undefined}
              />
              {injectedRecipeId === recipe.id && <Divider my="xs" variant="dotted" />}
            </React.Fragment>
          ))
        )}
      </Stack>
      <div>
        <Divider mb="md" color="#eee" />
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
            Page {currentPage} of {Math.ceil(totalResults / 10) || 1}
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
