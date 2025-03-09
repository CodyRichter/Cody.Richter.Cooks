import { Alert } from "@mantine/core";
import { IconError404 } from "@tabler/icons-react";

export default function RecipeNotFound() {
  return (
    <Alert
      variant="filled"
      color="red"
      title="Recipe Not Found."
      icon={<IconError404 />}
    >
      The recipe you are looking for could not be found. Please check the URL
      and try again.
    </Alert>
  );
}
