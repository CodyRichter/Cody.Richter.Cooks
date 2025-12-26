import { Button, Center, Divider, Group, Modal, Text } from "@mantine/core";
import { useEffect, useState } from "react";

import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { useDeleteRecipe } from "@/hooks/useRecipes";

export default function DeleteRecipeModal({
  recipeTitle,
  recipeId,
  opened,
  close,
}: {
  recipeTitle: string;
  recipeId: string;
  opened: boolean;
  close: () => void;
}) {
  const [timeUntilDeletionEnabled, setTimeUntilDeletionEnabled] = useState(0);
  const router = useRouter();

  const { mutate: deleteRecipe, isPending, error } = useDeleteRecipe();

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeUntilDeletionEnabled((t) => t - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (opened) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeUntilDeletionEnabled(3);
    }
  }, [opened]);

  const handleDeleteRecipe = async () => {
    try {
      await deleteRecipe(recipeId);

      // Show success notification
      notifications.show({
        title: "Recipe Deleted",
        message: `"${recipeTitle}" has been deleted.`,
        color: "green",
      });

      // Close modal and navigate to home
      close();
      router.push('/');
    } catch (err) {
      // Error is handled by the mutation hook
      console.error('Delete failed:', err);
    }
  };

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

      {error && (
        <Text c="red" fw={500} ta="center" mt="md">
          {error.message || 'Failed to delete recipe. Please try again.'}
        </Text>
      )}

      <Divider mb="md" mt="md" />
      <Group justify="space-between">
        <Button variant="outline" onClick={close} disabled={isPending}>
          Cancel Deletion
        </Button>
        <Button
          color="red"
          disabled={timeUntilDeletionEnabled > 0 || isPending}
          loading={isPending}
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
