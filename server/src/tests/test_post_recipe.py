import json

from app.constants import DecimalEncoder
from app.post_event_handler import handle_event

test_recipe_data = {
    'title': 'Test Recipe',
    'description': 'This is a test recipe',
    'tags': ['test', 'recipe'],
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
        'body': json.dumps(test_recipe_data, cls=DecimalEncoder),
        'headers': {
            'Content-Type': 'application/json'
        },
        'requestContext': {
            'authorizer': {
                'claims': {
                    'cognito:username': 'test_user'
                }
            }
        }
    }
    response = handle_event(test_create_recipe_request, None)
    assert response['statusCode'] == 201
    parsed_body = json.loads(response['body'])
    assert 'recipe' in parsed_body
    assert 'id' in parsed_body['recipe']
    assert 'tags' in parsed_body['recipe']
    assert parsed_body['recipe']['tags'] == ['test', 'recipe']


def test_put_invalid_recipe(mock_recipes_table, mock_recipe_bucket):
    test_create_recipe_request = {
        'httpMethod': 'POST',
        'path': '/recipe',
        'body': json.dumps({'invalid': 'data'}, cls=DecimalEncoder),
        'headers': {
            'Content-Type': 'application/json'
        },
        'requestContext': {
            'authorizer': {
                'claims': {
                    'cognito:username': 'test_user'
                }
            }
        }
    }
    response = handle_event(test_create_recipe_request, None)
    assert response['statusCode'] == 400


def test_update_recipe(mock_recipes_table, mock_recipe_bucket):
    test_recipe_with_id = {**test_recipe_data, **{'id': '123', 'username': 'test_user'}}
    mock_recipes_table.put_item(Item=test_recipe_with_id)

    updated_recipe = {**test_recipe_with_id, **{'title': 'Updated Test Recipe'}}

    test_update_recipe_request = {
        'httpMethod': 'POST',
        'path': '/recipe',
        'body': json.dumps(updated_recipe, cls=DecimalEncoder),
        'headers': {
            'Content-Type': 'application/json'
        },
        'requestContext': {
            'authorizer': {
                'claims': {
                    'cognito:username': 'test_user'
                }
            }
        }
    }

    response = handle_event(test_update_recipe_request, None)
    assert response['statusCode'] == 201
    parsed_body = json.loads(response['body'])
    assert 'recipe' in parsed_body
    assert 'id' in parsed_body['recipe']
    assert parsed_body['recipe']['id'] == '123'
    assert parsed_body['recipe']['title'] == 'Updated Test Recipe'

def test_update_recipe_with_invalid_data(mock_recipes_table, mock_recipe_bucket):
    test_recipe_with_id = {**test_recipe_data, **{'id': '123', 'username': 'test_user'}}
    mock_recipes_table.put_item(Item=test_recipe_with_id)

    test_recipe_with_id.pop('title', None)  # Remove title to simulate invalid data

    test_create_recipe_request = {
        'httpMethod': 'POST',
        'path': '/recipe',
        'body': json.dumps(test_recipe_with_id, cls=DecimalEncoder),
        'headers': {
            'Content-Type': 'application/json'
        },
        'requestContext': {
            'authorizer': {
                'claims': {
                    'cognito:username': 'test_user'
                }
            }
        }
    }

    response = handle_event(test_create_recipe_request, None)
    assert response['statusCode'] == 400


def test_put_recipe_no_auth(mock_recipes_table, mock_recipe_bucket):
    test_create_recipe_request = {
        'httpMethod': 'POST',
        'path': '/recipe',
        'body': json.dumps(test_recipe_data, cls=DecimalEncoder),
        'headers': {
            'Content-Type': 'application/json'
        },
        'requestContext': {
            'authorizer': {}
        }
    }
    response = handle_event(test_create_recipe_request, None)
    assert response['statusCode'] == 400

def test_put_recipe_no_permission_to_update(mock_recipes_table, mock_recipe_bucket):
    test_recipe_with_id = {**test_recipe_data, **{'id': '123', 'username': 'test_user'}}
    mock_recipes_table.put_item(Item=test_recipe_with_id)


    test_create_recipe_request = {
        'httpMethod': 'POST',
        'path': '/recipe',
        'body': json.dumps(test_recipe_with_id, cls=DecimalEncoder),
        'headers': {
            'Content-Type': 'application/json'
        },
        'requestContext': {
            'authorizer': {
                'claims': {
                    'cognito:username': 'unauthorized_user'
                }
            }
        }
    }
    response = handle_event(test_create_recipe_request, None)
    assert response['statusCode'] == 400
