from src.data.communication.DeleteRecipeModels import DeleteRecipeRequest, DeleteRecipeResponse
from src.data.communication.Exceptions import UnauthorizedException
from src.utilities.constants import table as ddb_recipe_table, recipe_bucket

def delete_recipe(request: DeleteRecipeRequest) -> DeleteRecipeResponse:
    """
    Deletes a recipe from the database. This method will delete the recipe description
    from S3 and the recipe metadata from DynamoDB.
    """
    return delete_recipe_internal(ddb_recipe_table, request)

def delete_recipe_internal(table, request: DeleteRecipeRequest) -> DeleteRecipeResponse:
    recipe_id = request.recipe_id
    username = request.username

    ddb_recipe = table.get_item(Key={'id': recipe_id})

    # Delete is idempotent, so if the recipe does not exist, we return success
    if 'Item' not in ddb_recipe:
        return DeleteRecipeResponse(success=True, message="Recipe not found.")

    # Check if the recipe belongs to the user, otherwise return an error
    if ddb_recipe['Item']['username'] != username:
        raise UnauthorizedException()

    # Step 1: Delete the Recipe Description from S3
    recipe_bucket.delete_objects(
        Delete={
            'Objects': [{'Key': recipe_id}]
        }
    )

    # Step 2: Delete the Recipe Metadata from DynamoDB
    table.delete_item(Key={'id': recipe_id})

    print(f"[Delete Recipe] Recipe Successfully Deleted. Recipe ID: {recipe_id}")

    return DeleteRecipeResponse(success=True)