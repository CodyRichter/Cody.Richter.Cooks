from app.constants import table as ddb_recipe_table, recipe_bucket
from app.data.communication.PutRecipeModels import PutRecipeResponse
from app.data.communication.Exceptions import UnauthorizedException
from app.data.model.Recipe import Recipe


def put_recipe(recipe: Recipe, username: str) -> PutRecipeResponse:
    return put_recipe_internal(ddb_recipe_table, recipe, username)


def put_recipe_internal(table, recipe: Recipe, username: str) -> PutRecipeResponse:
    """
    Puts a recipe into the database. We store the recipe description
    in S3 instead of DynamoDB to allow for larger recipe descriptions.

    This function also can perform updates to existing recipes.
    """

    # Step 0: Validate the Recipe Object and Confirm User Authorization
    ddb_recipe = table.get_item(Key={'id': recipe.id})
    print(f"ddb_recipe['Item']['username']" if 'Item' in ddb_recipe else "No item found in DynamoDB")
    if 'Item' in ddb_recipe and ddb_recipe['Item']['username'] != username:
        raise UnauthorizedException()
    
    # Step 1: Put the Recipe Description in S3 and update the Recipe Object
    recipe_bucket.put_object(Key=recipe.id, Body=recipe.description)
    recipe.description = f"s3://{recipe_bucket.name}/{recipe.id}"

    # Associate the username with the recipe
    recipe.username = username

    # Step 2: Put the Recipe Metadata in DynamoDB
    table.put_item(Item=recipe.model_dump())

    print(f"[Put Recipe] Recipe Successfully Created. Recipe ID: {recipe.id}")

    return PutRecipeResponse(recipe=recipe)
