import { Grid, Text } from "@mantine/core";

import React from "react";
import { useParams } from "react-router-dom";
import Recipe from "src/common/types/Recipe";

function Recipe() {
  const { recipeId } = useParams();

  const recipe: Recipe = {
    id: recipeId,
    name: "Recipe Name",
    description: "Recipe Description",
    ingredients: [
      { id: "1", name: "Ingredient 1", quantity: "1", unit: "macrospoons" },
      { id: "2", name: "Ingredient 2", quantity: "2", unit: "microspoons" },
    ],
    instructions: [
      { id: "1", description: "Instruction 1" },
      { id: "2", description: "Instruction 2" },
    ],
  };

  return (
    <Grid>
      <Grid.Col>
        <Grid.Col span={12}>
          <Text ta="center" fw={700} size="xl"></Text>
        </Grid.Col>
      </Grid.Col>
    </Grid>
  );
}

export default Recipe;
