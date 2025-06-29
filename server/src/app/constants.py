import decimal
import json
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('RecipeTable')
s3 = boto3.resource('s3')
recipe_bucket_name = 'cody-richter-cooks-recipes'
recipe_bucket = boto3.resource('s3').Bucket(recipe_bucket_name)

RECIPES_PER_PAGE = 12

def get_table():
    return table

def get_recipe_bucket():
    return recipe_bucket

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, decimal.Decimal): return float(obj)
