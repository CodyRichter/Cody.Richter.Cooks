import { Grid, Text } from "@mantine/core";

import EditRecipe from "@/common/components/EditRecipe/EditRecipe";
import Recipe from "@/common/types/Recipe";
import { useState } from "react";

export default function CreateRecipe() {
  const [newRecipe, setNewRecipe] = useState<Recipe>({
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
