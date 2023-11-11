import React from 'react';
import { Grid, Text } from '@mantine/core';

function Home() {
  return (
    <Grid>
      <Grid.Col>
        <Grid.Col span={12}>
          <Text ta="center" fw={700} size="xl">
            Welcome to Cody Richter Cooks!
          </Text>
        </Grid.Col>
      </Grid.Col>
    </Grid>
  );
}

export default Home;
