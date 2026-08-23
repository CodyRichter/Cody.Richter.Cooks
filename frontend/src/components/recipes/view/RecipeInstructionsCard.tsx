import {
  Badge,
  Box,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconClock } from "@tabler/icons-react";
import { InstructionStep } from "@/types/InstructionStep";
import React from "react";
import parse from "html-react-parser";
import { useMediaQuery } from "@mantine/hooks";

interface RecipeInstructionsCardProps {
  instructions: InstructionStep[];
}

export default function RecipeInstructionsCard({
  instructions,
}: RecipeInstructionsCardProps) {
  const isMobile = useMediaQuery("(max-width: 768px)", false, {
    getInitialValueInEffect: true,
  });

  if (!instructions || instructions.length === 0) {
    return (
      <Paper
        withBorder={!isMobile}
        shadow={isMobile ? "none" : "xs"}
        radius={isMobile ? 0 : "lg"}
        p={isMobile ? 0 : "lg"}
        bg={isMobile ? "transparent" : undefined}
        h="100%"
        style={{ display: "flex", flexDirection: "column" }}
      >
        <Stack gap="sm" style={{ flex: 1 }}>
          <Title order={3} size="h4" fw={700}>
            Instructions
          </Title>
          <Text c="dimmed" size="sm">
            No instructions added yet.
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper
      withBorder={!isMobile}
      shadow={isMobile ? "none" : "xs"}
      radius={isMobile ? 0 : "lg"}
      p={isMobile ? 0 : "lg"}
      bg={isMobile ? "transparent" : undefined}
      h="100%"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <Stack gap="sm" style={{ flex: 1 }}>
        {/* Card Header */}
        <Group justify="space-between" align="center">
          <Title order={3} size="h4" fw={700}>
            Instructions
          </Title>
        </Group>

        <Divider />

        {/* Steps List */}
        <Stack gap="md" style={{ flex: 1 }}>
          {instructions.map((instructionStep, stepIndex) => {
            const stepNum = instructionStep.step_number || stepIndex + 1;
            const isLast = stepIndex === instructions.length - 1;

            return (
              <Box key={`instructionStep-${instructionStep.id || stepIndex}`}>
                <Group align="flex-start" wrap="nowrap" gap="sm">
                  {/* Step Number Circle */}
                  <ThemeIcon
                    size={28}
                    radius="xl"
                    variant="light"
                    color="orange"
                    style={{
                      fontWeight: 700,
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {stepNum}
                  </ThemeIcon>

                  {/* Step Content */}
                  <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                    <Group justify="space-between" align="center" wrap="wrap" gap="xs">
                      {instructionStep.title && (
                        <Text size="md" fw={700} style={{ wordBreak: "break-word" }}>
                          {instructionStep.title}
                        </Text>
                      )}

                      {instructionStep.timing ? (
                        <Badge
                          size="xs"
                          variant="subtle"
                          color="gray"
                          leftSection={<IconClock size={12} stroke={1.5} />}
                          style={{ textTransform: "none", fontWeight: 600 }}
                        >
                          {instructionStep.timing}m
                        </Badge>
                      ) : null}
                    </Group>

                    {instructionStep.description && (
                      <Box
                        c="dimmed"
                        style={{
                          lineHeight: 1.6,
                          fontSize: "0.93rem",
                          wordBreak: "break-word",
                        }}
                      >
                        {typeof instructionStep.description === "string"
                          ? parse(instructionStep.description)
                          : instructionStep.description}
                      </Box>
                    )}
                  </Stack>
                </Group>

                {!isLast && <Divider mt="sm" variant="dashed" color="gray.2" />}
              </Box>
            );
          })}
        </Stack>
      </Stack>
    </Paper>
  );
}
