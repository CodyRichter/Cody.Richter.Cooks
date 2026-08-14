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
  Indicator,
  Text,
} from "@mantine/core";
import EditRecipeIngredients from "@/components/recipes/edit/ingredients/EditRecipeIngredients";
import EditRecipeInstructions from "@/components/recipes/edit/instructions/EditRecipeInstructions";
import EditRecipeTags from "@/components/recipes/edit/tags/EditRecipeTags";
import { IconPlus, IconClock, IconUsers, IconCarrot, IconToolsKitchen } from "@tabler/icons-react";
import { RecipeDetail } from "@/types/Recipe";
import { useCallback } from "react";
import { UseFormReturnType } from "@mantine/form";
import TipTapEditorWrapper from "@/components/recipes/edit/description/TipTapEditorWrapper";

interface EditRecipeProps {
  form: UseFormReturnType<RecipeDetail>;
}

export default function EditRecipe({ form }: EditRecipeProps) {
  // Memoize the setDescription callback to prevent TipTap editor recreation
  const setDescription = useCallback((val: string) => {
    form.setFieldValue('description', val);
  }, [form]);

  // Get initial description for TipTap (it manages its own state internally)
  // Using getValues() only for initial render - TipTap handles subsequent updates
  const initialDescription = form.getValues().description || '';

  return (
    <Grid gap="xl">
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
                styles={{
                  input: {
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    padding: 0,
                    color: 'var(--mantine-color-text)',
                  },
                  label: {
                    fontSize: 'var(--mantine-font-size-sm)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--mantine-color-dimmed)',
                    marginBottom: 4,
                  },
                }}
              />


              <Divider
                label={
                  <Group gap={4}>
                    <Text size="xs" fw={500} c="dimmed">Short Description</Text>
                    <Text size="xs" c="red">*</Text>
                  </Group>
                }
                labelPosition="left"
              />

              <Box>
                <TipTapEditorWrapper
                  description={initialDescription}
                  setDescription={setDescription}
                />
              </Box>
            </Stack>
          </Paper>

          <Tabs defaultValue="ingredients" variant="pills" radius="md">
            <Paper shadow="sm" radius="md" withBorder p="md">
              <Stack gap="md">
                <Tabs.List grow>
                  <Tabs.Tab
                    value="ingredients"
                    leftSection={
                      <Indicator
                        color="red"
                        size={10}
                        offset={-2}
                        disabled={form.getValues().ingredients.length > 0}
                      >
                        <IconCarrot size="1.2rem" />
                      </Indicator>
                    }
                  >
                    Ingredients
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="instructions"
                    leftSection={
                      <Indicator
                        color="red"
                        size={10}
                        offset={-2}
                        disabled={form.getValues().instructions.length > 0}
                      >
                        <IconToolsKitchen size="1.2rem" />
                      </Indicator>
                    }
                  >
                    Instructions
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
                        Add Instruction Step
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
                withAsterisk
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
                withAsterisk
              />

              <Box>
                <Title order={5} size="xs" mb="xs" c="dimmed">TAGS</Title>
                <EditRecipeTags form={form} />
              </Box>
            </Stack>
          </Paper>

          {/* Desktop/Tablet Action Indicator or Help text */}
          <Paper
            p="md"
            radius="md"
            withBorder
            style={{
              borderStyle: 'dashed',
              backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
            }}
          >
            <Stack gap="xs">
              <Title order={6} fw={600}>Quick Tips</Title>
              <Box size="sm" c="dimmed" component="div" m={0} style={{ fontSize: '0.85rem' }}>
                Use the tabs to switch between ingredients and instructions. Drag and drop items to reorder them easily.
              </Box>
            </Stack>
          </Paper>
        </Stack>
      </Grid.Col>
    </Grid>
  );
}
