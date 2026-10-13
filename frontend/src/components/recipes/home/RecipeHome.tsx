'use client';

import {
  Button,
  CloseButton,
  Divider,
  Flex,
  Loader,
  SimpleGrid,
  Text,
  TextInput,
  Title,
  Container,
  Stack,
  Center,
} from "@mantine/core";

import {
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import React, { useState } from "react";
import RecipePreviewCard from "@/components/recipes/preview/RecipePreviewCard";
import { useRecipeSearch, useRecipes } from "@/hooks/useRecipes";
import { RecipeListSkeleton } from "@/components/loading";
import { ApiErrorAlert } from "@/components/error-handling";
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

        {/* Search runs as you type */}
        <Flex align="center" mih={75}>
          <TextInput
            leftSection={
              isSearchMode && isUpdating ? <Loader size={16} color="orange" /> : <IconSearch size={18} />
            }
            placeholder="Search recipes by name, ingredients, or tags..."
            w="100%"
            value={searchQuery}
            onChange={handleSearchInputChange}
            rightSection={
              searchQuery && <CloseButton onClick={handleSearchClear} aria-label="Clear search" />
            }
          />
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

        <ApiErrorAlert error={error} title="Couldn't load recipes" showRetry={false} />

        {!activeData ? (
          !error && <RecipeListSkeleton />
        ) : (
          <>
            <SimpleGrid
              cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
              spacing="lg"
              verticalSpacing="lg"
              className="refreshable"
              data-refreshing={isUpdating || undefined}
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
