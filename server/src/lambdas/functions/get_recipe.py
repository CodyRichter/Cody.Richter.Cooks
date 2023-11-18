import json
from constants import table


def lambda_handler(event, context):
    # Get the recipe name from the query params
    try:
        recipe_name = event['queryStringParameters'].get('name')
    except:
        recipe_name = None

    if recipe_name:
        # Get the recipe by name
        response = table.get_item(Key={'name': recipe_name})
        recipe = response.get('Item')

        if recipe:
            # Return the recipe if it exists
            return {
                'statusCode': 200,
                'body': json.dumps(recipe)
            }
        else:
            # Return an error if the recipe doesn't exist
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'Recipe not found'})
            }
    else:
        # Get a list of all recipe names
        response = table.scan(ProjectionExpression='name')
        recipes = [item['name'] for item in response['Items']]

        # Return the list of recipe names
        return {
            'statusCode': 200,
            'body': json.dumps(recipes)
        }
