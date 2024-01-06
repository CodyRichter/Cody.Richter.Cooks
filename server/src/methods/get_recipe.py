from constants import table

def get_recipe(recipe_id: str):
    return table.get_item(Key={'id': recipe_id}).get('Item')