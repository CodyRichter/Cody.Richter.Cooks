from decimal import Decimal
import json

from src.data.communication.GetRecipeModels import GetRecipeRequest, GetRecipeResponse
from src.data.communication.ListRecipeModels import ListRecipeRequest, ListRecipeResponse
from src.data.serde import serialize_recipe
from src.methods.get_recipe import get_recipe
from src.methods.put_recipe import put_recipe
from src.methods.list_recipes import list_recipes
from src.network.responses import http_200, http_201, http_400, http_404, http_405, http_500
from src.utilities.core_utils import is_defined
import traceback

# Main handler function for all Recipe interactions
# This function will handle the lambda-API gateway integration
def handle_event(event, context):
    try:
        # GET method will be used to retrieve recipe(s)
        # No AuthN/AuthZ is required for this method
        if event['httpMethod'] == 'GET':
            # If a query string ID parameter is provided, return the recipe details
            if is_defined(event, ['queryStringParameters', 'id']):
                try:
                    get_recipe_request = GetRecipeRequest(recipe_id=event['queryStringParameters']['id'])
                    get_recipe_response: GetRecipeResponse = get_recipe(get_recipe_request)
                except:
                    print(f"Interal Error: {traceback.format_exc()}")
                    return http_500("Internal Server Error. Please try again later. Code: GR-001")

                if not get_recipe_response.recipe:
                    print(f"Recipe not found with ID: {get_recipe_request.recipe_id}")
                    return http_404(f'Recipe not found with ID: {get_recipe_request.recipe_id}')

                return http_200(get_recipe_response.model_dump())
            
            # If no query string ID parameter is provided, return a list of recipes.
            # This will be used to display the recipes on the sidebar, and is able to handle pagination.
            else:
                try:
                    list_recipe_request = ListRecipeRequest(
                        pagination_key=event['queryStringParameters']['pagination_key']
                            if is_defined(event, ['queryStringParameters', 'pagination_key']) else None
                    )
                    list_recipe_response: ListRecipeResponse = list_recipes(list_recipe_request)
                    print(f"[List Recipe]: Returning {len(list_recipe_response.recipes)} recipes.")
                    return http_200(list_recipe_response.model_dump())
                except Exception as e:
                    print(f"Interal Error: {traceback.format_exc(e)}")
                    return http_500("Internal Server Error. Please try again later. Code: LR-001")
        
        print(f"Method not allowed: {event['httpMethod']}")
        return http_405() # Method not allowed
    except Exception:
        print(f"Interal Error: {traceback.format_exc()}")
        return http_500("An error occurred while processing your request. Please try again later.")