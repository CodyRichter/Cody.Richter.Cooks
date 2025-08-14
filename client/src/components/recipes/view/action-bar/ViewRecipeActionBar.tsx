import { Button, Group, Paper, Text } from "@mantine/core";
import { IconEdit, IconTrash } from "@tabler/icons-react";

import router from "next/router";
import { useMediaQuery } from "@mantine/hooks";

export default function ViewRecipeActionBar({
  recipeId,
  openDeleteModal,
}: {
  recipeId: string;
  openDeleteModal: () => void;
}) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <Paper
      shadow="lg"
      p={isMobile ? "sm" : "md"}
      w={isMobile ? "100%" : "auto"}
      radius="md"
      withBorder
      style={{
        background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
        borderColor: "#e9ecef",
      }}
    >
      <Group gap="sm" justify="center">
        <Button
          variant="light"
          color="blue"
          w={isMobile ? "40%" : "auto"}
          leftSection={<IconEdit size={14} />}
          onClick={() => {
            router.push(`/recipes/edit/${recipeId}`);
          }}
          size="sm"
          radius="sm"
          style={{
            transition: "all 0.2s ease",
          }}
        >
          {isMobile ? "Edit" : "Edit Recipe"}
        </Button>
        <Button
          variant="light"
          color="red"
          w={isMobile ? "40%" : "auto"}
          leftSection={<IconTrash size={14} />}
          onClick={openDeleteModal}
          size="sm"
          radius="sm"
          style={{
            transition: "all 0.2s ease",
          }}
        >
          {isMobile ? "Delete" : "Delete Recipe"}
        </Button>
      </Group>
    </Paper>
  );
}
