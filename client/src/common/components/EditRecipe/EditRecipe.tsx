import {
  Button,
  Divider,
  Grid,
  Group,
  Paper,
  Text,
  TextInput,
} from "@mantine/core";
import React, { useEffect, useState } from "react";

import EditRecipeDescriptionTextEditor from "./EditRecipeDescriptionTextEditor";
import EditRecipeIngredients from "./Ingredients/EditRecipeIngredients";
import EditRecipeInstructions from "./Instructions/EditRecipeInstructions";
import EditRecipeTags from "./EditRecipeTags";
import Highlight from "@tiptap/extension-highlight";
import { IconPlus } from "@tabler/icons-react";
import { Link } from "@mantine/tiptap";
import Recipe from "@/common/types/Recipe";
import StarterKit from "@tiptap/starter-kit";
import SubScript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { useEditor } from "@tiptap/react";
import { useMediaQuery } from "@mantine/hooks";

export default function EditRecipe({
  recipe,
  setRecipe,
}: {
  recipe: Recipe;
  setRecipe: (recipe: Recipe) => void;
}) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Due to how the TipTap RichTextEditor works, we need to use a separate state for the description
  // and update the recipe object when the description changes.
  const [description, setDescription] = useState(recipe.description);
  useEffect(() => {
    setRecipe({ ...recipe, description });
  }, [description]);

  const editor = useEditor({
    extensions: [
      Underline,
      Link,
      Superscript,
      SubScript,
      Highlight,
      StarterKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    immediatelyRender: false,
    content: description,
    onUpdate({ editor }) {
      setDescription(editor.getHTML());
    },
  });

  return (
    <Grid>
      <Grid.Col span={{ base: 12, sm: 10 }}>
        {/* Recipe Title */}
        <TextInput
          label="Recipe Title"
          size={isMobile ? "lg" : "md"}
          mt="md"
          placeholder="French Onion Soup"
          value={recipe.title}
          withAsterisk
          onChange={(e) =>
            setRecipe({ ...recipe, title: e.currentTarget.value })
          }
        />
      </Grid.Col>

      {/* Recipe Tags */}
      <Grid.Col span={{ base: 12, sm: 10 }} mt="md" mb="md">
        <EditRecipeTags recipe={recipe} setRecipe={setRecipe} />
      </Grid.Col>

      {/* Recipe Description */}
      <Grid.Col span={{ base: 12, sm: 10 }}>
        <Text size={isMobile ? "lg" : "md"} fw={500} mb="sm" mt="sm">
          Recipe Description
        </Text>
        {editor && <EditRecipeDescriptionTextEditor editor={editor} />}
      </Grid.Col>

      {/* Recipe Ingredients */}
      <Grid.Col span={{ base: 12, sm: 10 }} mt="md">
        <Paper shadow="sm" p="md" mb="sm">
          <Group mb="lg" justify="space-between">
            <Text fw={500} size={isMobile ? "xl" : "md"}>
              Ingredients
            </Text>
          </Group>

          <Divider />

          <EditRecipeIngredients recipe={recipe} setRecipe={setRecipe} />

          <Group justify="flex-end" mt="lg">
            <Button
              variant="gradient"
              size="xs"
              radius="md"
              w={isMobile ? "100%" : "auto"}
              rightSection={<IconPlus style={{ width: 24, height: 24 }} />}
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
              Add New Ingredient
            </Button>
          </Group>
        </Paper>
      </Grid.Col>

      {/* Recipe Instructions */}
      <Grid.Col span={{ base: 12, sm: 10 }} mt="md">
        <Paper shadow="sm" p="md" mb="sm">
          <Group mb="lg" justify="space-between">
            <Text fw={500} size={isMobile ? "xl" : "md"}>
              Instructions
            </Text>
          </Group>

          <Divider />

          <EditRecipeInstructions recipe={recipe} setRecipe={setRecipe} />

          <Group justify="flex-end" mt="lg">
            <Button
              variant="gradient"
              size="xs"
              radius="md"
              w={isMobile ? "100%" : "auto"}
              rightSection={<IconPlus style={{ width: 24, height: 24 }} />}
              onClick={() => {
                const newInstructions = [...recipe.instructions];
                newInstructions.push({
                  id: crypto.randomUUID(),
                  title: "",
                  description: "",
                });
                setRecipe({ ...recipe, instructions: newInstructions });
              }}
            >
              Add New Step
            </Button>
          </Group>
        </Paper>
      </Grid.Col>
    </Grid>
  );
}
