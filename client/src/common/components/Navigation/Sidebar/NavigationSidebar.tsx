import { Button, Skeleton } from "@mantine/core";

import { IconHome } from "@tabler/icons-react";
import React from "react";
import { useNavigate } from "react-router-dom";

export default function NavigationSidebar() {
  const navigate = useNavigate();

  return (
    <>
      <Button
        variant="light"
        leftSection={<IconHome size={16} />}
        onClick={() => navigate("/")}
      >
        Home
      </Button>
      {Array(15)
        .fill(0)
        .map((_, index) => (
          <Skeleton key={index} h={28} mt="sm" animate={false} />
        ))}
    </>
  );
}
