import json
from decimal import Decimal

from app.constants import RECIPES_PER_PAGE
from app.get_event_handler import handle_event
from app.data.model.Recipe import Recipe

test_recipe = Recipe(
    id='1',
    title='Test Recipe',
    description='TestS3Key',
    ingredients=[
        {
            'id': '1',
            'name': 'Test Ingredient',
            'quantity': Decimal(1.0),
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
    tags=['test', 'recipe'],
    username='test_user',
)
test_recipe_data = test_recipe.model_dump()
test_recipe_description = 'This is a test recipe'

# When no recipe ID is provided, a list of all recipe name and IDs should be returned
def test_list_all_recipes_simple(mock_recipes_table):
    mock_recipes_table.put_item(Item=test_recipe_data)
    response = handle_event({'httpMethod': 'GET'}, {})

    assert response['statusCode'] == 200
    body = json.loads(response['body'])
    assert 'recipes' in body
    assert len(body['recipes']) == 1
    assert body['recipes'][0]['id'] == '1'
    assert body['recipes'][0]['title'] == 'Test Recipe'


def test_list_all_recipes_pagination(mock_recipes_table):
    for i in range(1, 26):
        recipe_item = {
            'id': str(i),
            'title': f'Test Recipe {i}',
            'description': f'Placeholder description for recipe {i}',
            'ingredients': [],
            'instructions': []
        }
        mock_recipes_table.put_item(Item=recipe_item)

    response = handle_event({'httpMethod': 'GET'}, {})
    assert response['statusCode'] == 200

    body = json.loads(response['body'])

    assert 'recipes' in body
    assert len(body['recipes']) == RECIPES_PER_PAGE
    assert 'pagination_key' in body

    pagination_key = body['pagination_key']

    second_page_response = handle_event({
        'httpMethod': 'GET',
        'queryStringParameters': {'pagination_key': pagination_key}}, {}
    )

    assert second_page_response['statusCode'] == 200
    second_page_body = json.loads(second_page_response['body'])
    assert 'recipes' in second_page_body
    assert len(second_page_body['recipes']) == 10


def test_list_all_recipes_pagination_bad_key(mock_recipes_table):
    response = handle_event({
        'httpMethod': 'GET',
        'queryStringParameters': {'pagination_key': 'ThisIsNotAValidKey'}}, {}
    )

    assert response['statusCode'] == 200
    body = json.loads(response['body'])
    assert 'recipes' in body
    assert len(body['recipes']) == 0
    assert body['pagination_key'] is None


def test_list_all_recipes_no_recipes_found(mock_recipes_table):
    response = handle_event({'httpMethod': 'GET'}, {})

    assert response['statusCode'] == 200
    body = json.loads(response['body'])
    assert 'recipes' in body
    assert len(body['recipes']) == 0
    assert type(body['recipes']) == list


# When a recipe ID is provided, the recipe data should be returned
def test_get_recipe(mock_recipes_table, mock_recipe_bucket):
    mock_recipes_table.put_item(Item=test_recipe_data)
    mock_recipe_bucket.put_object(Key=test_recipe.id, Body=test_recipe_description)

    response = handle_event({'httpMethod': 'GET', 'queryStringParameters': {'id': '1'}}, {})

    assert response['statusCode'] == 200
    body = json.loads(response['body'])
    assert 'recipe' in body
    assert body['recipe']['id'] == '1'
    assert body['recipe']['title'] == 'Test Recipe'
    assert body['recipe']['description'] == test_recipe_description
    assert body['recipe']['ingredients'] == test_recipe_data['ingredients']
    assert body['recipe']['instructions'] == test_recipe_data['instructions']
    assert body['recipe']['tags'] == test_recipe_data['tags']
    assert body['recipe']['username'] == test_recipe_data['username']


# When an invalid recipe ID is provided, a 404 response should be returned
def test_get_invalid_recipe(mock_recipes_table):
    mock_recipes_table.put_item(Item=test_recipe_data)
    response = handle_event({'httpMethod': 'GET', 'queryStringParameters': {'id': '2'}}, {})

    assert response['statusCode'] == 404
    body = json.loads(response['body'])
    assert body['detail'] == 'Recipe not found with ID: 2'
