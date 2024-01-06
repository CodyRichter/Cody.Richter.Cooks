from constants import table

def list_recipes():
    response = table.scan(ProjectionExpression='name')
    return [item['name'] for item in response['Items']]