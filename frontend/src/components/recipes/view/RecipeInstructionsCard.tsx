import { Group, Stack, Text, Title, ThemeIcon, Box } from "@mantine/core";
import { InstructionStep } from "@/types/InstructionStep";
import React from "react";
import parse from "html-react-parser";

export default function RecipeInstructionsCard({
  instructions,
}: {
  instructions: InstructionStep[];
}) {
  if (!instructions || instructions.length === 0) {
    return (
      <Stack gap="sm">
        <Title order={4}>Instructions</Title>
        <Text c="dimmed" size="sm">
          No instructions added yet.
        </Text>
      </Stack>
    );
  }

  return (
    <>
      <Title order={4}>Instructions</Title>
      <Stack mt="sm">
        {instructions.map((instructionStep, stepIndex) => (
          <div key={`instructionStep-${instructionStep.id}`}>
            <Group align="flex-start" wrap="nowrap" gap="sm">
              <ThemeIcon
                size={28}
                radius="md"
                variant="light"
                color="orange"
                style={{ fontWeight: 700, flexShrink: 0, marginTop: 2 }}
              >
                {stepIndex + 1}
              </ThemeIcon>

              <Stack gap="xs" style={{ flex: 1 }}>
                <Text size="lg" fw={600}>
                  {instructionStep.title}
                </Text>
                {instructionStep.description && (
                  <Box c="dimmed" style={{ lineHeight: 1.6, fontSize: "0.95rem" }}>
                    {typeof instructionStep.description === "string"
                      ? parse(instructionStep.description)
                      : instructionStep.description}
                  </Box>
                )}
              </Stack>
            </Group>
          </div>
        ))}
      </Stack>
    </>
  );
}
