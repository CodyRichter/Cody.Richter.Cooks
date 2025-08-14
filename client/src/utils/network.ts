import { BASE_URL, NetworkResult } from "@/common/types/constants";

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
      } else {
        console.error("Recipe Load Error", response);
        setNetworkResult({
          isLoading: false,
          error: "404",
          response: null,
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

export async function listRecipesFromNetwork(
  paginationKey: string | undefined,
  setNetworkResult: (result: NetworkResult) => void
) {
  setNetworkResult({
    isLoading: true,
    error: "",
    response: null,
  });

  const searchParams = new URLSearchParams();
  if (paginationKey) {
    searchParams.append("pagination_key", paginationKey);
  }

  fetch(BASE_URL + `/recipes?${searchParams.toString()}`, {
    method: "GET",
  })
    .then((response) => {
      if (response.ok) {
        response
          .json()
          .then((data) => {
            setNetworkResult({
              isLoading: false,
              error: "",
              response: {
                recipes: data["recipes"],
                paginationKey: data["pagination_key"] as string,
              },
            });
          })
          .catch((e) => {
            console.error("Recipe Load Error", e);
            setNetworkResult({
              isLoading: false,
              error:
                "An error occurred while fetching recipes. Please try again later.",
              response: null,
            });
          });
      } else {
        console.error("Recipe Load Error", response);
        setNetworkResult({
          isLoading: false,
          error:
            "An error occurred while fetching recipes. Please try again later.",
          response: null,
        });
      }
    })
    .catch((e) => {
      console.error("Recipe Load Error", e);
      setNetworkResult({
        isLoading: false,
        error:
          "An error occurred while fetching recipes. Please try again later.",
        response: null,
      });
    });
}

export async function deleteRecipeFromNetwork(
  id: string,
  setNetworkResult: (result: NetworkResult) => void,
  auth: any
) {
  setNetworkResult({
    isLoading: true,
    error: "",
    response: null,
  });

  const searchParams = new URLSearchParams();
  searchParams.append("id", id);

  fetch(BASE_URL + `/recipes?${searchParams.toString()}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${auth.user?.id_token}`,
    },
  })
    .then((response) => {
      if (response.ok) {
        setNetworkResult({
          isLoading: false,
          error: "",
          response: "Successfully deleted",
        });
      } else {
        console.error("Recipe Deletion Error [1]", response);
        setNetworkResult({
          isLoading: false,
          error:
            "An error occurred while deleting the recipe. Please try again later.",
          response: null,
        });
      }
    })
    .catch((e) => {
      console.error("Recipe Deletion Error [2]", e);
      setNetworkResult({
        isLoading: false,
        error:
          "An error occurred while deleting the recipe. Please try again later.",
        response: null,
      });
    });
}

export async function createRecipeFromNetwork(
  recipe: Recipe,
  setNetworkResult: (result: NetworkResult) => void,
  auth: any
) {
  setNetworkResult({
    isLoading: true,
    error: "",
    response: null,
  });

  fetch(`${BASE_URL}/recipes`, {
    method: "POST",
    body: JSON.stringify(recipe),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.user?.id_token}`,
    },
  })
    .then((response) => {
      if (response.ok) {
        response
          .json()
          .then((data) => {
            setNetworkResult({
              isLoading: false,
              error: "",
              response: data,
            });
          })
          .catch((e) => {
            console.error("Recipe Creation Error (parse)", e);
            setNetworkResult({
              isLoading: false,
              error:
                "An error occurred while creating the recipe. Please try again later.",
              response: null,
            });
          });
      } else {
        console.error("Recipe Creation Error (response)", response);
        setNetworkResult({
          isLoading: false,
          error:
            "An error occurred while creating the recipe. Please try again later.",
          response: null,
        });
      }
    })
    .catch((e) => {
      console.error("Recipe Creation Error (network)", e);
      setNetworkResult({
        isLoading: false,
        error:
          "An error occurred while creating the recipe. Please try again later.",
        response: null,
      });
    });
}

export async function updateRecipeFromNetwork(
  recipe: Recipe,
  setNetworkResult: (result: NetworkResult) => void,
  auth: any
) {
  setNetworkResult({
    isLoading: true,
    error: "",
    response: null,
  });

  fetch(`${BASE_URL}/recipes`, {
    method: "POST",
    body: JSON.stringify(recipe),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.user?.id_token}`,
    },
  })
    .then((response) => {
      if (response.ok) {
        response
          .json()
          .then((data) => {
            setNetworkResult({
              isLoading: false,
              error: "",
              response: data,
            });
          })
          .catch((e) => {
            console.error("Recipe Update Error (parse)", e);
            setNetworkResult({
              isLoading: false,
              error:
                "An error occurred while updating the recipe. Please try again later.",
              response: null,
            });
          });
      } else {
        console.error("Recipe Update Error (response)", response);
        setNetworkResult({
          isLoading: false,
          error:
            "An error occurred while updating the recipe. Please try again later.",
          response: null,
        });
      }
    })
    .catch((e) => {
      console.error("Recipe Update Error (network)", e);
      setNetworkResult({
        isLoading: false,
        error:
          "An error occurred while updating the recipe. Please try again later.",
        response: null,
      });
    });
}
