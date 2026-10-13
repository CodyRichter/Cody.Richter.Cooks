import { Box, Skeleton } from '@mantine/core';
import { SIDEBAR_RECIPES_PER_PAGE } from '@/config/pagination';

const WIDTHS = ['82%', '64%', '90%', '72%', '58%', '86%', '68%', '78%', '60%', '88%'];

// Each row takes the height of a sidebar NavLink so the list replaces it without shifting
export function SidebarListSkeleton() {
  return (
    <>
      {Array.from({ length: SIDEBAR_RECIPES_PER_PAGE }).map((_, i) => (
        <Box key={i} className="sidebarSkeletonRow">
          <Skeleton h={18} w={WIDTHS[i % WIDTHS.length]} radius="sm" />
        </Box>
      ))}
    </>
  );
}
