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
                    return http_404('Recipe not found')

                return http_200(recipe)
            
            # If no query string ID parameter is provided, return a list of recipes
            else:
                try:
                    recipes = list_recipes()
                    return http_200(recipes)
                except e:
                    print(f"Interal Error: {traceback.format_exc()}")
                    return http_500("Internal Server Error. Please try again later. Code: LR-001")


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