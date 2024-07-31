from app.constants import table
from app.data.model.Recipe import Recipe

def put_recipe(recipe: Recipe):
    created_recipe = put_recipe_internal(table, recipe)
    return {"recipe": created_recipe}

def put_recipe_internal(table, recipe: Recipe):
    table.put_item(Item=recipe.model_dump())
    return recipe.model_dump()