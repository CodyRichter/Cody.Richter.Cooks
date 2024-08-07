from decimal import Decimal
import json
from app.data.serde import serialize_recipe
from app.methods.get_recipe import get_recipe
from app.methods.put_recipe import put_recipe
from app.methods.list_recipes import list_recipes
from app.network.responses import http_200, http_201, http_400, http_404, http_405, http_500
from app.utilities.core_utils import is_defined
import traceback

# Main handler function for all Recipe interactions
# This function will handle the lambda-API gateway integration
def handle_event(event, context):
    print(f"Received event: {event} with context: {context}")
    try:
        # Any update options will be handled by the POST method
        # AuthN/AuthZ is required for this method. This is handled by the API Gateway.
        # We can assume that if the request reaches this point, the user is authorized to perform the action.
        if (event['httpMethod'] == 'POST'):
            try:
                recipe_dict = json.loads(event['body'], parse_float=Decimal)
                recipe = serialize_recipe(recipe_dict)
            except:
                return http_400("Invalid request body. Unable to parse Recipe JSON.")

            created_recipe = put_recipe(recipe)
            return http_201(created_recipe)
        
        return http_405() # Method not allowed
    except Exception as e:
        print(f"Interal Error: {traceback.format_exc()}")
        return http_500("An error occurred while processing your request. Please try again later.")