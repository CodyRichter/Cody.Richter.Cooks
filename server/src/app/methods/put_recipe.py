from app.constants import get_table

def put_recipe(name: str, recipe: dict):
    table = get_table()
    recipe = {
            'name': name,
            'recipe': recipe
        }
    table.put_item(Item=recipe)