import os
from app.handler import handle_event
import json
import boto3
from moto import mock_aws
import pytest
from decimal import Decimal

from app.constants import DecimalEncoder

test_recipe_data = {
    'title': 'Test Recipe',
    'description': 'This is a test recipe',
    'ingredients': [
        {
            'id': '1',
            'name': 'Test Ingredient',
            'quantity': '1',
            'unit': 'cup',
            'subtext': 'Optional subtext'
        }
    ],
    'instructions': [
        {
            'id': '1',
            'step_number': '0',
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

def test_put_new_recipe(mock_recipes_table):
    test_create_recipe_request = {
        'httpMethod': 'POST',
        'path': '/recipe',
        'body': json.dumps(test_recipe_data, cls=DecimalEncoder)
    }
    response = handle_event(test_create_recipe_request, None)
    assert response['statusCode'] == 201
    parsed_body = json.loads(response['body'])
    assert 'recipe' in parsed_body
    assert 'id' in parsed_body['recipe']


def test_put_invalid_recipe(mock_recipes_table):
    test_create_recipe_request = {
        'httpMethod': 'POST',
        'path': '/recipe',
        'body': json.dumps({'invalid': 'data'}, cls=DecimalEncoder)
    }
    response = handle_event(test_create_recipe_request, None)
    assert response['statusCode'] == 400

def test_update_recipe(mock_recipes_table):
    test_recipe_with_id = {**test_recipe_data, **{'id': '123'}}

    test_create_recipe_request = {
        'httpMethod': 'POST',
        'path': '/recipe',
        'body': json.dumps(test_recipe_with_id, cls=DecimalEncoder)
    }

    response = handle_event(test_create_recipe_request, None)
    assert response['statusCode'] == 201
    parsed_body = json.loads(response['body'])
    assert 'recipe' in parsed_body
    assert 'id' in parsed_body['recipe']
    assert parsed_body['recipe']['id'] == '123'
