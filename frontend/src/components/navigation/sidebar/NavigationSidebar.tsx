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
} from "@mantine/core";
import {
  IconArrowNarrowRight,
  IconChefHatFilled,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import React, { useEffect, useRef, useState } from "react";

import { getOperatingSystem } from "@/utils/deviceUtils";
import { recipeApi } from "@/services/apiServices";
import { useFocusWithin, useDebouncedValue } from "@mantine/hooks";
import { useRouter, usePathname } from "next/navigation";
import { RecipeListItem } from "@/types/Recipe";



interface NavigationSidebarProps {
  mobileOpened: boolean;
  desktopOpened: boolean;
  toggleMobile(): void;
  toggleDesktop(): void;
}

function SearchShortcutText({ os }: { os: string }) {
  if (os === "macOS") {
    return (
      <div dir="ltr">
        <Kbd>⌘</Kbd>+<Kbd>K</Kbd>
      </div>
    );
  } else if (os === "Windows" || os === "Linux") {
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
  const [os, setOs] = useState<string>("Unknown");

  useEffect(() => {
    setOs(getOperatingSystem());
  }, []);

  const searchbarRef = useRef<HTMLInputElement>(null);
  const { focused: searchbarFocused } = useFocusWithin();
  const [searchText, setSearchText] = React.useState<string>("");
  const [debouncedSearchText] = useDebouncedValue(searchText, 300);

  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  // Reset to page 1 when search text changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchText]);

  useEffect(() => {
    const loadRecipes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await recipeApi.getRecipes({
          page: currentPage,
          limit: 10,
          q: debouncedSearchText || undefined
        });

        // Response is now a paginated response with metadata
        setRecipes(response.items);
        setHasNextPage(response.has_next);
        setHasPrevPage(response.has_prev);
      } catch (err: unknown) {
        console.error('Failed to load recipes:', err);
        setError(err instanceof Error ? err.message : 'Failed to load recipes');
        setRecipes([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecipes();
  }, [currentPage, debouncedSearchText]);

  // Handle Focus Searchbar on Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (os === "macOS" && event.metaKey && event.key === "k") ||
        ((os === "Windows" || os === "Linux") &&
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
          rightSection={<SearchShortcutText os={os} />}
          rightSectionWidth={os === "macOS" ? 65 : 80}
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
          recipes.map((recipe: RecipeListItem) => (
            <React.Fragment key={`sidebar-recipe-${recipe.id}`}>
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
              />
              <Divider color="#eee" />
            </React.Fragment>
          ))
        )}
      </Stack>
      <div>
        <Divider mb="md" color="#eee" />
        <Group justify="space-between" mb="xl" mt="xs">
          <Button
            size="compact-md"
            variant="light"
            onClick={handlePaginationBack}
            disabled={!hasPrevPage}
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
            disabled={!hasNextPage}
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
