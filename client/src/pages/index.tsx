import { Grid, Text } from "@mantine/core";

import React from "react";

export default function Index() {
  return (
    <Grid>
      <Grid.Col>
        <Grid.Col span={12}>
          <Text ta="center" fw={700} size="xl">
            Welcome to Cody Richter Cooks!
          </Text>

          <Text ta="center" size="xl">
            Cody Richter Cooks is the home of all of my recipes, cooking tips,
            and more! I'm a self-taught home cook who loves to share my passion
            for cooking with others. I hope you enjoy my recipes as much as I
            do.
          </Text>
        </Grid.Col>
      </Grid.Col>
    </Grid>
  );
}
