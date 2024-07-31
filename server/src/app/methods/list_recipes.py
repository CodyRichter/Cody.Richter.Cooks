from app.constants import table
from app.utilities.core_utils import is_defined


def list_recipes():
    print("Listing all recipes")
    recipe_list = list_recipes_internal(table)
    return {'recipes': recipe_list}


def list_recipes_internal(table):
    response = table.scan(ProjectionExpression='id,title')
    
    if not is_defined(response, ['Items']):
        print("No recipes found")
        return []
    
    print(f"Found {len(response['Items'])} recipes")
    return response['Items']