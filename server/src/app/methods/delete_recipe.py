from app.data.communication.DeleteRecipeModels import DeleteRecipeRequest, DeleteRecipeResponse
from app.constants import table as ddb_recipe_table, recipe_bucket

def delete_recipe(request: DeleteRecipeRequest) -> DeleteRecipeResponse:
    """
    Deletes a recipe from the database. This method will delete the recipe description
    from S3 and the recipe metadata from DynamoDB.
    """
    return delete_recipe_internal(ddb_recipe_table, request.recipe_id)

def delete_recipe_internal(table, recipe_id: str) -> DeleteRecipeResponse:
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