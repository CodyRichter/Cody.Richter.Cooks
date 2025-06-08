import json
import traceback
from decimal import Decimal

from app.data.communication.Exceptions import UnauthorizedException
from app.data.communication.PutRecipeModels import PutRecipeResponse
from app.data.serde import serialize_recipe
from app.methods.put_recipe import put_recipe
from app.network.responses import http_201, http_400, http_405, http_500


# Main handler function for all Recipe interactions
# This function will handle the lambda-API gateway integration
def handle_event(event, context):
    try:
        # Any update options will be handled by the POST method
        # AuthN/AuthZ is required for this method. This is handled by the API Gateway.
        if event['httpMethod'] == 'POST':
            try:
                username = event['requestContext']['authorizer']['claims']['cognito:username']
            except KeyError:
                print("Unauthorized request. Missing username in request context.")
                return http_400("Unauthorized request. Missing username in request context.")

            try:
                recipe_dict = json.loads(event['body'], parse_float=Decimal)
                recipe = serialize_recipe(recipe_dict, username=username)
            except Exception as e:
                print("Invalid request body. Unable to parse Recipe JSON.")
                print(e)
                return http_400("Invalid request body. Unable to parse Recipe JSON.")

            created_recipe: PutRecipeResponse = put_recipe(recipe, username)
            return http_201(created_recipe.model_dump())

        print(f"Method not allowed: {event['httpMethod']}")
        return http_405()  # Method not allowed
    except UnauthorizedException:
        print("Unauthorized access attempt detected.")
        return http_400("Unauthorized access. Please check your credentials.")
    except Exception:
        print(f"Internal Error: {traceback.format_exc()}")
        return http_500("An error occurred while processing your request. Please try again later.")
