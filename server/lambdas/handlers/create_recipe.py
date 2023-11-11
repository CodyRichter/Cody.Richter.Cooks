import json
from constants import table

def lambda_handler(event, context):
    # Parse the HTTP input payload
    body = json.loads(event['body'])
    recipe_name = body['name']
    recipe_payload = body['payload']
    
    # Add the recipe to DynamoDB
    recipe = {
        'name': recipe_name,
        'recipe': recipe_payload
    }
    table.put_item(Item=recipe)
    
    # Return a success response
    response = {
        'statusCode': 201,
        'body': json.dumps({'message': 'Recipe created successfully!'})
    }
    return response
