import {
  Button,
  Divider,
  Group,
  Paper,
  Stack,
  TextInput,
  NumberInput,
  Title,
  Grid,
  Tabs,
  Box,
  Badge,
} from "@mantine/core";
import React from "react";

import EditRecipeIngredients from "@/components/recipes/edit/ingredients/EditRecipeIngredients";
import EditRecipeInstructions from "@/components/recipes/edit/instructions/EditRecipeInstructions";
import EditRecipeTags from "@/components/recipes/edit/tags/EditRecipeTags";
import { IconPlus, IconClock, IconUsers, IconChefHat, IconListDetails, IconSettings } from "@tabler/icons-react";
import { RecipeDetail } from "@/types/Recipe";
import { memo } from "react";
import { UseFormReturnType } from "@mantine/form";

// Import TipTap editor directly - Next.js handles code splitting
import TipTapEditorWrapper from "@/components/recipes/edit/description/TipTapEditorWrapper";

interface EditRecipeProps {
  form: UseFormReturnType<RecipeDetail>;
}

const EditRecipe = memo<EditRecipeProps>(({
  form,
}) => {
  // Use getValues() for access to other fields
  const recipe = form.getValues();

  return (
    <Grid gutter="xl">
      {/* Main Content Column */}
      <Grid.Col span={{ base: 12, md: 8 }}>
        <Stack gap="xl">
          <Paper shadow="sm" p="xl" radius="md" withBorder>
            <Stack gap="lg">
              <TextInput
                label="Recipe Title"
                placeholder="Give your recipe a catchy name..."
                size="xl"
                variant="unstyled"
                key={form.key('title')}
                {...form.getInputProps('title')}
                withAsterisk
                styles={(theme) => ({
                  input: {
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    padding: 0,
                    '&::placeholder': {
                      color: theme.colors.gray[4],
                    }
                  },
                  label: {
                    fontSize: theme.fontSizes.sm,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: theme.colors.gray[5],
                    marginBottom: 4,
                  }
                })}
              />

              <Divider label="Short Description" labelPosition="left" />

              <Box>
                <TipTapEditorWrapper
                  description={recipe.description || ''}
                  setDescription={(val) => form.setFieldValue('description', val)}
                />
              </Box>
            </Stack>
          </Paper>

          <Tabs defaultValue="ingredients" variant="pills" radius="md">
            <Paper shadow="sm" radius="md" withBorder p="md">
              <Stack gap="md">
                <Tabs.List grow>
                  <Tabs.Tab value="ingredients" leftSection={<IconListDetails size="1.2rem" />}>
                    <Group gap="xs">
                      Ingredients
                      <FormBadgeCount form={form} path="ingredients" />
                    </Group>
                  </Tabs.Tab>
                  <Tabs.Tab value="instructions" leftSection={<IconChefHat size="1.2rem" />}>
                    <Group gap="xs">
                      Instructions
                      <FormBadgeCount form={form} path="instructions" />
                    </Group>
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="ingredients" pt="md">
                  <Stack gap="md">
                    <Group justify="space-between" align="center">
                      <Title order={3} size="h4" fw={600}>Ingredients</Title>
                      <Button
                        variant="light"
                        color="orange"
                        size="sm"
                        radius="md"
                        leftSection={<IconPlus size="1rem" />}
                        onClick={() => {
                          const currentRecipe = form.getValues();
                          form.insertListItem('ingredients', {
                            id: crypto.randomUUID(),
                            quantity: 0,
                            name: "",
                            unit: "",
                            subtext: "",
                            order_index: currentRecipe.ingredients.length,
                            recipe_id: currentRecipe.id,
                          });
                        }}
                      >
                        Add Ingredient
                      </Button>
                    </Group>
                    <EditRecipeIngredients form={form} />
                  </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="instructions" pt="md">
                  <Stack gap="md">
                    <Group justify="space-between" align="center">
                      <Title order={3} size="h4" fw={600}>Instructions</Title>
                      <Button
                        variant="light"
                        color="orange"
                        size="sm"
                        radius="md"
                        leftSection={<IconPlus size="1rem" />}
                        onClick={() => {
                          const currentRecipe = form.getValues();
                          form.insertListItem('instructions', {
                            id: crypto.randomUUID(),
                            title: "",
                            description: "",
                            step_number: currentRecipe.instructions.length + 1,
                            recipe_id: currentRecipe.id,
                          });
                        }}
                      >
                        Add Step
                      </Button>
                    </Group>
                    <EditRecipeInstructions form={form} />
                  </Stack>
                </Tabs.Panel>
              </Stack>
            </Paper>
          </Tabs>
        </Stack>
      </Grid.Col>

      {/* Sidebar Column */}
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Stack gap="lg" pos="sticky" top={20}>
          <Paper shadow="sm" p="xl" radius="md" withBorder style={{ borderTop: '4px solid orange' }}>
            <Stack gap="lg">
              <Group gap="xs" align="center">
                <IconSettings size="1.2rem" style={{ color: 'gray' }} />
                <Title order={3} size="h4" fw={600}>Recipe Details</Title>
              </Group>

              <Divider />

              <NumberInput
                label="Cooking Time"
                placeholder="30"
                key={form.key('cooking_time')}
                {...form.getInputProps('cooking_time')}
                min={0}
                max={1440}
                step={5}
                suffix=" mins"
                leftSection={<IconClock size="1.1rem" />}
                variant="filled"
                radius="md"
              />

              <NumberInput
                label="Serving Size"
                placeholder="4"
                key={form.key('serving_size')}
                {...form.getInputProps('serving_size')}
                min={1}
                max={50}
                suffix=" servings"
                leftSection={<IconUsers size="1.1rem" />}
                variant="filled"
                radius="md"
              />

              <Box>
                <Title order={5} size="xs" mb="xs" c="dimmed">TAGS</Title>
                <EditRecipeTags form={form} />
              </Box>
            </Stack>
          </Paper>

          {/* Desktop/Tablet Action Indicator or Help text */}
          <Paper p="md" radius="md" bg="gray.0" withBorder style={{ borderStyle: 'dashed' }}>
            <Stack gap="xs">
              <Title order={6} c="gray.7">Quick Tips</Title>
              <Box size="sm" c="gray.6" component="div" m={0} style={{ fontSize: '0.85rem' }}>
                Use the tabs to switch between ingredients and instructions. Drag and drop items to reorder them easily.
              </Box>
            </Stack>
          </Paper>
        </Stack>
      </Grid.Col>
    </Grid>
  );
});

EditRecipe.displayName = 'EditRecipe';

/**
 * Isolated component to show count badges without re-rendering the whole form
 */
const FormBadgeCount = ({ form, path }: { form: UseFormReturnType<RecipeDetail>, path: 'ingredients' | 'instructions' }) => {
  // Subscribe to changes in the array
  form.watch(path, () => {});
  const count = form.getValues()[path].length;

  return (
    <Badge size="sm" variant="light" color="orange">
      {count}
    </Badge>
  );
};

export default EditRecipe;
