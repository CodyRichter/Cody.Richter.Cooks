import DesktopSortableRecipeInstruction from "@/components/recipes/edit/instructions/DesktopSortableRecipeInstruction";
import MobileSortableRecipeInstruction from "@/components/recipes/edit/instructions/MobileSortableRecipeInstruction";
import React from "react";
import { RecipeDetail } from "@/types/Recipe";
import { useMediaQuery } from "@mantine/hooks";
import { UseFormReturnType } from "@mantine/form";
import { memo } from "react";

const SortableRecipeInstruction = memo(({
  form,
  index,
}: {
  form: UseFormReturnType<RecipeDetail>;
  index: number;
}) => {
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (isMobile) {
    return (
      <MobileSortableRecipeInstruction
        form={form}
        index={index}
      />
    );
  }

  return (
    <DesktopSortableRecipeInstruction
      form={form}
      index={index}
    />
  );
});

SortableRecipeInstruction.displayName = 'SortableRecipeInstruction';

export default SortableRecipeInstruction;
