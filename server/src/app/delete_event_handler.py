import traceback

from app.data.communication.DeleteRecipeModels import DeleteRecipeRequest
from app.data.communication.Exceptions import UnauthorizedException
from app.methods.delete_recipe import delete_recipe
from app.network.responses import http_400, http_405, http_500, http_200
from app.utilities.core_utils import is_defined


# Main handler function for all Recipe interactions
# This function will handle the lambda-API gateway integration
def handle_event(event, context):
    try:
        # Deletion of recipes will be handled by the DELETE method
        # AuthN/AuthZ is required for this method. This is handled by the API Gateway.
        # We can assume that if the request reaches this point, the user is authorized to perform the action.
        if event['httpMethod'] == 'DELETE':
            if not is_defined(event, ['queryStringParameters', 'id']):
                return http_400("Missing required query parameter: id")
            
            try:
                username = event['requestContext']['authorizer']['claims']['cognito:username']
            except KeyError:
                print("Unauthorized request. Missing username in request context.")
                return http_400("Unauthorized request. Missing username in request context.")

            delete_request = DeleteRecipeRequest(
                recipe_id=event['queryStringParameters']['id'],
                username=username
            )
            delete_recipe_response = delete_recipe(delete_request)

            return http_200(delete_recipe_response.model_dump())

        print(f"Method not allowed: {event['httpMethod']}")
        return http_405()  # Method not allowed
    except UnauthorizedException:
        print("Unauthorized access attempt detected.")
        return http_400("Unauthorized access. Please check your credentials.")
    except Exception:
        print(f"Internal Error: {traceback.format_exc()}")
        return http_500("An error occurred while processing your request. Please try again later.")

