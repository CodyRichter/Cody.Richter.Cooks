'use client';

import {
  ActionIcon,
  Button,
  Divider,
  Flex,
  SimpleGrid,
  Text,
  TextInput,
  Title,
  Container,
  Stack,
  Center,
  Alert,
} from "@mantine/core";

import {
  IconSearch,
  IconAlertCircle,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import React, { useState } from "react";
import RecipePreviewCard from "@/components/recipes/preview/RecipePreviewCard";
import { useRecipeSearch, useRecipes } from "@/hooks/useRecipes";
import { RecipeListSkeleton } from "@/components/loading";
import { HOME_RECIPES_PER_PAGE } from "@/config/pagination";
import { RecipeListItem } from "@/types/Recipe";
import { PaginatedResponse } from "@/types/api";

const MINIMUM_SEARCH_LENGTH = 3;

interface RecipeHomeProps {
  // First page rendered on the server; absent when the backend was unavailable
  initialRecipes?: PaginatedResponse<RecipeListItem>;
}

export default function RecipeHome({ initialRecipes }: RecipeHomeProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const isSearchMode = searchQuery.length >= MINIMUM_SEARCH_LENGTH;

  const {
    data: searchResults,
    error: searchError,
    isFetching: isSearchFetching,
    canSearch,
    isSearching,
  } = useRecipeSearch(searchQuery);

  const {
    data: recipePage,
    error: recipesError,
    isPlaceholderData: isPagePlaceholder,
  } = useRecipes(
    { page: currentPage, limit: HOME_RECIPES_PER_PAGE },
    { initialData: currentPage === 1 ? initialRecipes : undefined }
  );

  // Until the first search results arrive, keep the current list on screen
  const activeData = isSearchMode ? searchResults ?? recipePage : recipePage;
  const isUpdating = isSearchMode
    ? isSearching || isSearchFetching || (!searchResults && !searchError)
    : isPagePlaceholder;
  const recipes = activeData?.items ?? [];
  const error = isSearchMode ? searchError : recipesError;

  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.currentTarget.value);
    setCurrentPage(1);
  };

  const handleSearchClear = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  return (
    <Container size="xl" px="md">
      <Stack gap="lg">
        <Title ta="center" fw={700} order={1}
          style={{
            letterSpacing: "-0.7px",
          }}
        >
          Welcome to Cody Richter Cooks
        </Title>

        <Divider />

        {/* Search runs as you type; the button is a visual affordance */}
        <Flex
          gap="sm"
          justify="flex-start"
          align="center"
          direction="row"
          wrap="nowrap"
          mih={75}
        >
          <TextInput
            leftSection={<IconSearch />}
            placeholder="Search recipes by name, ingredients, or tags..."
            style={{ width: "90%" }}
            value={searchQuery}
            onChange={handleSearchInputChange}
            rightSection={
              searchQuery && (
                <ActionIcon
                  variant="subtle"
                  onClick={handleSearchClear}
                  size="sm"
                  aria-label="Clear search"
                >
                  ×
                </ActionIcon>
              )
            }
          />
          <ActionIcon
            hiddenFrom="sm"
            radius="md"
            size="lg"
            disabled={!canSearch}
            loading={isSearchMode && isUpdating}
            aria-label="Search"
          >
            <IconSearch />
          </ActionIcon>
          <Button
            visibleFrom="sm"
            size="sm"
            miw={90}
            disabled={!canSearch}
            loading={isSearchMode && isUpdating}
          >
            Search
          </Button>
        </Flex>

        {isSearchMode && (
          <Text size="sm" c="dimmed" ta="center">
            {isUpdating
              ? `Searching for "${searchQuery}"...`
              : `Found ${recipes.length} recipe${recipes.length !== 1 ? 's' : ''} for "${searchQuery}"`
            }
          </Text>
        )}

        <Divider />

        {!isSearchMode && (
          <Text ta="center" size="lg" mb="xl">
            Cody Richter Cooks is the home of all of my recipes, cooking tips, and
            more! I&apos;m a self-taught home cook who loves to share my passion for
            cooking with others. I hope you enjoy my recipes as much as I do. Below
            you can find some of my favorite recipes.
          </Text>
        )}

        {error && (
          <Alert icon={<IconAlertCircle size="1rem" />} color="red" variant="light">
            {error.message || 'Failed to load recipes. Please try again.'}
          </Alert>
        )}

        {!activeData ? (
          !error && <RecipeListSkeleton />
        ) : (
          <>
            <SimpleGrid
              cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
              spacing="lg"
              verticalSpacing="lg"
              style={{ opacity: isUpdating ? 0.6 : 1, transition: "opacity 150ms ease" }}
            >
              {recipes.map((recipe) => (
                <RecipePreviewCard
                  key={recipe.id}
                  recipe={recipe}
                />
              ))}
            </SimpleGrid>

            {!isSearchMode && recipePage && (recipePage.has_next || recipePage.has_prev) && (
              <Center mt="xl">
                <Flex gap="sm" align="center">
                  <Button
                    variant="light"
                    leftSection={<IconChevronLeft size={16} />}
                    disabled={!recipePage.has_prev || isUpdating}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                  >
                    Previous
                  </Button>
                  <Text size="sm" c="dimmed">
                    Page {currentPage}
                  </Text>
                  <Button
                    variant="light"
                    rightSection={<IconChevronRight size={16} />}
                    disabled={!recipePage.has_next || isUpdating}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    Next
                  </Button>
                </Flex>
              </Center>
            )}

            {!isUpdating && recipes.length === 0 && (
              <Center py="xl">
                <Stack align="center" gap="sm">
                  <Text size="lg" c="dimmed">
                    {isSearchMode
                      ? `No recipes found for "${searchQuery}"`
                      : 'No recipes available'
                    }
                  </Text>
                  {isSearchMode && (
                    <Button variant="light" onClick={handleSearchClear}>
                      Clear Search
                    </Button>
                  )}
                </Stack>
              </Center>
            )}
          </>
        )}
      </Stack>
    </Container>
  );
}
