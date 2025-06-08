import {
  ActionIcon,
  Button,
  Divider,
  Flex,
  SimpleGrid,
  Text,
  TextInput,
  Title,
  em,
} from "@mantine/core";

import { IconSearch } from "@tabler/icons-react";
import React from "react";
import RecipePreviewCard from "@/common/components/RecipePreviewCard/RecipePreviewCard";
import { useMediaQuery } from "@mantine/hooks";

export default function Index() {
  const isMobile = useMediaQuery("(max-width: 50em)");
  const [searchQuery, setSearchQuery] = React.useState("");
  const minimumSearchLength = 3;

  function searchRecipes() {
    if (searchQuery.length < minimumSearchLength) {
      return;
    }
  }

  return (
    <>
      <Title ta="center" fw={400} order={1}>
        Welcome to Cody Richter Cooks
      </Title>

      <Divider mt="lg" />

      <Flex
        gap="sm"
        justify="flex-start"
        align="center"
        direction="row"
        wrap="nowrap"
        mih={75}
        ml="lg"
      >
        <TextInput
          leftSection={<IconSearch />}
          placeholder="Search Recipes"
          style={{ width: "90%" }}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
        />
        {isMobile ? (
          <ActionIcon
            radius="md"
            size="lg"
            onClick={searchRecipes}
            disabled={searchQuery.length < minimumSearchLength}
          >
            <IconSearch />
          </ActionIcon>
        ) : (
          <Button
            size="sm"
            miw={90}
            onClick={searchRecipes}
            disabled={searchQuery.length < minimumSearchLength}
          >
            Search
          </Button>
        )}
      </Flex>

      <Divider mb="lg" />

      <Text ta="center" size="lg" mb="xl">
        Cody Richter Cooks is the home of all of my recipes, cooking tips, and
        more! I'm a self-taught home cook who loves to share my passion for
        cooking with others. I hope you enjoy my recipes as much as I do. Below
        you can find some of my favorite recipes.
      </Text>

      <SimpleGrid cols={2} spacing="lg" verticalSpacing="lg">
        {/* Carnitas */}
        <RecipePreviewCard
          recipe_id="0c147f0d-fbc5-4ace-81f3-7e90601dcac4"
          image_url="/recipe_images/Carnitas.jpg"
        />

        {/* Pasta and Red Sauce */}
        <RecipePreviewCard
          recipe_id="50f742e0-105d-4f55-b952-42e9da931630"
          image_url="/recipe_images/Pasta.jpeg"
        />
      </SimpleGrid>
    </>
  );
}
