import DesktopSortableRecipeInstruction from "@/components/recipes/edit/instructions/DesktopSortableRecipeInstruction";
import MobileSortableRecipeInstruction from "@/components/recipes/edit/instructions/MobileSortableRecipeInstruction";
import { RecipeDetail } from "@/types/Recipe";
import { useMediaQuery } from "@mantine/hooks";
import { UseFormReturnType } from "@mantine/form";

interface SortableRecipeInstructionProps {
  form: UseFormReturnType<RecipeDetail>;
  index: number;
  instructionId: string;
}

/**
 * Responsive wrapper that renders the appropriate sortable instruction component.
 * memo() is not used here since the form prop doesn't benefit from memoization.
 */
export default function SortableRecipeInstruction({
  form,
  index,
  instructionId,
}: SortableRecipeInstructionProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (isMobile) {
    return (
      <MobileSortableRecipeInstruction
        form={form}
        index={index}
        instructionId={instructionId}
      />
    );
  }

  return (
    <DesktopSortableRecipeInstruction
      form={form}
      index={index}
      instructionId={instructionId}
    />
  );
}
