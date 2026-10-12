import RecipeHome from "@/components/recipes/home/RecipeHome";
import { HOME_RECIPES_PER_PAGE } from "@/config/pagination";
import { fetchRecipeListForServer } from "@/utils/recipeServer";

// Must be a literal; keep in sync with RECIPE_REVALIDATE_SECONDS in utils/recipeServer
export const revalidate = 300;

export default async function Home() {
  const initialRecipes = await fetchRecipeListForServer(1, HOME_RECIPES_PER_PAGE);
  return <RecipeHome initialRecipes={initialRecipes ?? undefined} />;
}
