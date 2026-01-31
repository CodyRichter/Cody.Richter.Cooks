import {
  Accordion,
  ActionIcon,
  Button,
  Flex,
  Group,
  NumberInput,
  Popover,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import {
  IconExclamationMark,
  IconGripVertical,
  IconInfoCircle,
  IconPencilExclamation,
  IconTrash,
} from "@tabler/icons-react";
import React, { useState } from "react";

import { CSS } from "@dnd-kit/utilities";
import Ingredient from "@/types/Ingredient";
import Recipe from "@/types/Recipe";
import { useSortable } from "@dnd-kit/sortable";

export default function MobileSortableRecipeIngredient({
  recipe,
  ingredient,
  index,
  setRecipe,
}: {
  recipe: Recipe;
  ingredient: Ingredient;
  index: number;
  setRecipe: any;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: ingredient.id,
    });

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Group
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(
          transform ? { ...transform, x: 0 } : null
        ),
        transition: transition,
      }}
      mt="sm"
      mb="sm"
    >
      <ActionIcon
        variant="subtle"
        color="gray"
        className="sortableMoveIcon"
        {...attributes}
        {...listeners}
        style={{
          zIndex: 10,
          touchAction: "none",
        }}
      >
        <IconGripVertical size={24} />
      </ActionIcon>
      <Stack
        gap="sm"
        style={{
          width: "85%",
        }}
      >
        <Accordion variant="separated">
          <Accordion.Item value="ingredient-details">
            <Accordion.Control>
              {ingredient.quantity && ingredient.unit && ingredient.name ? (
                <Text>
                  {ingredient.quantity} {ingredient.unit} {ingredient.name}
                </Text>
              ) : (
                <Group>
                  <IconPencilExclamation size={20} color="red" />
                  <Text c="red">Details Missing...</Text>
                </Group>
              )}
            </Accordion.Control>

            <Accordion.Panel>
              <Flex gap="sm" align="flex-end">
                <NumberInput
                  label="Quantity"
                  value={ingredient.quantity}
                  withAsterisk
                  allowNegative={false}
                  size="sm"
                  radius="md"
                  rightSection={<></>}
                  style={{ flex: 1 }}
                  maxLength={10}
                  minLength={1}
                  onChange={(newValue) => {
                    const newIngredients = [...recipe.ingredients];
                    newIngredients[index].quantity = newValue as number;
                    setRecipe({ ...recipe, ingredients: newIngredients });
                  }}
                />

                <TextInput
                  label="Units"
                  placeholder="Tbsp..."
                  value={ingredient.unit}
                  size="sm"
                  radius="md"
                  style={{ flex: 1 }}
                  withAsterisk
                  onChange={(e) => {
                    const newIngredients = [...recipe.ingredients];
                    newIngredients[index].unit = e.currentTarget.value;
                    setRecipe({ ...recipe, ingredients: newIngredients });
                  }}
                />
              </Flex>

              <TextInput
                label="Name"
                placeholder="Onions..."
                value={ingredient.name}
                size="sm"
                radius="md"
                mt="sm"
                style={{ width: "100%" }}
                withAsterisk
                onChange={(e) => {
                  const newIngredients = [...recipe.ingredients];
                  newIngredients[index].name = e.currentTarget.value;
                  setRecipe({ ...recipe, ingredients: newIngredients });
                }}
              />

              <Flex gap="sm" justify="flex-start" mt="sm">
                <Popover
                  width={250}
                  position="bottom"
                  withArrow
                  trapFocus
                  shadow="md"
                >
                  <Popover.Target>
                    <Button
                      variant="outline"
                      color="gray"
                      size="xs"
                      leftSection={<IconInfoCircle size={18} />}
                      style={{ width: "50%", marginLeft: "auto" }}
                    >
                      Notes
                    </Button>
                  </Popover.Target>
                  <Popover.Dropdown>
                    <TextInput
                      label="Additional Information"
                      placeholder="[Optional] Can substitute with..."
                      value={ingredient.subtext}
                      size="sm"
                      radius="md"
                      onChange={(e) => {
                        const newIngredients = [...recipe.ingredients];
                        newIngredients[index].subtext = e.currentTarget.value;
                        setRecipe({ ...recipe, ingredients: newIngredients });
                      }}
                    />
                  </Popover.Dropdown>
                </Popover>

                <Popover position="bottom" withArrow trapFocus shadow="md">
                  <Popover.Target>
                    <Button
                      variant="outline"
                      color="red"
                      size="xs"
                      leftSection={<IconTrash size={18} />}
                      style={{ width: "50%", marginLeft: "auto" }}
                    >
                      Delete
                    </Button>
                  </Popover.Target>
                  <Popover.Dropdown>
                    <Button
                      color="red"
                      onClick={() => {
                        const newIngredients = [...recipe.ingredients];
                        newIngredients.splice(index, 1);
                        setRecipe({ ...recipe, ingredients: newIngredients });
                      }}
                      rightSection={
                        <IconExclamationMark
                          style={{ width: 20, height: 20 }}
                        />
                      }
                      leftSection={
                        <IconExclamationMark
                          style={{ width: 20, height: 20 }}
                        />
                      }
                    >
                      Confirm Delete
                    </Button>
                  </Popover.Dropdown>
                </Popover>
              </Flex>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Stack>
    </Group>
  );
}
