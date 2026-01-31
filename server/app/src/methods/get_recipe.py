from src.utilities.constants import table as ddb_recipe_table, recipe_bucket_name, s3
from botocore.exceptions import ClientError

from src.data.communication.GetRecipeModels import GetRecipeRequest, GetRecipeResponse


def get_recipe(request: GetRecipeRequest) -> GetRecipeResponse:
    """
    Gets a recipe from the database. This will return the complete
    recipe if it exists. Otherwise, None is returned in the recipe field.
    """
    return get_recipe_internal(ddb_recipe_table, request.recipe_id)


def get_recipe_internal(table, recipe_id: str) -> GetRecipeResponse:
    """
    Gets a recipe from the database. We store the recipe description
    in S3 instead of DynamoDB to allow for larger recipe descriptions.
    This function will splice together the recipe metadata from
    DynamoDB and the recipe description from S3.
    """
    recipe_data = table.get_item(Key={'id': recipe_id}).get('Item')

    if not recipe_data:
        return GetRecipeResponse(recipe=None)

    # If the recipe description is stored in S3 since it contains long-form content and
    # additional HTML formatting. Before returning the recipe, we need to fetch the description
    # from S3 and stitch it into the data.
    try:
        s3_object_data = s3.Object(recipe_bucket_name, recipe_id)
        recipe_data['description'] = s3_object_data.get()['Body'].read().decode('utf-8')
    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchKey':
            print(f'No description found in S3 for recipe {recipe_id}.')
            recipe_data['description'] = "... No description available ..."
        else:
            raise

    return GetRecipeResponse(recipe=recipe_data)
