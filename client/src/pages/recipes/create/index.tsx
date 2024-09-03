import { Button, Grid, Group, Text } from "@mantine/core";

import { BASE_URL } from "@/common/network/constants";
import EditRecipe from "@/common/components/EditRecipe/EditRecipe";
import Recipe from "@/common/types/Recipe";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/router";
import { useState } from "react";

export default function CreateRecipe() {
  const router = useRouter();

  const [newRecipe, setNewRecipe] = useState<Recipe>({
    id: crypto.randomUUID(),
    title: "",
    description: "",
    ingredients: [],
    instructions: [],
  });

  const [isCreateButtonLoading, setIsCreateButtonLoading] = useState(false);

  function isRecipeValid(): boolean {
    const baseFieldsValid =
      !!newRecipe &&
      !!newRecipe.id &&
      !!newRecipe.title &&
      newRecipe.title.length > 0 &&
      !!newRecipe.description &&
      newRecipe.description.length > 0 &&
      newRecipe.ingredients.length > 0 &&
      newRecipe.instructions.length > 0;

    // Check if all ingredients have a name and quantity
    const ingredientsValid = newRecipe.ingredients.every(
      (ingredient) =>
        !!ingredient.name && !!ingredient.quantity && !!ingredient.unit
    );

    // Check if all instructions have a step
    const instructionsValid = newRecipe.instructions.every(
      (instruction) =>
        !!instruction.step_number &&
        !!instruction.title &&
        !!instruction.description
    );

    return baseFieldsValid && ingredientsValid && instructionsValid;
  }

  // Disable the create button if the recipe is invalid
  const disableCreateButton: boolean = !isRecipeValid();

  function createNewRecipe() {
    setIsCreateButtonLoading(true);

    if (!isRecipeValid) {
      notifications.show({
        title: "Invalid Recipe",
        message:
          "Please ensure all fields are filled out before creating the recipe.",
        color: "red",
      });
      setIsCreateButtonLoading(false);
      return;
    }

    fetch(`${BASE_URL}/recipes`, {
      method: "POST",
      body: JSON.stringify(newRecipe),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (response.ok) {
          response
            .json()
            .then((data) => {
              // Notify of success and redirect to the recipe's page
              notifications.show({
                title: "Recipe Created",
                message: "The recipe has been created successfully.",
                color: "teal",
              });
              router.push(`/recipes/view/${newRecipe.id}`);
            })
            .catch((e) => {
              console.error("Unable to Parse Recipe", e);
              notifications.show({
                title: "Error Creating New Recipe",
                message: `An error has occurred while creating the recipe. Please try again later. Details (parse): [${e}]`,
                color: "red",
              });
            });
        } else {
          notifications.show({
            title: "Error Creating New Recipe",
            message: `An error has occurred while creating the recipe. Please try again later. Details (response): [${response.status}]`,
            color: "red",
          });
        }
      })
      .catch((e) => {
        console.error("Unable to Create Recipe", e);
        notifications.show({
          title: "Error Creating New Recipe",
          message: `An error has occurred while creating the recipe. Please try again later. Details (load): [${e}]`,
          color: "red",
        });
      })
      .finally(() => {
        setIsCreateButtonLoading(false);
      });
  }

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

          <Grid.Col span={12}>
            <Group justify="flex-end">
              <Button
                w="200px"
                loading={isCreateButtonLoading}
                disabled={disableCreateButton}
                onClick={createNewRecipe}
              >
                Create Recipe
              </Button>
            </Group>
          </Grid.Col>
        </Grid.Col>
      </Grid>
    </>
  );
}
