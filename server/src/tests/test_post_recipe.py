import json

from app.constants import DecimalEncoder
from app.post_event_handler import handle_event
import botocore
import pytest

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
            'title': 'Step 1',
            'description': 'This is step 1'
        }
    ]
}


def test_put_new_recipe(mock_recipes_table, mock_recipe_bucket):
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


def test_put_invalid_recipe(mock_recipes_table, mock_recipe_bucket):
    test_create_recipe_request = {
        'httpMethod': 'POST',
        'path': '/recipe',
        'body': json.dumps({'invalid': 'data'}, cls=DecimalEncoder)
    }
    response = handle_event(test_create_recipe_request, None)
    assert response['statusCode'] == 400


def test_update_recipe(mock_recipes_table, mock_recipe_bucket):
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
