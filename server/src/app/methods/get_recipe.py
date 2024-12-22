from app.constants import table, recipe_bucket
from app.data.model import Recipe

def get_recipe(recipe_id: str):
    print(f"Getting recipe with ID: {recipe_id}")
    recipe_data = get_recipe_internal(table, recipe_id)
    return {'recipe': recipe_data}


def get_recipe_internal(table, recipe_id: str):
    """
    Gets a recipe from the database. We store the recipe description
    in S3 instead of DynamoDB to allow for larger recipe descriptions.
    This function will splice together the recipe metadata from
    DynamoDB and the recipe description from S3.
    """
    recipe_data = table.get_item(Key={'id': recipe_id}).get('Item')

    if recipe_data is None:
        print(f"Recipe not found: {recipe_id}")
        return {}
    
    # If the recipe description is stored in S3, fetch it and update the recipe data
    recipe_data['description'] = recipe_bucket.Object(recipe_data['description']).get()['Body'].read().decode('utf-8')
    return recipe_data