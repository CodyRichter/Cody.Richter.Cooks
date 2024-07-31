from app.constants import table
from app.data.model.Recipe import Recipe

def put_recipe(recipe: Recipe):
    print(f"Creating recipe with ID: {recipe.id}")
    created_recipe = put_recipe_internal(table, recipe)
    return {"recipe": created_recipe}

def put_recipe_internal(table, recipe: Recipe):
    table.put_item(Item=recipe.model_dump())
    print(f"Recipe created: {recipe.id}")
    return recipe.model_dump()