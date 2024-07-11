from app.constants import get_table

def get_recipe(recipe_id: str):
    table = get_table()
    recipe_data = table.get_item(Key={'id': recipe_id}).get('Item')
    return recipe_data