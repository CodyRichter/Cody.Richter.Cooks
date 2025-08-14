import { Card, Group, Stack, Text, Title } from "@mantine/core";

import InstructionStep from "@/types/InstructionStep";
import React from "react";

export default function RecipeInstructionsCard({
  instructions,
}: {
  instructions: InstructionStep[];
}) {
  return (
    <Card shadow="sm" radius="md" withBorder pb="lg">
      <Title order={4}>Instructions</Title>
      <Stack mt="sm">
        {instructions.map((instructionStep, stepIndex) => (
          <div key={`instructionStep-${instructionStep.id}`}>
            <Group>
              <div
                style={{
                  backgroundColor: "#f1f3f5",
                  borderRadius: "5px",
                  width: "25px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text size="sm" fw="bolder">
                  {stepIndex + 1}
                </Text>
              </div>

              <Text size="lg" w="80%">
                {instructionStep.title}
              </Text>
            </Group>
            <Text size="sm" mt="sm" w="85%">
              {instructionStep.description}
            </Text>
          </div>
        ))}
      </Stack>
    </Card>
  );
}
