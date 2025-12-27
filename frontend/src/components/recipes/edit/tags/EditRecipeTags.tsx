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

import { RecipeDetail } from "@/types/Recipe";
import { titleize } from "@/utils/recipeUtils";
import { useState, memo } from "react";
import { UseFormReturnType } from "@mantine/form";

interface EditRecipeTagsProps {
  form: UseFormReturnType<RecipeDetail>;
}

const EditRecipeTags = memo(({
  form,
}: EditRecipeTagsProps) => {
  const recipe = form.getValues();

  // The value of the new tag input field
  const [newTagValue, setNewTagValue] = useState("");

  // Whether the "Add Tag" input field is shown
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Handles the change in tags in the recipe object
  const handleTagChange = (newTags: string[]) => {
    form.setFieldValue('tags', Array.from(new Set(newTags)));
  };

  // Attempts to add a tag to the recipe
  const addTag = () => {
    const cleanValue = newTagValue
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-");

    const currentTags = recipe.tags || [];
    if (cleanValue && !currentTags.includes(cleanValue)) {
      handleTagChange([...currentTags, cleanValue]);
      setNewTagValue("");
    }
    setIsAddingTag(false);
  };

  // Removes a tag from the recipe
  const removeTag = (tagToRemove: string) => {
    const currentTags = recipe.tags || [];
    handleTagChange(currentTags.filter((tag: string) => tag !== tagToRemove));
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

  const tags = recipe.tags || [];

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
      {tags.length > 0 && (
        <Group gap="xs">
          {tags.map((tag: string, index: number) => (
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
});

EditRecipeTags.displayName = 'EditRecipeTags';

export default EditRecipeTags;
