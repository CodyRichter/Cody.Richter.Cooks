from app.constants import get_table


def list_recipes():
    table = get_table()
    response = table.scan(ProjectionExpression='title')

    if not response or 'Items' not in response:
        return {'recipes': []}
    
    recipes = [item['title'] for item in response['Items']]
    return {'recipes': recipes}