'use client';

import {
  Badge,
  Box,
  Button,
  Divider,
  Grid,
  Group,
  NumberInput,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import EditRecipeIngredients from "@/components/recipes/edit/ingredients/EditRecipeIngredients";
import EditRecipeInstructions from "@/components/recipes/edit/instructions/EditRecipeInstructions";
import EditRecipeTags from "@/components/recipes/edit/tags/EditRecipeTags";
import {
  IconPlus,
  IconClock,
  IconUsers,
  IconCarrot,
  IconToolsKitchen,
} from "@tabler/icons-react";
import { RecipeDetail } from "@/types/Recipe";
import { useCallback, useState } from "react";
import { UseFormReturnType } from "@mantine/form";
import TipTapEditorWrapper from "@/components/recipes/edit/description/TipTapEditorWrapper";
import { useMediaQuery } from "@mantine/hooks";

interface EditRecipeProps {
  form: UseFormReturnType<RecipeDetail>;
}

export default function EditRecipe({ form }: EditRecipeProps) {
  const isDesktop = useMediaQuery('(min-width: 992px)', false, {
    getInitialValueInEffect: true,
  });

  // Watch lists to update section counts reactively
  const [ingredientCount, setIngredientCount] = useState(
    () => form.getValues().ingredients?.length || 0
  );
  const [instructionCount, setInstructionCount] = useState(
    () => form.getValues().instructions?.length || 0
  );

  form.watch('ingredients', ({ value }) => {
    setIngredientCount(value?.length || 0);
  });

  form.watch('instructions', ({ value }) => {
    setInstructionCount(value?.length || 0);
  });

  // Memoize the setDescription callback to prevent TipTap editor recreation
  const setDescription = useCallback(
    (val: string) => {
      form.setFieldValue('description', val);
    },
    [form]
  );

  const initialDescription = form.getValues().description || '';

  const handleAddIngredient = () => {
    const currentRecipe = form.getValues();
    form.insertListItem('ingredients', {
      id: crypto.randomUUID(),
      quantity: 0,
      name: "",
      unit: "",
      subtext: "",
      order_index: currentRecipe.ingredients?.length || 0,
      recipe_id: currentRecipe.id,
    });
  };

  const handleAddInstruction = () => {
    const currentRecipe = form.getValues();
    form.insertListItem('instructions', {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      step_number: (currentRecipe.instructions?.length || 0) + 1,
      recipe_id: currentRecipe.id,
    });
  };

  return (
    <Stack gap="md">
      {/* 1. Clean, Modern Recipe Overview Card */}
      <Paper shadow="xs" p={{ base: 'sm', sm: 'lg' }} radius="md" withBorder>
        <Stack gap="sm">
          {/* Recipe Title Headline */}
          <TextInput
            placeholder="Recipe Title (e.g. Tuscan Salmon)"
            size="lg"
            radius="md"
            withAsterisk
            styles={{
              input: {
                fontSize: 'clamp(1.15rem, 4vw, 1.4rem)',
                fontWeight: 700,
                border: 'none',
                backgroundColor: 'transparent',
                paddingLeft: 0,
                paddingRight: 0,
              },
            }}
            key={form.key('title')}
            {...form.getInputProps('title')}
          />

          {/* Inline Metadata Strip (Time, Servings, Tags) */}
          <Group gap="xs" align="center" wrap="wrap">
            <NumberInput
              placeholder="Time"
              key={form.key('cooking_time')}
              {...form.getInputProps('cooking_time')}
              min={0}
              max={1440}
              step={5}
              hideControls
              suffix=" mins"
              leftSection={<IconClock size={14} color="var(--mantine-color-dimmed)" />}
              radius="md"
              size="xs"
              w={{ base: 95, sm: 110 }}
            />

            <NumberInput
              placeholder="Servings"
              key={form.key('serving_size')}
              {...form.getInputProps('serving_size')}
              min={1}
              max={50}
              step={1}
              hideControls
              suffix=" serv"
              leftSection={<IconUsers size={14} color="var(--mantine-color-dimmed)" />}
              radius="md"
              size="xs"
              w={{ base: 95, sm: 115 }}
            />

            <Divider orientation="vertical" visibleFrom="xs" />

            <EditRecipeTags form={form} />
          </Group>

          <Divider />

          {/* Description & Story */}
          <Box>
            <TipTapEditorWrapper
              description={initialDescription}
              setDescription={setDescription}
            />
          </Box>
        </Stack>
      </Paper>

      {/* 2. Split Workstation Layout (Desktop: Side-by-Side with Sticky Ingredients; Mobile: Clean Vertical Stack) */}
      <Grid gap="md" align="flex-start">
        {/* Left Column: Ingredients List */}
        <Grid.Col
          span={{ base: 12, md: 5 }}
          style={
            isDesktop
              ? {
                  position: 'sticky',
                  top: 'calc(var(--app-shell-header-offset, 65px) + 75px)',
                  alignSelf: 'flex-start',
                }
              : undefined
          }
        >
          <Paper shadow="xs" p={{ base: 'sm', sm: 'md' }} radius="md" withBorder>
            <Stack gap="sm">
              {/* Header */}
              <Group justify="space-between" align="center">
                <Group gap="xs" align="center">
                  <IconCarrot size={18} color="var(--mantine-color-orange-6)" />
                  <Title order={3} size="h5" fw={700}>
                    Ingredients
                  </Title>
                  <Badge variant="light" color="orange" size="sm" radius="xl">
                    {ingredientCount}
                  </Badge>
                </Group>

                <Button
                  variant="light"
                  color="orange"
                  size="xs"
                  radius="md"
                  leftSection={<IconPlus size={13} />}
                  onClick={handleAddIngredient}
                >
                  Add
                </Button>
              </Group>

              <Divider />

              {/* Ingredients List */}
              <EditRecipeIngredients form={form} />

              {/* Quick Add Button & Keyboard Hint */}
              <Button
                variant="subtle"
                color="orange"
                size="xs"
                radius="md"
                fullWidth
                leftSection={<IconPlus size={14} />}
                onClick={handleAddIngredient}
                styles={{
                  root: {
                    border: '1px dashed var(--mantine-color-orange-3)',
                    height: '32px',
                  },
                }}
              >
                Add Ingredient
              </Button>
              <Text size="xs" c="dimmed" ta="center" visibleFrom="sm">
                Tip: Press <Text span fw={600} inherit>Enter</Text> on any ingredient field to add the next item
              </Text>
            </Stack>
          </Paper>
        </Grid.Col>

        {/* Right Column: Instructions & Method */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Paper shadow="xs" p={{ base: 'sm', sm: 'md' }} radius="md" withBorder>
            <Stack gap="sm">
              {/* Header */}
              <Group justify="space-between" align="center">
                <Group gap="xs" align="center">
                  <IconToolsKitchen size={18} color="var(--mantine-color-orange-6)" />
                  <Title order={3} size="h5" fw={700}>
                    Method & Steps
                  </Title>
                  <Badge variant="light" color="orange" size="sm" radius="xl">
                    {instructionCount}
                  </Badge>
                </Group>

                <Button
                  variant="light"
                  color="orange"
                  size="xs"
                  radius="md"
                  leftSection={<IconPlus size={13} />}
                  onClick={handleAddInstruction}
                >
                  Add Step
                </Button>
              </Group>

              <Divider />

              {/* Instructions List */}
              <EditRecipeInstructions form={form} />

              {/* Quick Add Button */}
              <Button
                variant="subtle"
                color="orange"
                size="xs"
                radius="md"
                fullWidth
                leftSection={<IconPlus size={14} />}
                onClick={handleAddInstruction}
                styles={{
                  root: {
                    border: '1px dashed var(--mantine-color-orange-3)',
                    height: '32px',
                  },
                }}
              >
                Add Instruction Step
              </Button>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
