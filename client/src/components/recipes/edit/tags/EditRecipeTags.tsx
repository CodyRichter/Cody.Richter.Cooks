import {
  ActionIcon,
  Badge,
  Button,
  Divider,
  Flex,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconPlus, IconX } from "@tabler/icons-react";

import Recipe from "@/types/Recipe";
import { titleize } from "@/utils/recipeUtils";
import { useMediaQuery } from "@mantine/hooks";
import { useState } from "react";

interface EditRecipeTagsProps {
  recipe: Recipe;
  setRecipe: (recipe: Recipe) => void;
}

export default function EditRecipeTags({
  recipe,
  setRecipe,
}: EditRecipeTagsProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

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

    if (cleanValue && !recipe.tags.includes(cleanValue)) {
      handleTagChange([...recipe.tags, cleanValue]);
      setNewTagValue("");
    }
    setIsAddingTag(false);
  };

  // Removes a tag from the recipe
  const removeTag = (tagToRemove: string) => {
    handleTagChange(recipe.tags.filter((tag) => tag !== tagToRemove));
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
    <Paper shadow="xs" p="md" radius="md">
      <Stack gap="md">
        {/* Header & Add Tag Section */}
        <Flex gap="sm" align="flex-end" wrap="wrap">
          {isAddingTag ? (
            <Flex gap="xs" wrap="wrap" style={{ width: "100%" }}>
              <TextInput
                placeholder="Enter tag name..."
                value={newTagValue}
                onChange={(e) => setNewTagValue(e.currentTarget.value)}
                onKeyDown={handleKeyPress}
                autoFocus
                size={isMobile ? "md" : "sm"}
                style={{ flex: 1, minWidth: isMobile ? "100%" : "200px" }}
              />
              <Group gap="xs" style={isMobile ? { width: "100%" } : {}}>
                <Button
                  variant="outline"
                  color="gray"
                  size="xs"
                  radius="md"
                  onClick={() => {
                    setIsAddingTag(false);
                    setNewTagValue("");
                  }}
                  style={{
                    width: isMobile ? "40%" : "auto",
                    flex: isMobile ? 1 : "auto",
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="gradient"
                  size="xs"
                  radius="md"
                  onClick={addTag}
                  disabled={!newTagValue.trim()}
                  style={{
                    width: isMobile ? "40%" : "auto",
                    flex: isMobile ? 1 : "auto",
                  }}
                >
                  Add
                </Button>
              </Group>
            </Flex>
          ) : (
            <Group justify="space-between" style={{ width: "100%" }}>
              <Text fw={500} size={isMobile ? "xl" : "md"}>
                Recipe Tags
              </Text>
              <Button
                variant="gradient"
                size="xs"
                radius="md"
                w={isMobile ? "100%" : "auto"}
                rightSection={<IconPlus style={{ width: 16, height: 16 }} />}
                onClick={() => setIsAddingTag(true)}
              >
                Add Tag
              </Button>
            </Group>
          )}
        </Flex>

        <Divider />

        {/* Tags Display */}
        {recipe.tags.length > 0 ? (
          <Flex gap="xs" wrap="wrap">
            {recipe.tags.map((tag, index) => (
              <Badge
                key={`tag-${index}`}
                variant="gradient"
                gradient={{ from: "orange", to: "yellow", deg: 195 }}
                radius="md"
                size={isMobile ? "xl" : "lg"}
                rightSection={
                  <ActionIcon
                    size="xs"
                    variant="transparent"
                    color="white"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTag(tag);
                    }}
                    ml="xs"
                  >
                    <IconX size={12} />
                  </ActionIcon>
                }
                onClick={() => removeTag(tag)}
                style={{ cursor: "pointer" }}
              >
                {titleize(tag)}
              </Badge>
            ))}
          </Flex>
        ) : (
          <Text c="dimmed" size="sm" ta="center" py="md">
            No tags added yet. Click "Add Tag" to get started.
          </Text>
        )}
      </Stack>
    </Paper>
  );
}
