from datetime import datetime

import pytest
from pydantic import ValidationError

from app.schemas.ingredient import IngredientSchema
from app.schemas.instruction import InstructionSchema
from app.schemas.recipe import RecipeDetail
from app.schemas.recipe_permission import RecipePermissionDetail, GrantPermissionRequest, PermissionRole
from app.schemas.user import UserSchema


class TestConsolidatedUserSchema:
    """Test the consolidated UserSchema for different use cases."""
    
    def test_user_create_scenario(self):
        """Test UserSchema used for user creation."""
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "securepassword123"
        }
        user = UserSchema(**user_data)
        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert user.password == "securepassword123"
        assert user.id is None  # Not set for creation
    
    def test_user_response_scenario(self):
        """Test UserSchema used for API responses."""
        user_data = {
            "id": "U123456789",
            "username": "testuser",
            "email": "test@example.com",
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        user = UserSchema(**user_data)
        assert user.id == "U123456789"
        assert user.username == "testuser"
        assert user.password is None  # Not included in response
    
    def test_user_update_scenario(self):
        """Test UserSchema used for updates (partial data)."""
        user_data = {"username": "newusername"}
        user = UserSchema(**user_data)
        assert user.username == "newusername"
        assert user.email is None
        assert user.password is None
    
    def test_user_validation_errors(self):
        """Test validation errors in UserSchema."""
        # Username too short
        with pytest.raises(ValidationError):
            UserSchema(username="ab", email="test@example.com")
        
        # Password too short
        with pytest.raises(ValidationError):
            UserSchema(username="testuser", password="short")


class TestConsolidatedRecipeSchema:
    """Test the consolidated RecipeSchema for different use cases."""
    
    def test_recipe_create_scenario(self):
        """Test RecipeSchema used for recipe creation."""
        recipe_data = {
            "title": "Test Recipe",
            "description": "<p>A delicious test recipe.</p>",
            "tags": ["test", "easy"],
            "cooking_time": 30,
            "serving_size": 4,
            "ingredients": [
                {
                    "name": "Test Ingredient",
                    "quantity": 1.0,
                    "unit": "cup",
                    "order_index": 0
                }
            ],
            "instructions": [
                {
                    "title": "Step 1",
                    "description": "<p>Mix ingredients.</p>",
                    "step_number": 1
                }
            ]
        }
        recipe = RecipeDetail(**recipe_data)
        assert recipe.title == "Test Recipe"
        assert len(recipe.ingredients) == 1
        assert len(recipe.instructions) == 1
        assert recipe.id is None  # Not set for creation
    
    def test_recipe_response_scenario(self):
        """Test RecipeSchema used for API responses."""
        recipe_data = {
            "id": "R123456789",
            "title": "Test Recipe",
            "description": "<p>A delicious test recipe.</p>",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "tags": [],
            "instructions": [],
            "ingredients": []
        }
        recipe = RecipeDetail(**recipe_data)
        assert recipe.id == "R123456789"
        assert recipe.title == "Test Recipe"
        assert recipe.description == "<p>A delicious test recipe.</p>"
        assert recipe.created_at is not None
        assert recipe.updated_at is not None
        assert recipe.tags == []
        assert recipe.instructions == []
    
    def test_recipe_update_scenario(self):
        """Test RecipeSchema used for updates (partial data)."""
        recipe_data = {
            "title": "Updated Recipe Title",
            "cooking_time": 45
        }
        recipe = RecipeDetail(**recipe_data)
        assert recipe.title == "Updated Recipe Title"
        assert recipe.cooking_time == 45
        assert recipe.description is None
    
    def test_recipe_html_validation(self):
        """Test HTML validation in recipe description."""
        # Valid HTML
        recipe_data = {
            "title": "Test Recipe",
            "description": "<p>Valid <strong>HTML</strong> content.</p>"
        }
        recipe = RecipeDetail(**recipe_data)
        assert recipe.description == "<p>Valid <strong>HTML</strong> content.</p>"
        
        # Invalid HTML tag
        with pytest.raises(ValidationError):
            RecipeDetail(
                title="Test Recipe",
                description="<script>alert('xss')</script>"
            )


class TestConsolidatedIngredientSchema:
    """Test the consolidated IngredientSchema for different use cases."""
    
    def test_ingredient_create_scenario(self):
        """Test IngredientSchema used for ingredient creation."""
        ingredient_data = {
            "name": "Flour",
            "quantity": 2.0,
            "unit": "cups",
            "subtext": "All-purpose flour",
            "order_index": 0,
            "recipe_id": "R123456789"
        }
        ingredient = IngredientSchema(**ingredient_data)
        assert ingredient.name == "Flour"
        assert ingredient.quantity == 2.0
        assert ingredient.recipe_id == "R123456789"
        assert ingredient.id is None  # Not set for creation
    
    def test_ingredient_response_scenario(self):
        """Test IngredientSchema used for API responses."""
        ingredient_data = {
            "id": "ING123456789",
            "name": "Flour",
            "quantity": 2.0,
            "unit": "cups",
            "order_index": 0,
            "recipe_id": "R123456789"
        }
        ingredient = IngredientSchema(**ingredient_data)
        assert ingredient.id == "ING123456789"
        assert ingredient.name == "Flour"
    
    def test_ingredient_validation_errors(self):
        """Test validation errors in IngredientSchema."""
        # Negative quantity
        with pytest.raises(ValidationError):
            IngredientSchema(
                name="Flour",
                quantity=-1.0,
                unit="cups",
                order_index=0
            )
        
        # Negative order_index
        with pytest.raises(ValidationError):
            IngredientSchema(
                name="Flour",
                quantity=2.0,
                unit="cups",
                order_index=-1
            )


class TestConsolidatedInstructionSchema:
    """Test the consolidated InstructionSchema for different use cases."""
    
    def test_instruction_create_scenario(self):
        """Test InstructionSchema used for instruction creation."""
        instruction_data = {
            "title": "Mix Ingredients",
            "description": "<p>Combine all dry ingredients in a bowl.</p>",
            "step_number": 1,
            "timing": 5,
            "recipe_id": "R123456789"
        }
        instruction = InstructionSchema(**instruction_data)
        assert instruction.title == "Mix Ingredients"
        assert instruction.step_number == 1
        assert instruction.recipe_id == "R123456789"
        assert instruction.id is None  # Not set for creation
    
    def test_instruction_response_scenario(self):
        """Test InstructionSchema used for API responses."""
        instruction_data = {
            "id": "INS123456789",
            "title": "Mix Ingredients",
            "description": "<p>Combine all dry ingredients in a bowl.</p>",
            "step_number": 1,
            "recipe_id": "R123456789"
        }
        instruction = InstructionSchema(**instruction_data)
        assert instruction.id == "INS123456789"
        assert instruction.title == "Mix Ingredients"
    
    def test_instruction_html_validation(self):
        """Test HTML validation in instruction description."""
        # Valid HTML
        instruction_data = {
            "title": "Test Step",
            "description": "<p>Valid <strong>HTML</strong> content.</p>",
            "step_number": 1
        }
        instruction = InstructionSchema(**instruction_data)
        assert instruction.description == "<p>Valid <strong>HTML</strong> content.</p>"
        
        # Invalid HTML tag
        with pytest.raises(ValidationError):
            InstructionSchema(
                title="Test Step",
                description="<script>alert('xss')</script>",
                step_number=1
            )


class TestConsolidatedRecipePermissionSchema:
    """Test the consolidated RecipePermissionSchema for different use cases."""
    
    def test_permission_create_scenario(self):
        """Test RecipePermissionSchema used for permission creation."""
        permission_data = {
            "user_id": "U123456789",
            "recipe_id": "R123456789",
            "role": PermissionRole.EDITOR
        }
        permission = RecipePermissionDetail(**permission_data)
        assert permission.user_id == "U123456789"
        assert permission.recipe_id == "R123456789"
        assert permission.role == PermissionRole.EDITOR
        assert permission.id is None  # Not set for creation
    
    def test_permission_response_scenario(self):
        """Test RecipePermissionSchema used for API responses."""
        permission_data = {
            "id": "RP123456789",
            "user_id": "U123456789",
            "recipe_id": "R123456789",
            "role": PermissionRole.OWNER,
            "granted_at": datetime.now()
        }
        permission = RecipePermissionDetail(**permission_data)
        assert permission.id == "RP123456789"
        assert permission.role == PermissionRole.OWNER
    
    def test_permission_with_user_details(self):
        """Test RecipePermissionSchema with extended user details."""
        permission_data = {
            "id": "RP123456789",
            "user_id": "U123456789",
            "recipe_id": "R123456789",
            "role": PermissionRole.EDITOR,
            "granted_at": datetime.now(),
            "user_username": "testuser",
            "user_email": "test@example.com"
        }
        permission = RecipePermissionDetail(**permission_data)
        assert permission.user_username == "testuser"
        assert permission.user_email == "test@example.com"


class TestGrantPermissionRequest:
    """Test the GrantPermissionRequest schema."""

    def test_grant_permission_request(self):
        """Test GrantPermissionRequest validation."""
        request_data = {
            "username": "testuser",
            "role": PermissionRole.EDITOR
        }
        request = GrantPermissionRequest(**request_data)
        assert request.username == "testuser"
        assert request.role == PermissionRole.EDITOR

    def test_grant_permission_request_default_role(self):
        """Test GrantPermissionRequest with default role."""
        request_data = {"username": "testuser"}
        request = GrantPermissionRequest(**request_data)
        assert request.role == PermissionRole.EDITOR  # Default value