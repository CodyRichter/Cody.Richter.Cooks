import { ActionIcon, Grid, Group, Text, TextInput } from "@mantine/core";
import { Link, RichTextEditor } from "@mantine/tiptap";

import EditRecipeIngredients from "./EditRecipeIngredients";
import EditRecipeInstructions from "./EditRecipeInstructions";
import Highlight from "@tiptap/extension-highlight";
import { IconPlus } from "@tabler/icons-react";
import React from "react";
import Recipe from "@/common/types/Recipe";
import StarterKit from "@tiptap/starter-kit";
import SubScript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { useEditor } from "@tiptap/react";

export default function EditRecipe({
  recipe,
  setRecipe,
}: {
  recipe: Recipe;
  setRecipe: (recipe: Recipe) => void;
}) {
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
    content: recipe.description,
    onUpdate({ editor }) {
      setRecipe({ ...recipe, description: editor.getHTML() });
    },
  });

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
        <RichTextEditor editor={editor}>
          <RichTextEditor.Toolbar sticky stickyOffset={60}>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Bold />
              <RichTextEditor.Italic />
              <RichTextEditor.Underline />
              <RichTextEditor.Strikethrough />
              <RichTextEditor.ClearFormatting />
              <RichTextEditor.Highlight />
              <RichTextEditor.Code />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.H3 />
              <RichTextEditor.H4 />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Blockquote />
              <RichTextEditor.Hr />
              <RichTextEditor.BulletList />
              <RichTextEditor.OrderedList />
              <RichTextEditor.Subscript />
              <RichTextEditor.Superscript />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Link />
              <RichTextEditor.Unlink />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.AlignLeft />
              <RichTextEditor.AlignCenter />
              <RichTextEditor.AlignJustify />
              <RichTextEditor.AlignRight />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Undo />
              <RichTextEditor.Redo />
            </RichTextEditor.ControlsGroup>
          </RichTextEditor.Toolbar>

          <RichTextEditor.Content />
        </RichTextEditor>
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
