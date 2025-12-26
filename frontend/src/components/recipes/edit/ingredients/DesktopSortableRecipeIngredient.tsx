import {
  ActionIcon,
  Button,
  Group,
  NumberInput,
  Popover,
  TextInput,
  Paper,
  Tooltip,
  Grid,
} from "@mantine/core";
import {
  IconExclamationMark,
  IconGripVertical,
  IconInfoCircle,
  IconTrash,
  IconScale,
  IconToolsKitchen2,
} from "@tabler/icons-react";

import { CSS } from "@dnd-kit/utilities";
import { Ingredient } from "@/types/Ingredient";
import { RecipeDetail } from "@/types/Recipe";
import { useSortable } from "@dnd-kit/sortable";

export default function DesktopSortableRecipeIngredient({
  recipe,
  ingredient,
  index,
  setRecipe,
}: {
  recipe: RecipeDetail;
  ingredient: Ingredient;
  index: number;
  setRecipe: (recipe: RecipeDetail) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: ingredient.id,
    });

  return (
    <Paper
      ref={setNodeRef}
      p="xs"
      radius="md"
      withBorder
      mb="xs"
      shadow={isDragging ? "md" : "xs"}
      style={{
        transform: CSS.Transform.toString(
          transform ? { ...transform, x: 0 } : null
        ),
        transition: transition,
        backgroundColor: isDragging ? 'var(--mantine-color-orange-0)' : 'var(--mantine-color-gray-0)',
        zIndex: isDragging ? 100 : 1,
        opacity: isDragging ? 0.8 : 1,
        border: isDragging ? '1px solid var(--mantine-color-orange-4)' : undefined,
      }}
      className="sortableItem"
    >
      <Group gap="md" align="center" wrap="nowrap">
        <ActionIcon
          variant="subtle"
          color="gray"
          className="sortableMoveIcon"
          {...attributes}
          {...listeners}
          size="lg"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <IconGripVertical size={20} />
        </ActionIcon>

        <Grid gutter="xs" style={{ flex: 1 }} align="center">
          <Grid.Col span={2}>
            <NumberInput
              placeholder="0"
              value={ingredient.quantity}
              withAsterisk
              allowNegative={false}
              size="sm"
              radius="md"
              variant="unstyled"
              hideControls
              styles={{ input: { fontWeight: 600, textAlign: 'center' } }}
              onChange={(newValue) => {
                const newIngredients = [...recipe.ingredients];
                newIngredients[index].quantity = newValue as number;
                setRecipe({ ...recipe, ingredients: newIngredients });
              }}
            />
          </Grid.Col>

          <Grid.Col span={3}>
            <TextInput
              placeholder="Tbsp, g, ml..."
              value={ingredient.unit}
              size="sm"
              radius="md"
              variant="unstyled"
              withAsterisk
              leftSection={<IconScale size="1rem" color="var(--mantine-color-gray-5)" />}
              styles={{ input: { fontWeight: 500 } }}
              onChange={(e) => {
                const newIngredients = [...recipe.ingredients];
                newIngredients[index].unit = e.currentTarget.value;
                setRecipe({ ...recipe, ingredients: newIngredients });
              }}
            />
          </Grid.Col>

          <Grid.Col span={5}>
            <TextInput
              placeholder="Freshly chopped onions..."
              value={ingredient.name}
              size="sm"
              radius="md"
              variant="unstyled"
              withAsterisk
              leftSection={<IconToolsKitchen2 size="1rem" color="var(--mantine-color-gray-5)" />}
              styles={{ input: { fontWeight: 500 } }}
              onChange={(e) => {
                const newIngredients = [...recipe.ingredients];
                newIngredients[index].name = e.currentTarget.value;
                setRecipe({ ...recipe, ingredients: newIngredients });
              }}
            />
          </Grid.Col>

          <Grid.Col span={2}>
            <Group gap="xs" justify="flex-end" wrap="nowrap">
              <Popover width={300} position="bottom" withArrow trapFocus shadow="md">
                <Popover.Target>
                  <Tooltip label="Additional Info">
                    <ActionIcon variant="subtle" color="blue" size="md" radius="md">
                      <IconInfoCircle size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Popover.Target>
                <Popover.Dropdown p="md">
                  <TextInput
                    label="Additional Information"
                    placeholder="e.g. Can substitute with shallots"
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
                  <Tooltip label="Remove Ingredient">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="md"
                      radius="md"
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Popover.Target>
                <Popover.Dropdown p="xs">
                  <Button
                    color="red"
                    size="xs"
                    onClick={() => {
                      const newIngredients = [...recipe.ingredients];
                      newIngredients.splice(index, 1);
                      setRecipe({ ...recipe, ingredients: newIngredients });
                    }}
                    leftSection={<IconExclamationMark size={14} />}
                  >
                    Confirm
                  </Button>
                </Popover.Dropdown>
              </Popover>
            </Group>
          </Grid.Col>
        </Grid>
      </Group>
    </Paper>
  );
}
