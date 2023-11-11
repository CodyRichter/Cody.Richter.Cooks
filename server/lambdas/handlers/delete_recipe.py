from constants import table
import json


def lambda_handler(event, context):
    try:
        recipe_name = json.loads(event['body'])['name']
    except (KeyError, json.decoder.JSONDecodeError):
        return {
            'statusCode': 400,
            'body': json.dumps('You must provide a recipe name.')
        }
    
    try:
        table.delete_item(
            Key={
                'name': recipe_name
            }
        )
    except table.meta.client.exceptions.ResourceNotFoundException:
        return {
            'statusCode': 404,
            'body': json.dumps('Unable to delete recipe. Recipe not found.')
        }
    
    return {
        'statusCode': 200,
        'body': json.dumps('Recipe deleted successfully.')
    }
