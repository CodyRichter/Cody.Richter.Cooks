'use client';

import React from 'react';
import { Box, Container, Divider, Grid, Group, Paper, Skeleton, Stack } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

export const RecipeDetailSkeleton: React.FC = () => {
  const isMobile = useMediaQuery('(max-width: 768px)', false, {
    getInitialValueInEffect: true,
  });

  return (
    <Container size="xl" px={{ base: 'xs', sm: 'md' }} py={{ base: 'xs', sm: 'md' }}>
      <Stack gap={isMobile ? 'lg' : 'md'}>
        {/* Section 1: Overview & Details */}
        <Paper
          shadow={isMobile ? 'none' : 'xs'}
          p={isMobile ? 0 : 'xl'}
          radius={isMobile ? 0 : 'lg'}
          withBorder={!isMobile}
          bg={isMobile ? 'transparent' : undefined}
        >
          <Stack gap="md">
            {/* Top Bar: Title & Actions */}
            <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
              <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
                {/* Title */}
                <Skeleton height={isMobile ? 32 : 40} width="60%" radius="sm" />

                {/* Recipe Metadata Pills */}
                <Group gap="xs" wrap="wrap">
                  {/* Author */}
                  <Group gap={4} align="center">
                    <Skeleton height={14} width={14} radius="xl" />
                    <Skeleton height={14} width={75} radius="sm" />
                  </Group>
                  <Skeleton height={6} width={6} radius="xl" />

                  {/* Cooking Time */}
                  <Group gap={4} align="center">
                    <Skeleton height={14} width={14} radius="xl" />
                    <Skeleton height={14} width={60} radius="sm" />
                  </Group>
                  <Skeleton height={6} width={6} radius="xl" />

                  {/* Serving Size */}
                  <Group gap={4} align="center">
                    <Skeleton height={14} width={14} radius="xl" />
                    <Skeleton height={14} width={70} radius="sm" />
                  </Group>
                  <Skeleton height={6} width={6} radius="xl" />

                  {/* Date */}
                  <Skeleton height={14} width={75} radius="sm" />
                </Group>

                {/* Tags */}
                <Group gap="6px" mt={4} wrap="wrap">
                  <Skeleton height={24} width={70} radius="md" />
                  <Skeleton height={24} width={85} radius="md" />
                  <Skeleton height={24} width={60} radius="md" />
                </Group>
              </Stack>

              {/* Desktop Action Buttons */}
              <Group gap="xs" visibleFrom="sm" style={{ flexShrink: 0 }}>
                <Skeleton height={36} width={75} radius="md" />
                <Skeleton height={36} width={80} radius="md" />
                <Skeleton height={36} width={85} radius="md" />
              </Group>
            </Group>

            {/* Mobile Action Bar */}
            <Group gap="xs" grow hiddenFrom="sm" mt="xs">
              <Skeleton height={36} radius="md" />
              <Skeleton height={36} radius="md" />
              <Skeleton height={36} radius="md" />
            </Group>

            {/* Description Section */}
            <Divider />
            <Stack gap="xs">
              <Skeleton height={16} width="95%" radius="sm" />
              <Skeleton height={16} width="88%" radius="sm" />
              <Skeleton height={16} width="60%" radius="sm" />
            </Stack>
          </Stack>
        </Paper>

        {isMobile && <Divider />}

        {/* 2-Column Desktop Grid / Stacked Mobile Flow */}
        <Grid gap="md" style={{ alignItems: 'stretch' }}>
          {/* Section 2: Ingredients */}
          <Grid.Col
            span={{ base: 12, md: 5, lg: 4 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Paper
              withBorder={!isMobile}
              shadow={isMobile ? 'none' : 'xs'}
              radius={isMobile ? 0 : 'lg'}
              p={isMobile ? 0 : 'lg'}
              bg={isMobile ? 'transparent' : undefined}
              h="100%"
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              <Stack gap="sm" style={{ flex: 1 }}>
                {/* Title Bar */}
                <Group justify="space-between" align="center" wrap="nowrap">
                  <Skeleton height={24} width={110} radius="sm" />
                  <Skeleton height={26} width={70} radius="sm" />
                </Group>

                {/* Scaling Controls Bar */}
                <Box
                  p={isMobile ? '4px 0' : '6px 10px'}
                  style={{
                    backgroundColor: isMobile
                      ? 'transparent'
                      : 'var(--mantine-color-default-hover)',
                    borderRadius: 'var(--mantine-radius-md)',
                    border: isMobile
                      ? 'none'
                      : '1px solid var(--mantine-color-default-border)',
                  }}
                >
                  <Group justify="space-between" align="center" gap="xs" wrap="nowrap">
                    <Group gap={6} align="center" wrap="nowrap">
                      <Skeleton height={16} width={16} radius="sm" />
                      <Skeleton height={14} width={60} radius="sm" />
                    </Group>
                    <Skeleton height={26} width={80} radius="md" />
                  </Group>
                </Box>

                <Divider />

                {/* Ingredient Items List */}
                <Stack gap="xs" style={{ width: '100%', flex: 1 }}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Group key={i} align="center" wrap="nowrap" gap="xs" p="4px 0">
                      <Skeleton height={18} width={18} radius="xs" />
                      <Skeleton
                        height={15}
                        width={i % 3 === 0 ? '70%' : i % 3 === 1 ? '85%' : '55%'}
                        radius="sm"
                      />
                    </Group>
                  ))}
                </Stack>
              </Stack>
            </Paper>
          </Grid.Col>

          {isMobile && (
            <Grid.Col span={12}>
              <Divider />
            </Grid.Col>
          )}

          {/* Section 3: Instructions */}
          <Grid.Col
            span={{ base: 12, md: 7, lg: 8 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Paper
              withBorder={!isMobile}
              shadow={isMobile ? 'none' : 'xs'}
              radius={isMobile ? 0 : 'lg'}
              p={isMobile ? 0 : 'lg'}
              bg={isMobile ? 'transparent' : undefined}
              h="100%"
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              <Stack gap="sm" style={{ flex: 1 }}>
                {/* Card Header */}
                <Group justify="space-between" align="center">
                  <Skeleton height={24} width={120} radius="sm" />
                </Group>

                <Divider />

                {/* Steps List */}
                <Stack gap="md" style={{ flex: 1 }}>
                  {[1, 2, 3, 4].map((step, idx) => (
                    <Box key={step}>
                      <Group align="flex-start" wrap="nowrap" gap="sm">
                        {/* Step Number Circle */}
                        <Skeleton
                          height={28}
                          width={28}
                          radius="xl"
                          style={{ flexShrink: 0, marginTop: 2 }}
                        />

                        {/* Step Content */}
                        <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
                          <Group justify="space-between" align="center" wrap="wrap" gap="xs">
                            <Skeleton
                              height={18}
                              width={idx % 2 === 0 ? '45%' : '35%'}
                              radius="sm"
                            />
                            <Skeleton height={18} width={42} radius="sm" />
                          </Group>
                          <Skeleton height={14} width="100%" radius="sm" />
                          <Skeleton
                            height={14}
                            width={idx % 2 === 0 ? '90%' : '75%'}
                            radius="sm"
                          />
                        </Stack>
                      </Group>
                      {idx < 3 && <Divider mt="sm" variant="dashed" color="gray.2" />}
                    </Box>
                  ))}
                </Stack>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
};

export default RecipeDetailSkeleton;
