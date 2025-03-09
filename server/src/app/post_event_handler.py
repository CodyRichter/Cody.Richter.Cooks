import json
import traceback
from decimal import Decimal

from app.data.communication.DeleteRecipeModels import DeleteRecipeRequest
from app.data.communication.PutRecipeModels import PutRecipeResponse
from app.data.serde import serialize_recipe
from app.methods.delete_recipe import delete_recipe
from app.methods.put_recipe import put_recipe
from app.network.responses import http_201, http_400, http_405, http_500, http_200
from app.utilities.core_utils import is_defined


# Main handler function for all Recipe interactions
# This function will handle the lambda-API gateway integration
def handle_event(event, context):
    try:
        # Any update options will be handled by the POST method
        # AuthN/AuthZ is required for this method. This is handled by the API Gateway.
        # We can assume that if the request reaches this point, the user is authorized to perform the action.
        if event['httpMethod'] == 'POST':
            try:
                recipe_dict = json.loads(event['body'], parse_float=Decimal)
                recipe = serialize_recipe(recipe_dict)
            except Exception as e:
                print("Invalid request body. Unable to parse Recipe JSON.")
                print(e)
                return http_400("Invalid request body. Unable to parse Recipe JSON.")

            created_recipe: PutRecipeResponse = put_recipe(recipe)
            return http_201(created_recipe.model_dump())
        elif event['httpMethod'] == 'DELETE':
            if not is_defined(event, ['queryStringParameters', 'id']):
                return http_400("Missing required query parameter: id")
            delete_request = DeleteRecipeRequest(
                recipe_id=event['queryStringParameters']['id']
            )
            delete_recipe_response = delete_recipe(delete_request)
            return http_200(delete_recipe_response.model_dump())

        print(f"Method not allowed: {event['httpMethod']}")
        return http_405()  # Method not allowed
    except Exception:
        print(f"Interal Error: {traceback.format_exc()}")
        return http_500("An error occurred while processing your request. Please try again later.")
