import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconPlus, IconX } from "@tabler/icons-react";

import Recipe, { RecipeDetail } from "@/types/Recipe";
import { titleize } from "@/utils/recipeUtils";
import { useState } from "react";

interface EditRecipeTagsProps {
  recipe: Recipe | RecipeDetail;
  setRecipe: (recipe: Recipe | RecipeDetail) => void;
}

export default function EditRecipeTags({
  recipe,
  setRecipe,
}: EditRecipeTagsProps) {

  // The value of the new tag input field
  const [newTagValue, setNewTagValue] = useState("");

  // Whether the "Add Tag" input field is shown
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Handles the change in tags in the recipe object
  const handleTagChange = (newTags: string[]) => {
    setRecipe({ ...recipe, tags: Array.from(new Set(newTags)) });
  };

  // Attempts to add a tag to the recipe
  const addTag = () => {
    const cleanValue = newTagValue
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-");

    if (cleanValue && !(recipe.tags || []).includes(cleanValue)) {
      handleTagChange([...(recipe.tags || []), cleanValue]);
      setNewTagValue("");
    }
    setIsAddingTag(false);
  };

  // Removes a tag from the recipe
  const removeTag = (tagToRemove: string) => {
    handleTagChange((recipe.tags || []).filter((tag) => tag !== tagToRemove));
  };

  // Quality of life keyboard shortcuts for the "Add Tag" input field
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Escape") {
      setIsAddingTag(false);
      setNewTagValue("");
    }
  };

  return (
    <Stack gap="sm">
      {/* Add Tag Section */}
      {isAddingTag ? (
        <Group gap="xs" align="flex-end">
          <TextInput
            label="Add Tag"
            placeholder="Enter tag name..."
            value={newTagValue}
            onChange={(e) => setNewTagValue(e.currentTarget.value)}
            onKeyDown={handleKeyPress}
            autoFocus
            size="sm"
            style={{ flex: 1 }}
          />
          <Button
            variant="subtle"
            color="gray"
            size="sm"
            radius="md"
            onClick={() => {
              setIsAddingTag(false);
              setNewTagValue("");
            }}
          >
            Cancel
          </Button>
          <Button
            variant="filled"
            color="orange"
            size="sm"
            radius="md"
            onClick={addTag}
            disabled={!newTagValue.trim()}
          >
            Add
          </Button>
        </Group>
      ) : (
        <Group gap="xs" align="center">
          <Text size="sm" c="dimmed" fw={400}>
            Tags:
          </Text>
          <Button
            variant="light"
            color="orange"
            size="xs"
            radius="md"
            leftSection={<IconPlus size="0.8rem" />}
            onClick={() => setIsAddingTag(true)}
          >
            Add Tag
          </Button>
        </Group>
      )}

      {/* Tags Display */}
      {(recipe.tags || []).length > 0 && (
        <Group gap="xs">
          {(recipe.tags || []).map((tag, index) => (
            <Badge
              key={`tag-${index}`}
              variant="light"
              color="orange"
              radius="md"
              size="lg"
              rightSection={
                <ActionIcon
                  size="xs"
                  variant="transparent"
                  color="orange"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(tag);
                  }}
                  ml="xs"
                >
                  <IconX size={10} />
                </ActionIcon>
              }
              style={{
                cursor: "pointer",
                textTransform: "none",
                fontWeight: 700,
              }}
            >
              {titleize(tag)}
            </Badge>
          ))}
        </Group>
      )}
    </Stack>
  );
}
