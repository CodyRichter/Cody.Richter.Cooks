from app.constants import table as ddb_recipe_table, recipe_bucket
from app.data.communication.PutRecipeModels import PutRecipeResponse
from app.data.model.Recipe import Recipe


def put_recipe(recipe: Recipe) -> PutRecipeResponse:
    return put_recipe_internal(ddb_recipe_table, recipe)


def put_recipe_internal(table, recipe: Recipe) -> PutRecipeResponse:
    """
    Puts a recipe into the database. We store the recipe description
    in S3 instead of DynamoDB to allow for larger recipe descriptions.
    """

    # Step 1: Put the Recipe Description in S3 and update the Recipe Object
    recipe_bucket.put_object(Key=recipe.id, Body=recipe.description)
    recipe.description = f"s3://{recipe_bucket.name}/{recipe.id}"

    # Step 2: Put the Recipe Metadata in DynamoDB
    table.put_item(Item=recipe.model_dump())

    print(f"[Put Recipe] Recipe Successfully Created. Recipe ID: {recipe.id}")

    return PutRecipeResponse(recipe=recipe)
