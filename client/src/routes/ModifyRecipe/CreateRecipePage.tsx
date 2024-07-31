import { Grid, Text } from "@mantine/core";

import EditRecipe from "./EditRecipe/EditRecipe";
import React from "react";
import Recipe from "src/common/types/Recipe";

export default function CreateRecipePage() {
  const [newRecipe, setNewRecipe] = React.useState<Recipe>({
    id: crypto.randomUUID(),
    title: "",
    description: "",
    ingredients: [],
    instructions: [],
  });

  return (
    <>
      <Grid>
        <Grid.Col>
          <Grid.Col span={12}>
            <Text fw={700} size="xl">
              Create New Recipe
            </Text>
          </Grid.Col>

          <Grid.Col span={12}>
            <EditRecipe recipe={newRecipe} setRecipe={setNewRecipe} />
          </Grid.Col>
        </Grid.Col>
      </Grid>
    </>
  );
}
