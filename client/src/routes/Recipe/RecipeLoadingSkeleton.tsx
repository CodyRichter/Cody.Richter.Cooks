import React from "react";
import { Skeleton } from "@mantine/core";

export default function RecipeLoadingSkeleton() {
  return (
    <>
      <Skeleton height={10} mt={6} width="50%" radius="xl" />
      <Skeleton height={10} mt={6} width="50%" radius="xl" />
      <Skeleton height={10} mt={4} width="50%" radius="xl" />

      <Skeleton height={6} mt={20} width="90%" radius="xl" />
      <Skeleton height={6} mt={10} width="90%" radius="xl" />
      <Skeleton height={6} mt={10} width="90%" radius="xl" />
      <Skeleton height={6} mt={10} width="90%" radius="xl" />
      <Skeleton height={6} mt={10} width="90%" radius="xl" />
      <Skeleton height={6} mt={10} width="90%" radius="xl" />
      <Skeleton height={6} mt={10} width="90%" radius="xl" />
      <Skeleton height={6} mt={10} width="55%" radius="xl" />
    </>
  );
}
