"""
Integration tests for granular recipe updates and sub-resource controllers.
"""

import pytest
from fastapi.testclient import TestClient

from app.models.recipe import Recipe


@pytest.mark.integration
class TestGranularRecipeUpdates:
    """Test suite for granular PATCH and sub-resource API endpoints."""

    def test_patch_recipe_metadata_only(
        self, client: TestClient, auth_headers: dict, test_recipe_with_details: Recipe
    ):
        """Test partial metadata update does not overwrite nested ingredients or instructions."""
        recipe_id = test_recipe_with_details.id
        orig_ingredients_count = len(test_recipe_with_details.ingredients)
        orig_instructions_count = len(test_recipe_with_details.instructions)

        patch_payload = {
            "title": "Partially Updated Recipe Title",
            "cooking_time": 60,
        }

        response = client.patch(
            f"/api/v1/recipes/{recipe_id}/",
            json=patch_payload,
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Partially Updated Recipe Title"
        assert data["cooking_time"] == 60
        assert data["serving_size"] == test_recipe_with_details.serving_size
        # Verify ingredients and instructions remained intact
        assert len(data["ingredients"]) == orig_ingredients_count
        assert len(data["instructions"]) == orig_instructions_count

    def test_patch_recipe_unauthorized_and_forbidden(
        self,
        client: TestClient,
        auth_headers_user2: dict,
        test_recipe: Recipe,
    ):
        """Test unauthorized and forbidden access to PATCH recipe."""
        recipe_id = test_recipe.id

        # No auth
        response = client.patch(
            f"/api/v1/recipes/{recipe_id}/",
            json={"title": "Hacked Title"},
        )
        assert response.status_code == 401

        # Non-owner user without permission
        response = client.patch(
            f"/api/v1/recipes/{recipe_id}/",
            json={"title": "Hacked Title"},
            headers=auth_headers_user2,
        )
        assert response.status_code in (403, 404)

    def test_instruction_lifecycle(
        self, client: TestClient, auth_headers: dict, test_recipe: Recipe
    ):
        """Test adding, updating (by ID & step), and deleting instructions."""
        recipe_id = test_recipe.id

        # 1. Add step 1
        step1_payload = {
            "title": "First Step",
            "description": "<p>Do the first thing.</p>",
            "timing": 5,
        }
        res1 = client.post(
            f"/api/v1/recipes/{recipe_id}/instructions/",
            json=step1_payload,
            headers=auth_headers,
        )
        assert res1.status_code == 201
        step1_data = res1.json()
        assert step1_data["title"] == "First Step"
        assert step1_data["step_number"] == 1
        step1_id = step1_data["id"]

        # 2. Add step 2
        step2_payload = {
            "title": "Second Step",
            "description": "<p>Do the second thing.</p>",
            "timing": 10,
        }
        res2 = client.post(
            f"/api/v1/recipes/{recipe_id}/instructions/",
            json=step2_payload,
            headers=auth_headers,
        )
        assert res2.status_code == 201
        step2_data = res2.json()
        assert step2_data["step_number"] == 2
        step2_id = step2_data["id"]

        # 3. Patch step 1 by instruction ID
        patch_res = client.patch(
            f"/api/v1/recipes/{recipe_id}/instructions/{step1_id}/",
            json={"timing": 12},
            headers=auth_headers,
        )
        assert patch_res.status_code == 200
        assert patch_res.json()["timing"] == 12
        assert patch_res.json()["title"] == "First Step"

        # 4. Patch step 2 by step number "2"
        patch_by_num_res = client.patch(
            f"/api/v1/recipes/{recipe_id}/instructions/2/",
            json={"title": "Updated Step 2 Title"},
            headers=auth_headers,
        )
        assert patch_by_num_res.status_code == 200
        assert patch_by_num_res.json()["title"] == "Updated Step 2 Title"

        # 5. Delete step 1 by ID
        del_res = client.delete(
            f"/api/v1/recipes/{recipe_id}/instructions/{step1_id}/",
            headers=auth_headers,
        )
        assert del_res.status_code == 204

        # 6. Verify recipe now has 1 instruction re-sequenced to step 1
        recipe_res = client.get(f"/api/v1/recipes/{recipe_id}/")
        assert recipe_res.status_code == 200
        recipe_data = recipe_res.json()
        assert len(recipe_data["instructions"]) == 1
        assert recipe_data["instructions"][0]["id"] == step2_id
        assert recipe_data["instructions"][0]["step_number"] == 1

    def test_ingredient_lifecycle(
        self, client: TestClient, auth_headers: dict, test_recipe: Recipe
    ):
        """Test adding, updating (by ID & index), and deleting ingredients."""
        recipe_id = test_recipe.id

        # 1. Add ingredient 1
        ing1_payload = {
            "name": "Olive Oil",
            "quantity": 2.0,
            "unit": "tbsp",
            "subtext": "extra virgin",
        }
        res1 = client.post(
            f"/api/v1/recipes/{recipe_id}/ingredients/",
            json=ing1_payload,
            headers=auth_headers,
        )
        assert res1.status_code == 201
        ing1_data = res1.json()
        assert ing1_data["name"] == "Olive Oil"
        assert ing1_data["order_index"] == 0
        ing1_id = ing1_data["id"]

        # 2. Add ingredient 2
        ing2_payload = {
            "name": "Garlic",
            "quantity": 3.0,
            "unit": "cloves",
            "subtext": "minced",
        }
        res2 = client.post(
            f"/api/v1/recipes/{recipe_id}/ingredients/",
            json=ing2_payload,
            headers=auth_headers,
        )
        assert res2.status_code == 201
        ing2_data = res2.json()
        assert ing2_data["order_index"] == 1
        ing2_id = ing2_data["id"]

        # 3. Patch ingredient 1 by ID
        patch_res = client.patch(
            f"/api/v1/recipes/{recipe_id}/ingredients/{ing1_id}/",
            json={"quantity": 3.0},
            headers=auth_headers,
        )
        assert patch_res.status_code == 200
        assert patch_res.json()["quantity"] == 3.0
        assert patch_res.json()["name"] == "Olive Oil"

        # 4. Patch ingredient 2 by order index
        patch_by_idx_res = client.patch(
            f"/api/v1/recipes/{recipe_id}/ingredients/1/",
            json={"subtext": "finely minced"},
            headers=auth_headers,
        )
        assert patch_by_idx_res.status_code == 200
        assert patch_by_idx_res.json()["subtext"] == "finely minced"

        # 5. Delete ingredient 1 by ID
        del_res = client.delete(
            f"/api/v1/recipes/{recipe_id}/ingredients/{ing1_id}/",
            headers=auth_headers,
        )
        assert del_res.status_code == 204

        # 6. Verify recipe now has 1 ingredient re-indexed to 0
        recipe_res = client.get(f"/api/v1/recipes/{recipe_id}/")
        assert recipe_res.status_code == 200
        recipe_data = recipe_res.json()
        assert len(recipe_data["ingredients"]) == 1
        assert recipe_data["ingredients"][0]["id"] == ing2_id
        assert recipe_data["ingredients"][0]["order_index"] == 0
