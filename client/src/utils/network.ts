import { BASE_URL, NetworkResult } from "@/common/network/constants";

import Recipe from "@/common/types/Recipe";

export async function getRecipeFromNetwork(
  recipe_id: string | undefined,
  setNetworkResult: (result: NetworkResult) => void
) {
  // If no recipe ID is provided, set the network result to an error
  if (!recipe_id) {
    setNetworkResult({
      isLoading: false,
      error: "No recipe ID provided. Please try again later.",
      response: null,
    });
    return;
  } else {
    setNetworkResult({
      isLoading: true,
      error: "",
      response: null,
    });
  }

  fetch(
    BASE_URL +
      `/recipes?` +
      new URLSearchParams({
        id: recipe_id!,
      }),
    {
      method: "GET",
    }
  )
    .then((response) => {
      if (response.ok) {
        response
          .json()
          .then((data) => {
            setNetworkResult({
              isLoading: false,
              error: "",
              response: data["recipe"] as Recipe,
            });
          })
          .catch((e) => {
            console.error("Recipe Load Error", e);
            setNetworkResult({
              isLoading: false,
              error:
                "An error occurred while fetching the recipe. Please try again later.",
              response: null,
            });
          });
      }
    })
    .catch((e) => {
      console.error("Recipe Load Error", e);

      setNetworkResult({
        isLoading: false,
        error:
          "An error occurred while fetching the recipe. Please try again later.",
        response: null,
      });
    });
}
