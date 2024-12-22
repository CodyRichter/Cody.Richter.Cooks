from app.constants import table, recipe_bucket
from app.data.model.Recipe import Recipe

def put_recipe(recipe: Recipe):
    print(f"Creating recipe with ID: {recipe.id}")
    created_recipe = put_recipe_internal(table, recipe)
    return {"recipe": created_recipe}

def put_recipe_internal(table, recipe: Recipe):
    """
    Puts a recipe into the database. We store the recipe description
    in S3 instead of DynamoDB to allow for larger recipe descriptions.
    """

    # Step 1: Put the Recipe Description in S3 and update the Recipe Object
    recipe_bucket.put_object(Key=recipe.id, Body=recipe.description)
    recipe.description = f"s3://{recipe_bucket.name}/{recipe.id}"

    # Step 2: Put the Recipe Metadata in DynamoDB
    table.put_item(Item=recipe.model_dump())
    print(f"Recipe created: {recipe.id}")
    return recipe.model_dump()