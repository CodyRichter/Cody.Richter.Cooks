from app.constants import table

def get_recipe(recipe_id: str):
    print(f"Getting recipe with ID: {recipe_id}")
    recipe_data = get_recipe_internal(table, recipe_id)
    return {'recipe': recipe_data}


def get_recipe_internal(table, recipe_id: str):
    recipe_data = table.get_item(Key={'id': recipe_id}).get('Item')
    if recipe_data is None:
        print(f"Recipe not found: {recipe_id}")
        return {}
    return recipe_data