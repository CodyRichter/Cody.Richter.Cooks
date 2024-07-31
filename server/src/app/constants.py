import decimal
import json
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('RecipeTable')

def get_table():
    return table

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, decimal.Decimal): return float(obj)
