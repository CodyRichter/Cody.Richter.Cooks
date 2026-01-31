import { DndContext, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import Ingredient from "@/types/Ingredient";
import React from "react";
import Recipe from "@/types/Recipe";
import SortableRecipeIngredient from "./SortableRecipeIngredient";

interface EditRecipeIngredientsProps {
  recipe: Recipe;
  setRecipe: (recipe: Recipe) => void;
}

/**
 * The EditRecipeIngredients component is responsible for rendering the list of ingredients
 * for a recipe. It allows users to drag and drop ingredients to reorder them.
 * It uses the DnD Kit library for drag and drop functionality.
 */
export default function EditRecipeIngredients({
  recipe,
  setRecipe,
}: EditRecipeIngredientsProps) {
  const reorderIngredients = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!active || !over || !active.id || !over.id) {
      return;
    }
    if (active.id !== over.id) {
      setRecipe({
        ...recipe,
        ingredients: arrayMove(
          recipe.ingredients,
          recipe.ingredients.findIndex(
            (ingredient) => ingredient.id === active.id
          ),
          recipe.ingredients.findIndex(
            (ingredient) => ingredient.id === over.id
          )
        ),
      });
    }
  };

  return (
    <DndContext onDragEnd={reorderIngredients}>
      <SortableContext
        items={recipe.ingredients}
        strategy={verticalListSortingStrategy}
      >
        {recipe.ingredients.map((ingredient: Ingredient, index: number) => (
          <SortableRecipeIngredient
            key={ingredient.id}
            recipe={recipe}
            ingredient={ingredient}
            index={index}
            setRecipe={setRecipe}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}
