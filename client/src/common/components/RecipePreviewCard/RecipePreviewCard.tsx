import { Card, Image, Text } from "@mantine/core";
import { useEffect, useState } from "react";

import { INITIAL_NETWORK_RESULT_WITH_LOADING } from "@/common/types/constants";
import RecipePreviewCardLoadingSkeleton from "./RecipePreviewCardLoadingSkeleton";
import { getRecipeFromNetwork } from "@/utils/network";
import parse from "html-react-parser";
import { useRouter } from "next/router";

interface RecipePreviewCardProps {
  recipe_id: string;
  image_url: string;
}

export default function RecipePreviewCard(
  previewCardProps: RecipePreviewCardProps
) {
  const [networkStatus, setNetworkStatus] = useState(
    INITIAL_NETWORK_RESULT_WITH_LOADING
  );
  const router = useRouter();

  useEffect(() => {
    getRecipeFromNetwork(previewCardProps.recipe_id, setNetworkStatus);
  }, [previewCardProps.recipe_id]);

  return (
    <>
      {networkStatus.isLoading && <RecipePreviewCardLoadingSkeleton />}
      {networkStatus.error && (
        <Text c="red" fw={500}>
          {networkStatus.error}
        </Text>
      )}
      {!networkStatus.isLoading &&
        !networkStatus.error &&
        networkStatus.response && (
          <Card
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            onClick={() =>
              router.push(`/recipes/view/${previewCardProps.recipe_id}`)
            }
            style={{
              cursor: "pointer",
            }}
          >
            <Card.Section>
              <Image
                src={previewCardProps.image_url}
                height={220}
                alt={networkStatus.response?.title}
              />
            </Card.Section>

            <Text fw={500} mt="md" mb="xs">
              {networkStatus.response?.title}
            </Text>

            <Text size="sm" c="dimmed">
              {parse(networkStatus.response?.description)}
            </Text>
          </Card>
        )}
    </>
  );
}
