'use client';

import {
  ActionIcon,
  Badge,
  Button,
  Group,
  TextInput,
} from "@mantine/core";
import { IconPlus, IconX } from "@tabler/icons-react";

import { RecipeDetail } from "@/types/Recipe";
import { titleize } from "@/utils/recipeUtils";
import { useState } from "react";
import { UseFormReturnType } from "@mantine/form";

interface EditRecipeTagsProps {
  form: UseFormReturnType<RecipeDetail>;
}

/**
 * Compact inline tag manager for the recipe overview bar.
 */
export default function EditRecipeTags({
  form,
}: EditRecipeTagsProps) {
  const [tags, setTags] = useState<string[]>(() => form.getValues().tags || []);
  const [newTagValue, setNewTagValue] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);

  form.watch('tags', ({ value }) => {
    setTags(value || []);
  });

  const handleTagChange = (newTags: string[]) => {
    form.setFieldValue('tags', Array.from(new Set(newTags)));
  };

  const addTag = () => {
    const cleanValue = newTagValue
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-");

    if (cleanValue && !tags.includes(cleanValue)) {
      handleTagChange([...tags, cleanValue]);
      setNewTagValue("");
    }
    setIsAddingTag(false);
  };

  const removeTag = (tagToRemove: string) => {
    handleTagChange(tags.filter((tag: string) => tag !== tagToRemove));
  };

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
    <Group gap="xs" align="center" wrap="wrap">
      {tags.map((tag: string, index: number) => (
        <Badge
          key={`tag-${index}`}
          variant="light"
          color="orange"
          radius="md"
          size="sm"
          rightSection={
            <ActionIcon
              size="xs"
              variant="transparent"
              color="orange"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              aria-label={`Remove tag ${tag}`}
            >
              <IconX size={10} />
            </ActionIcon>
          }
          style={{
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          {titleize(tag)}
        </Badge>
      ))}

      {isAddingTag ? (
        <Group gap={4} align="center">
          <TextInput
            placeholder="Tag (e.g. Italian)"
            value={newTagValue}
            onChange={(e) => setNewTagValue(e.currentTarget.value)}
            onKeyDown={handleKeyPress}
            autoFocus
            size="xs"
            radius="md"
            w={120}
          />
          <Button
            variant="filled"
            color="orange"
            size="xs"
            radius="md"
            onClick={addTag}
            disabled={!newTagValue.trim()}
            px="xs"
          >
            Add
          </Button>
          <Button
            variant="subtle"
            color="gray"
            size="xs"
            radius="md"
            onClick={() => {
              setIsAddingTag(false);
              setNewTagValue("");
            }}
            px="xs"
          >
            Cancel
          </Button>
        </Group>
      ) : (
        <Button
          variant="subtle"
          color="gray"
          size="xs"
          radius="md"
          leftSection={<IconPlus size={12} />}
          onClick={() => setIsAddingTag(true)}
          styles={{
            root: {
              border: '1px dashed var(--mantine-color-default-border)',
              height: '26px',
            },
          }}
        >
          Add Tag
        </Button>
      )}
    </Group>
  );
}
