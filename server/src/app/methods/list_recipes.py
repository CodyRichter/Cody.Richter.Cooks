from app.constants import get_table
from app.utilities.core_utils import is_defined


def list_recipes():
    table = get_table()
    recipe_list = list_recipes_internal(table)
    return {'recipes': recipe_list}


def list_recipes_internal(table):
    response = table.scan(ProjectionExpression='title')
    
    if not is_defined(response, ['Items']):
        return []
    
    recipes = [item['title'] for item in response['Items']]
    return recipes