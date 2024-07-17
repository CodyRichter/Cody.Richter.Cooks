import React from "react";
import { Skeleton } from "@mantine/core";

export default function NavigationSkeleton() {
  return (
    <>
      {Array(15)
        .fill(0)
        .map((_, index) => (
          <Skeleton key={`sidebar-${index}`} h={28} mt="sm" animate={false} />
        ))}
    </>
  );
}
