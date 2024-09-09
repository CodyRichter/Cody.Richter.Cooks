import { Button, Center, Divider, Group, Modal, Text } from "@mantine/core";
import { useEffect, useState } from "react";

export default function DeleteRecipeModal({
  recipeTitle,
  opened,
  close,
}: {
  recipeTitle: string;
  opened: boolean;
  close: () => void;
}) {
  const [timeUntilDeletionEnabled, setTimeUntilDeletionEnabled] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeUntilDeletionEnabled((t) => t - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (opened) {
      setTimeUntilDeletionEnabled(3);
    }
  }, [opened]);

  function handleDeleteRecipe() {
    // Delete
    close();
  }

  return (
    <Modal
      opened={opened}
      onClose={close}
      title={`Delete ${recipeTitle}?`}
      size="lg"
    >
      <Divider mb="md" />

      <Text c="red" size="lg" fw={900} ta="center">
        Are you sure you want to delete this recipe? This action cannot be
        undone.
      </Text>
      <Divider mb="md" mt="md" />
      <Group justify="space-between">
        <Button variant="outline" onClick={close}>
          Cancel Deletion
        </Button>
        <Button
          color="red"
          disabled={timeUntilDeletionEnabled > 0}
          onClick={handleDeleteRecipe}
        >
          {timeUntilDeletionEnabled > 0 ? (
            <Center>
              <Text c="red" fw={300}>
                Disabled for {timeUntilDeletionEnabled} &thinsp;
                {timeUntilDeletionEnabled > 1 ? "seconds" : "second"}
              </Text>
            </Center>
          ) : (
            "Permanently Delete Recipe"
          )}
        </Button>
      </Group>
    </Modal>
  );
}
