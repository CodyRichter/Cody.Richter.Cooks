from app.data.model.Recipe import Recipe
from app.delete_event_handler import handle_event
import botocore
import pytest

test_recipe = Recipe(
    id='123',
    title='Test Recipe',
    description='This is a test recipe',
    ingredients=[
        {
            'id': '1',
            'name': 'Test Ingredient',
            'quantity': '1',
            'unit': 'cup',
            'subtext': 'Optional subtext'
        }
    ],
    instructions=[
        {
            'id': '1',
            'title': 'Step 1',
            'description': 'This is step 1'
        }
    ],
    tags=[],
    username='test_user',
)
test_recipe_data = test_recipe.model_dump()
authorized_username = 'test_user'

def test_delete_recipe(mock_recipes_table, mock_recipe_bucket):
    mock_recipes_table.put_item(Item=test_recipe_data)
    mock_recipe_bucket.put_object(Key='123', Body='Test Recipe Description')

    # Delete the recipe
    test_delete_recipe_request = {
        'httpMethod': 'DELETE',
        'queryStringParameters': {
            'id': '123',
        },
        'requestContext': {
            'authorizer': {
                'claims': {
                    'cognito:username': authorized_username
                }
            }
        }
    }

    response = handle_event(test_delete_recipe_request, None)
    assert response['statusCode'] == 200

    # Verify the recipe is deleted from DDB and S3
    response = mock_recipes_table.get_item(Key={'id': '123'})
    assert 'Item' not in response
    with pytest.raises(botocore.exceptions.ClientError):
        mock_recipe_bucket.Object('123').get()

def test_delete_recipe_not_found(mock_recipes_table, mock_recipe_bucket):
    # Delete is idempotent, so deleting a non-existent recipe should not raise an error
    test_delete_recipe_request = {
        'httpMethod': 'DELETE',
        'queryStringParameters': {
            'id': 'non_existent_id',
        },
        'requestContext': {
            'authorizer': {
                'claims': {
                    'cognito:username': authorized_username
                }
            }
        }
    }

    response = handle_event(test_delete_recipe_request, None)
    assert response['statusCode'] == 200

def test_delete_user_not_authorized(mock_recipes_table, mock_recipe_bucket):
    # Attempt to delete a recipe with an unauthorized user
    mock_recipes_table.put_item(Item=test_recipe_data)
    mock_recipe_bucket.put_object(Key='123', Body='Test Recipe Description')
    
    test_delete_recipe_request = {
        'httpMethod': 'DELETE',
        'queryStringParameters': {
            'id': '123',
        },
        'requestContext': {
            'authorizer': {
                'claims': {
                    'cognito:username': 'unauthorized_user'
                }
            }
        }
    }

    response = handle_event(test_delete_recipe_request, None)
    assert response['statusCode'] == 400
    assert "unauthorized" in response['body'].lower()