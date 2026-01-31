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

import { IconSearch, IconAlertCircle } from "@tabler/icons-react";
import React, { useState } from "react";
import RecipePreviewCard from "@/components/recipes/preview/RecipePreviewCard";
import { useMediaQuery } from "@mantine/hooks";
import { useRecipeSearch, useRecipes } from "@/hooks/useRecipes";
import { RecipeListSkeleton } from "@/components/loading";
import { useCallback, useMemo } from "react";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

export default function Home() {
  const isMobile = useMediaQuery("(max-width: 50em)");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const minimumSearchLength = 3;

  // Search functionality with debouncing
  const {
    data: searchResultsResponse,
    isLoading: isSearchLoading,
    error: searchError,
    canSearch,
    isSearching
  } = useRecipeSearch(searchQuery);

  // Load all recipes when not searching
  const {
    data: allRecipesResponse,
    isLoading: isRecipesLoading,
    error: recipesError
  } = useRecipes({ page: currentPage, limit: 12 });

  // Derive search mode from query length
  const shouldBeInSearchMode = searchQuery.length >= minimumSearchLength;

  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.length >= minimumSearchLength) {
      setIsSearchMode(true);
      setCurrentPage(1);
    }
  }, [searchQuery, minimumSearchLength]);

  const handleSearchClear = useCallback(() => {
    setSearchQuery("");
    setIsSearchMode(false);
    setCurrentPage(1);
  }, []);

  // Memoize search input handler to prevent unnecessary re-renders
  const handleSearchInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = event.currentTarget.value;
    setSearchQuery(newQuery);

    // Auto-toggle search mode and reset page
    const newShouldBeInSearchMode = newQuery.length >= minimumSearchLength;
    if (isSearchMode !== newShouldBeInSearchMode) {
      setIsSearchMode(newShouldBeInSearchMode);
      setCurrentPage(1);
    }
  }, [isSearchMode, minimumSearchLength]);

  // Memoize key down handler
  const handleSearchKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearchSubmit();
    }
  }, [handleSearchSubmit]);

  // Memoize which recipes to display to prevent unnecessary re-computations
  const displayRecipes = useMemo(() => {
    if (shouldBeInSearchMode) {
      return searchResultsResponse?.items || [];
    }
    return allRecipesResponse?.items || [];
  }, [shouldBeInSearchMode, searchResultsResponse, allRecipesResponse]);

  const isLoading = useMemo(() =>
    shouldBeInSearchMode ? (isSearchLoading || isSearching) : isRecipesLoading,
    [shouldBeInSearchMode, isSearchLoading, isSearching, isRecipesLoading]
  );

  const error = useMemo(() =>
    shouldBeInSearchMode ? searchError : recipesError,
    [shouldBeInSearchMode, searchError, recipesError]
  );

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

        {/* Search Section */}
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
            onKeyDown={handleSearchKeyDown}
            rightSection={
              searchQuery && (
                <ActionIcon
                  variant="subtle"
                  onClick={handleSearchClear}
                  size="sm"
                >
                  ×
                </ActionIcon>
              )
            }
          />
          {isMobile ? (
            <ActionIcon
              radius="md"
              size="lg"
              onClick={handleSearchSubmit}
              disabled={!canSearch}
              loading={isSearching}
            >
              <IconSearch />
            </ActionIcon>
          ) : (
            <Button
              size="sm"
              miw={90}
              onClick={handleSearchSubmit}
              disabled={!canSearch}
              loading={isSearching}
            >
              Search
            </Button>
          )}
        </Flex>

        {/* Search Status */}
        {shouldBeInSearchMode && (
          <Text size="sm" c="dimmed" ta="center">
            {isLoading
              ? `Searching for "${searchQuery}"...`
              : `Found ${displayRecipes.length} recipe${displayRecipes.length !== 1 ? 's' : ''} for "${searchQuery}"`
            }
          </Text>
        )}

        <Divider />

        {!shouldBeInSearchMode && (
          <Text ta="center" size="lg" mb="xl">
            Cody Richter Cooks is the home of all of my recipes, cooking tips, and
            more! I&apos;m a self-taught home cook who loves to share my passion for
            cooking with others. I hope you enjoy my recipes as much as I do. Below
            you can find some of my favorite recipes.
          </Text>
        )}

        {/* Error Display */}
        {error && (
          <Alert icon={<IconAlertCircle size="1rem" />} color="red" variant="light">
            {error.message || 'Failed to load recipes. Please try again.'}
          </Alert>
        )}

        {/* Recipe Grid */}
        {isLoading && displayRecipes.length === 0 ? (
          <RecipeListSkeleton count={6} />
        ) : (
          <>
            <SimpleGrid
              cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
              spacing="lg"
              verticalSpacing="lg"
            >
              {displayRecipes.map((recipe) => (
                <RecipePreviewCard
                  key={recipe.id}
                  recipe={recipe}
                />
              ))}
            </SimpleGrid>

            {/* Pagination Controls */}
            {!shouldBeInSearchMode && allRecipesResponse && (allRecipesResponse.has_next || allRecipesResponse.has_prev) && (
              <Center mt="xl">
                <Flex gap="sm" align="center">
                  <Button
                    variant="light"
                    leftSection={<IconChevronLeft size={16} />}
                    disabled={!allRecipesResponse.has_prev}
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
                    disabled={!allRecipesResponse.has_next}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    Next
                  </Button>
                </Flex>
              </Center>
            )}

            {/* No Results Message */}
            {!isLoading && displayRecipes.length === 0 && (
              <Center py="xl">
                <Stack align="center" gap="sm">
                  <Text size="lg" c="dimmed">
                    {shouldBeInSearchMode
                      ? `No recipes found for "${searchQuery}"`
                      : 'No recipes available'
                    }
                  </Text>
                  {shouldBeInSearchMode && (
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
