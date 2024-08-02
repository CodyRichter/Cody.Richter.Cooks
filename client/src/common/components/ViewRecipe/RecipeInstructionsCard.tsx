import { Card, Stack, Text } from "@mantine/core";

import InstructionStep from "@/common/types/InstructionStep";
import React from "react";

export default function RecipeInstructionsCard({
  instructions,
}: {
  instructions: InstructionStep[];
}) {
  return (
    <Stack ml="md">
      <Text size="lg" mb="md">
        Instructions
      </Text>
      {instructions.map((instructionStep) => (
        <Card
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
          key={`instructionStep-${instructionStep.id}`}
        >
          <Text size="lg" w="85%">
            Step {instructionStep.step_number}: {instructionStep.title}
          </Text>
          <Text size="sm" mt="sm" w="85%">
            {instructionStep.description}
          </Text>
        </Card>
      ))}
    </Stack>
  );
}
