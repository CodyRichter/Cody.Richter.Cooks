from app.data.model.Ingredient import Ingredient
from app.data.model.Recipe import Recipe
from app.data.model.InstructionStep import InstructionStep
from app.utilities.core_utils import generate_id


# Serialize a JSON/Dictionary Recipe object to Pydantic object
def serialize_recipe(recipe_dict: dict):
    try:
        ingredients = [Ingredient.model_validate(ingredient) for ingredient in recipe_dict['ingredients']]
        instructions = [InstructionStep.model_validate(instruction) for instruction in recipe_dict['instructions']]

        if 'id' not in recipe_dict:
            recipe_dict['id'] = generate_id()
            recipes = {**recipe_dict, **{'ingredients': ingredients, 'instructions': instructions}}

        recipes = {**recipe_dict, **{'ingredients': ingredients, 'instructions': instructions}}
        return Recipe.model_validate(recipes)
    except Exception as e:
        print(f"An error occurred while serializing the Recipe object. Error Details: {e}")
        raise e

    