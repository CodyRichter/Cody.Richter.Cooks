from app.network.responses import http_200, http_404, http_405, http_500
from app.methods.get_recipe import get_recipe
from app.methods.list_recipes import list_recipes
import traceback

def handle_event(event, context):
    try:
        # GET method will be used to retrieve recipe(s)
        # No AuthN/AuthZ is required for this method
        if (event['httpMethod'] == 'GET'):
            # If a query string ID parameter is provided, return the recipe details
            if ('queryStringParameters' in event and event['queryStringParameters'] and 'id' in event['queryStringParameters']):
                try:
                    recipe = get_recipe(event['queryStringParameters']['id'])
                except:
                    print(f"Interal Error: {traceback.format_exc()}")
                    return http_500("Internal Server Error. Please try again later. Code: GR-001")

                if (recipe is None):
                    return http_404('Recipe not found')

                return http_200({'recipe': recipe})
            
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
            return http_200({
                'message': 'Sample Event Received!',
                'input': event,    
            })
        
        return http_405() # Method not allowed
    except Exception as e:
        print(f"Interal Error: {traceback.format_exc()}")
        return http_500("An error occurred while processing your request. Please try again later.")