import os
from app.handler import handle_event
import json
import boto3
from moto import mock_aws
import pytest
from decimal import Decimal

from app.models.recipe import Recipe

test_recipe_data = {
    'id': '1',
    'title': 'Test Recipe',
    'description': 'This is a test recipe',
    'ingredients': [
        {
            'id': '1',
            'name': 'Test Ingredient',
            'quantity': Decimal(1.0),
            'unit': 'cup',
            'subtext': 'Optional subtext'
        }
    ],
    'instructions': [
        {
            'id': '1',
            'step_number': Decimal(0),
            'title': 'Step 1',
            'description': 'This is step 1'
        }
    ]
}

@pytest.fixture(scope="function")
def aws_credentials():
    """Mocked AWS Credentials for moto."""
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"
    os.environ["AWS_DEFAULT_REGION"] = "us-east-1"


@pytest.fixture
def aws_resource(aws_credentials):
    with mock_aws():
        yield boto3.resource("dynamodb", region_name="us-east-1")


@pytest.fixture
def aws_client(aws_credentials):
    with mock_aws():
        yield boto3.client("dynamodb", region_name="us-east-1")



@pytest.fixture
def mock_recipes_table(aws_resource):
        aws_resource.create_table(
            AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
            TableName="RecipeTable",
            KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
            ProvisionedThroughput={"ReadCapacityUnits": 5, "WriteCapacityUnits": 5},
        )
        table = aws_resource.Table("RecipeTable")
        table.wait_until_exists()

        yield table

# When no recipe ID is provided, a list of all recipe names should be returned
def test_get_all_recipes(mock_recipes_table):
    mock_recipes_table.put_item(Item=test_recipe_data)
    response = handle_event({'httpMethod': 'GET'}, {})
    
    assert response['statusCode'] == 200
    body = json.loads(response['body'])
    assert 'recipes' in body
    assert len(body['recipes']) == 1
    assert body['recipes'][0] == 'Test Recipe'

# When a recipe ID is provided, the recipe data should be returned
def test_get_recipe(mock_recipes_table):
    mock_recipes_table.put_item(Item=test_recipe_data)
    response = handle_event({'httpMethod': 'GET', 'queryStringParameters': {'id': '1'}}, {})
    
    assert response['statusCode'] == 200
    body = json.loads(response['body'])
    assert 'recipe' in body
    assert body['recipe']['id'] == '1'
    assert body['recipe']['title'] == 'Test Recipe'
    assert body['recipe']['description'] == 'This is a test recipe'
    assert body['recipe']['ingredients'] == test_recipe_data['ingredients']
    assert body['recipe']['instructions'] == test_recipe_data['instructions']


# When an invalid recipe ID is provided, a 404 response should be returned
def test_get_invalid_recipe(mock_recipes_table):
    mock_recipes_table.put_item(Item=test_recipe_data)
    response = handle_event({'httpMethod': 'GET', 'queryStringParameters': {'id': '2'}}, {})
    
    assert response['statusCode'] == 404
    body = json.loads(response['body'])
    assert body['detail'] == 'Recipe not found'