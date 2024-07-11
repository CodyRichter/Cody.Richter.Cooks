import decimal
import json
import boto3

def get_table():
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('RecipeTable')
    return table

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, decimal.Decimal): return float(obj)
