import { ActionIcon, Grid, NumberInput, Paper, TextInput } from "@mantine/core";

import { IconTrash } from "@tabler/icons-react";
import Ingredient from "@/common/types/Ingredient";
import React from "react";
import Recipe from "@/common/types/Recipe";

interface EditRecipeIngredientsProps {
  recipe: Recipe;
  setRecipe: (recipe: Recipe) => void;
}

export default function EditRecipeIngredients({
  recipe,
  setRecipe,
}: EditRecipeIngredientsProps) {
  return (
    <Grid.Col span={12}>
      {recipe.ingredients.map((ingredient: Ingredient, index: number) => (
        <Paper shadow="sm" p="md" mb="sm">
          <Grid
            key={`ingredient-${index}`}
            justify="flex-start"
            align="flex-end"
          >
            <Grid.Col span={1}>
              <NumberInput
                label="Quantity"
                value={ingredient.quantity}
                withAsterisk
                min={0.01}
                onChange={(newValue) => {
                  const newIngredients = [...recipe.ingredients];
                  newIngredients[index].quantity = newValue as number;
                  setRecipe({ ...recipe, ingredients: newIngredients });
                }}
              />
            </Grid.Col>
            <Grid.Col span={2}>
              <TextInput
                label="Units"
                placeholder="Tbsp..."
                value={ingredient.unit}
                withAsterisk
                onChange={(e) => {
                  const newIngredients = [...recipe.ingredients];
                  newIngredients[index].unit = e.currentTarget.value;
                  setRecipe({ ...recipe, ingredients: newIngredients });
                }}
              />
            </Grid.Col>

            <Grid.Col span={4}>
              <TextInput
                label="Name"
                placeholder="Onions..."
                value={ingredient.name}
                withAsterisk
                onChange={(e) => {
                  const newIngredients = [...recipe.ingredients];
                  newIngredients[index].name = e.currentTarget.value;
                  setRecipe({ ...recipe, ingredients: newIngredients });
                }}
              />
            </Grid.Col>

            <Grid.Col span={1}>
              <ActionIcon
                variant="filled"
                color="red"
                aria-label="Gradient action icon"
                onClick={() => {
                  const newIngredients = [...recipe.ingredients];
                  newIngredients.splice(index, 1);
                  setRecipe({ ...recipe, ingredients: newIngredients });
                }}
              >
                <IconTrash style={{ width: 24, height: 24 }} />
              </ActionIcon>
            </Grid.Col>

            {/* TODO: Add subtext to ingredients in the future */}
            {/* <Grid.Col span={10}>
              <TextInput
                label="Subtext"
                placeholder="Optional"
                value={ingredient.subtext}
                onChange={(e) => {
                  const newIngredients = [...recipe.ingredients];
                  newIngredients[index].subtext = e.currentTarget.value;
                  setRecipe({ ...recipe, ingredients: newIngredients });
                }}
              />
            </Grid.Col> */}
          </Grid>
        </Paper>
      ))}
    </Grid.Col>
  );
}
