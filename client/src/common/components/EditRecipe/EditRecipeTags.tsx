import { Button, Chip, Group, Input } from "@mantine/core";

import { IconX } from "@tabler/icons-react";
import Recipe from "@/common/types/Recipe";
import { titleize } from "@/utils/recipeUtils";
import { useState } from "react";

interface EditRecipeTagsProps {
  recipe: Recipe;
  setRecipe: (recipe: Recipe) => void;
}

export default function EditRecipeTags({
  recipe,
  setRecipe,
}: EditRecipeTagsProps) {
  // This function is used to handle the change in tags.
  // It takes the new tags as an argument and updates the recipe object.
  // It also ensures that the tags are unique by using a Set.
  const handleTagChange = (newTags: string[]) => {
    setRecipe({ ...recipe, tags: Array.from(new Set(newTags)) });
  };

  // State to manage the new tag value
  const [newTagValue, setNewTagValue] = useState("");

  return (
    <>
      <Group mb="md">
        <Input
          placeholder="Add New Tag"
          value={newTagValue}
          onChange={(e) => {
            // This regex replaces all non-alphanumeric characters with an empty string
            // and converts the string to lowercase.
            const value = e.currentTarget.value
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "");
            setNewTagValue(value);
          }}
          w="30%"
        />
        <Button
          variant="primary"
          onClick={() => {
            if (newTagValue.trim() !== "") {
              handleTagChange([...recipe.tags, newTagValue]);
              setNewTagValue("");
            }
          }}
        >
          Add Tag
        </Button>
      </Group>

      <Group>
        {recipe.tags.map((tag, index) => (
          <Chip
            key={`tag-${index}`}
            variant="filled"
            icon={<IconX size={16} />}
            defaultChecked
            onClick={() => {
              handleTagChange(recipe.tags.filter((t) => t !== tag));
            }}
          >
            {titleize(tag)}
          </Chip>
        ))}
      </Group>
    </>
  );
}
