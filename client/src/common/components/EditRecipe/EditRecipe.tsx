import {
  ActionIcon,
  Grid,
  Group,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";

import EditRecipeIngredients from "./EditRecipeIngredients";
import EditRecipeInstructions from "./EditRecipeInstructions";
import { IconPlus } from "@tabler/icons-react";
import React from "react";
import Recipe from "@/common/types/Recipe";

export default function EditRecipe({
  recipe,
  setRecipe,
}: {
  recipe: Recipe;
  setRecipe: (recipe: Recipe) => void;
}) {
  return (
    <Grid>
      <Grid.Col span={{ base: 12, sm: 7 }}>
        <TextInput
          label="Title"
          placeholder="French Onion Soup"
          value={recipe.title}
          withAsterisk
          onChange={(e) =>
            setRecipe({ ...recipe, title: e.currentTarget.value })
          }
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, sm: 9 }}>
        <Textarea
          label="Description"
          placeholder="A recipe passed down through the generations..."
          withAsterisk
          autosize
          maxRows={10}
          minRows={3}
          value={recipe.description}
          onChange={(e) =>
            setRecipe({ ...recipe, description: e.currentTarget.value })
          }
        />
      </Grid.Col>

      <Grid.Col span={9} mt="md">
        <Group mb="lg">
          <Text fw={500}>Ingredients</Text>
          <ActionIcon
            variant="gradient"
            size="md"
            aria-label="Gradient action icon"
            gradient={{ from: "blue", to: "cyan", deg: 90 }}
            onClick={() => {
              const newIngredients = [...recipe.ingredients];
              newIngredients.push({
                id: crypto.randomUUID(),
                quantity: 0,
                name: "",
                unit: "",
                subtext: "",
              });
              setRecipe({ ...recipe, ingredients: newIngredients });
            }}
          >
            <IconPlus style={{ width: 24, height: 24 }} />
          </ActionIcon>
        </Group>
      </Grid.Col>

      <EditRecipeIngredients recipe={recipe} setRecipe={setRecipe} />

      <Grid.Col span={9} mt="md">
        <Group mb="lg">
          <Text fw={500}>Instructions</Text>
          <ActionIcon
            variant="gradient"
            size="md"
            aria-label="Gradient action icon"
            gradient={{ from: "blue", to: "cyan", deg: 90 }}
            onClick={() => {
              const newInstructions = [...recipe.instructions];
              newInstructions.push({
                id: crypto.randomUUID(),
                step_number: newInstructions.length + 1,
                title: "",
                description: "",
              });
              setRecipe({ ...recipe, instructions: newInstructions });
            }}
          >
            <IconPlus style={{ width: 24, height: 24 }} />
          </ActionIcon>
        </Group>
      </Grid.Col>

      <EditRecipeInstructions recipe={recipe} setRecipe={setRecipe} />
    </Grid>
  );
}
