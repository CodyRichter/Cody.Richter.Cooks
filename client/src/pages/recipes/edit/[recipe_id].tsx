import { useRouter } from "next/router";

export default function ViewRecipe() {
  const router = useRouter();
  const recipe_id = router.query.recipe_id;

  return <>EDIT!!! {recipe_id}</>;
}
