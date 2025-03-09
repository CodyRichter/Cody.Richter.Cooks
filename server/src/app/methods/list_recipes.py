from typing import Optional
from app.constants import table as ddb_recipe_table, RECIPES_PER_PAGE
from app.data.communication.ListRecipeModels import ListRecipeResponse, ListRecipeRequest
from app.utilities.core_utils import is_defined


def list_recipes(request: ListRecipeRequest) -> ListRecipeResponse:
    """
    List all recipes from the database, to be displayed on the sidebar. This method will only
    return the recipe ID and title. If a pagination key is provided, it will return the next set of recipes,
    otherwise it will return the first set of recipes.
    """
    return list_recipes_internal(ddb_recipe_table, request.pagination_key)


def list_recipes_internal(table, pagination_key: Optional[str]) -> ListRecipeResponse:
    scan_params = {
        'ProjectionExpression': 'id,title',
        'Limit': RECIPES_PER_PAGE
    }

    if pagination_key:
        scan_params['ExclusiveStartKey'] = {'id': pagination_key}

    response = table.scan(**scan_params)

    if not is_defined(response, ['Items']):
        return ListRecipeResponse(recipes=[], pagination_key=None)

    return ListRecipeResponse(
        recipes=response['Items'],
        pagination_key=response['LastEvaluatedKey']['id'] if is_defined(response, ['LastEvaluatedKey', 'id']) else None
    )
