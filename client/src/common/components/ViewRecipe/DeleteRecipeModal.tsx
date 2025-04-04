import { Button, Center, Divider, Group, Modal, Text } from "@mantine/core";
import { useEffect, useState } from "react";

import { INITIAL_NETWORK_RESULT } from "@/common/network/constants";
import { deleteRecipeFromNetwork } from "@/utils/network";
import { notifications } from "@mantine/notifications";
import { useAuth } from "react-oidc-context";
import { useRouter } from "next/router";

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
  const auth = useAuth();
  const router = useRouter();

  const [networkStatus, setNetworkStatus] = useState(INITIAL_NETWORK_RESULT);

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

  useEffect(() => {
    // If the deletion was successful, show a notification and redirect
    if (networkStatus.response) {
      notifications.show({
        title: "Recipe Deleted",
        message: `"${recipeTitle}" has been deleted.`,
        color: "green",
      });

      router.push("/");
    }
  }, [networkStatus.response]);

  async function handleDeleteRecipe() {
    deleteRecipeFromNetwork(recipeId, setNetworkStatus, auth);
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

      {networkStatus.error && (
        <Text c="red" fw={500} ta="center" mt="md">
          {networkStatus.error}
        </Text>
      )}

      <Divider mb="md" mt="md" />
      <Group justify="space-between">
        <Button variant="outline" onClick={close}>
          Cancel Deletion
        </Button>
        <Button
          color="red"
          disabled={timeUntilDeletionEnabled > 0 || networkStatus.isLoading}
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
