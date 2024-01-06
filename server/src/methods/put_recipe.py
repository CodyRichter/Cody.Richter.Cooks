from constants import table

def put_recipe(name: str, recipe: dict):
    recipe = {
            'name': name,
            'recipe': recipe
        }
    table.put_item(Item=recipe)