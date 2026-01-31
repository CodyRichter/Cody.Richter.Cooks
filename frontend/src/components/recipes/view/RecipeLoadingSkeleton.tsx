import { Grid, Paper, Skeleton } from "@mantine/core";

import React from "react";

export default function RecipeLoadingSkeleton() {
  return (
    <Grid>
      <Paper
        shadow="lg"
        p="lg"
        radius="md"
        withBorder
        mb="md"
        style={{ borderLeft: "6px solid #e2a478", minHeight: "400px" }}
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
