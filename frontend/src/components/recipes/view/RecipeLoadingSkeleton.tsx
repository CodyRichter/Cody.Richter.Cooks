'use client';

import { Grid, Paper, Skeleton } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import React from "react";

export default function RecipeLoadingSkeleton() {
  const isMobile = useMediaQuery('(max-width: 768px)', false, { getInitialValueInEffect: true });

  return (
    <Grid>
      <Paper
        shadow={isMobile ? "none" : "lg"}
        p={isMobile ? 0 : "lg"}
        radius={isMobile ? 0 : "md"}
        withBorder={!isMobile}
        bg={isMobile ? "transparent" : undefined}
        mb="md"
        style={{
          borderLeft: isMobile ? undefined : "6px solid var(--mantine-color-orange-4)",
          minHeight: "400px",
        }}
        w="100%"
      >
        <Skeleton height={10} mt={6} width="50%" radius="xl" />
        <Skeleton height={10} mt={6} width="50%" radius="xl" />
        <Skeleton height={10} mt={4} width="50%" radius="xl" />

        <Skeleton height={6} mt={20} width="80%" radius="xl" />
        <Skeleton height={6} mt={10} width="70%" radius="xl" />
        <Skeleton height={6} mt={10} width="70%" radius="xl" />
        <Skeleton height={6} mt={10} width="70%" radius="xl" />

        <Skeleton height={6} mt={40} width="80%" radius="xl" />
        <Skeleton height={6} mt={10} width="70%" radius="xl" />
        <Skeleton height={6} mt={10} width="70%" radius="xl" />
        <Skeleton height={6} mt={10} width="70%" radius="xl" />

        <Skeleton height={6} mt={40} width="80%" radius="xl" />
        <Skeleton height={6} mt={10} width="70%" radius="xl" />
        <Skeleton height={6} mt={10} width="70%" radius="xl" />
        <Skeleton height={6} mt={10} width="70%" radius="xl" />

        <Skeleton height={6} mt={40} width="80%" radius="xl" />
        <Skeleton height={6} mt={10} width="70%" radius="xl" />
        <Skeleton height={6} mt={10} width="70%" radius="xl" />
        <Skeleton height={6} mt={10} width="70%" radius="xl" />

        <Skeleton height={6} mt={40} width="80%" radius="xl" />
        <Skeleton height={6} mt={10} width="70%" radius="xl" />
        <Skeleton height={6} mt={10} width="70%" radius="xl" />
        <Skeleton height={6} mt={10} width="70%" radius="xl" />
      </Paper>
    </Grid>
  );
}
