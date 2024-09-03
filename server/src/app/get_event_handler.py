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
        # GET method will be used to retrieve recipe(s)
        # No AuthN/AuthZ is required for this method
        if (event['httpMethod'] == 'GET'):
            # If a query string ID parameter is provided, return the recipe details
            if is_defined(event, ['queryStringParameters', 'id']):
                try:
                    recipe_id = event['queryStringParameters']['id']
                    recipe = get_recipe(recipe_id)
                except:
                    print(f"Interal Error: {traceback.format_exc()}")
                    return http_500("Internal Server Error. Please try again later. Code: GR-001")

                if not is_defined(recipe, ['recipe']) or len(recipe['recipe']) == 0:
                    print(f"Recipe not found with ID: {recipe_id}")
                    return http_404('Recipe not found')

                return http_200(recipe)
            
            # If no query string ID parameter is provided, return a list of recipes
            else:
                try:
                    recipes = list_recipes()
                    print(f"Returning {len(recipes)} recipes.")
                    return http_200(recipes)
                except Exception as e:
                    print(f"Interal Error: {traceback.format_exc(e)}")
                    return http_500("Internal Server Error. Please try again later. Code: LR-001")
        
        print(f"Method not allowed: {event['httpMethod']}")
        return http_405() # Method not allowed
    except Exception as e:
        print(f"Interal Error: {traceback.format_exc()}")
        return http_500("An error occurred while processing your request. Please try again later.")