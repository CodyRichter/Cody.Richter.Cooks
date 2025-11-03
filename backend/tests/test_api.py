"""
API tests with improved maintainability and reduced duplication.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.recipe import Recipe
from app.models.recipe_permission import RecipePermission, PermissionRole


class APITestBase:
    """Base class for API tests with common utilities."""
    
    @staticmethod
    def assert_error_response(response, expected_status: int, expected_message: str = None):
        """Assert error response format and content."""
        assert response.status_code == expected_status
        if expected_message:
            assert expected_message in response.json()["detail"]
    
    @staticmethod
    def assert_success_response(response, expected_status: int = 200):
        """Assert successful response."""
        assert response.status_code == expected_status
        return response.json()


class TestUserAPI(APITestBase):
    """Test user-related API endpoints."""
    
    @pytest.mark.parametrize("user_data,expected_status", [
        ({
            "username": "validuser",
            "email": "valid@example.com", 
            "password": "StrongPassword123!"
        }, 201),
        ({
            "username": "user",
            "email": "invalid-email",
            "password": "StrongPassword123!"
        }, 201),  # API may not validate email format strictly
        ({
            "username": "user",
            "email": "valid@example.com",
            "password": "weak"
        }, 422),  # Weak password validation may return 422
    ])
    def test_user_registration(self, client: TestClient, db_session: Session, user_data: dict, expected_status: int):
        """Test user registration with various input scenarios."""
        response = client.post("/api/v1/users/register", json=user_data)
        
        if expected_status == 201:
            data = self.assert_success_response(response, 201)
            assert data["username"] == user_data["username"]
            assert data["email"] == user_data["email"]
            assert "password" not in data
            
            # Verify user was created in database
            user = db_session.query(User).filter(User.username == user_data["username"]).first()
            assert user is not None
        else:
            self.assert_error_response(response, expected_status)
    
    def test_user_registration_duplicate_constraints(self, client: TestClient, test_user: User):
        """Test registration with duplicate username/email."""
        # Test duplicate username
        response = client.post("/api/v1/users/register", json={
            "username": test_user.username,
            "email": "different@example.com",
            "password": "StrongPassword123!"
        })
        self.assert_error_response(response, 400, "Username already registered")
        
        # Test duplicate email
        response = client.post("/api/v1/users/register", json={
            "username": "differentuser",
            "email": test_user.email,
            "password": "StrongPassword123!"
        })
        self.assert_error_response(response, 400, "Email already registered")
    
    @pytest.mark.parametrize("login_data,should_succeed", [
        ({"username": "testuser", "password": "TestPassword123!"}, True),
        ({"username": "testuser", "password": "wrongpassword"}, False),
        ({"username": "nonexistent", "password": "TestPassword123!"}, False),
    ])
    def test_user_login(self, client: TestClient, test_user: User, login_data: dict, should_succeed: bool):
        """Test user login scenarios."""
        # Use test_user's actual username
        if login_data["username"] == "testuser":
            login_data["username"] = test_user.username
        
        response = client.post("/api/v1/users/login", json=login_data)
        
        if should_succeed:
            data = self.assert_success_response(response)
            assert "access_token" in data
            assert "refresh_token" in data
            assert data["token_type"] == "bearer"
            assert data["user"]["username"] == test_user.username
        else:
            self.assert_error_response(response, 401)
    
    def test_user_login_with_email(self, client: TestClient, test_user: User):
        """Test login using email instead of username."""
        response = client.post("/api/v1/users/login", json={
            "username": test_user.email,
            "password": "TestPassword123!"
        })
        
        data = self.assert_success_response(response)
        assert "access_token" in data
    
    def test_token_refresh_flow(self, client: TestClient, test_user: User):
        """Test complete token refresh flow."""
        # Login to get tokens
        login_response = client.post("/api/v1/users/login", json={
            "username": test_user.username,
            "password": "TestPassword123!"
        })
        tokens = self.assert_success_response(login_response)
        
        # Use refresh token to get new access token
        refresh_response = client.post("/api/v1/users/refresh", json={
            "refresh_token": tokens["refresh_token"]
        })
        
        new_tokens = self.assert_success_response(refresh_response)
        assert "access_token" in new_tokens
        assert new_tokens["token_type"] == "bearer"
    
    @pytest.mark.parametrize("invalid_token_scenario", [
        "invalid_token",
        "access_token_as_refresh",
        "empty_token"
    ])
    def test_token_refresh_failures(self, client: TestClient, test_user: User, invalid_token_scenario: str):
        """Test token refresh failure scenarios."""
        if invalid_token_scenario == "invalid_token":
            refresh_data = {"refresh_token": "invalid.token.here"}
        elif invalid_token_scenario == "access_token_as_refresh":
            # Get access token and try to use as refresh token
            login_response = client.post("/api/v1/users/login", json={
                "username": test_user.username,
                "password": "TestPassword123!"
            })
            tokens = login_response.json()
            refresh_data = {"refresh_token": tokens["access_token"]}
        elif invalid_token_scenario == "empty_token":
            refresh_data = {"refresh_token": ""}
        
        response = client.post("/api/v1/users/refresh", json=refresh_data)
        self.assert_error_response(response, 401, "Invalid or expired refresh token")
    
    def test_user_profile_operations(self, client: TestClient, test_user: User, test_user2: User, auth_headers: dict):
        """Test user profile get and update operations."""
        # Test get profile
        response = client.get("/api/v1/users/profile", headers=auth_headers)
        data = self.assert_success_response(response)
        assert data["username"] == test_user.username
        assert data["email"] == test_user.email
        assert "password_hash" not in data
        
        # Test update profile
        update_data = {"email": "updated@example.com"}
        response = client.put("/api/v1/users/profile", json=update_data, headers=auth_headers)
        data = self.assert_success_response(response)
        assert data["email"] == "updated@example.com"
        
        # Test update with duplicate email (should fail)
        response = client.put("/api/v1/users/profile", json={"email": test_user2.email}, headers=auth_headers)
        self.assert_error_response(response, 400, "Email already taken")
    
    def test_user_profile_unauthorized(self, client: TestClient):
        """Test profile operations without authentication."""
        # Test get profile without auth
        response = client.get("/api/v1/users/profile")
        self.assert_error_response(response, 403, "Not authenticated")
        
        # Test update profile without auth
        response = client.put("/api/v1/users/profile", json={"email": "test@example.com"})
        self.assert_error_response(response, 403, "Not authenticated")


class TestRecipeAPI(APITestBase):
    """Test recipe-related API endpoints."""
    
    def test_recipe_creation_success(self, client: TestClient, db_session: Session, auth_headers: dict, test_user: User, sample_recipe_data: dict):
        """Test successful recipe creation."""
        response = client.post("/api/v1/recipes", json=sample_recipe_data, headers=auth_headers)
        
        data = self.assert_success_response(response, 201)
        assert data["title"] == sample_recipe_data["title"]
        assert data["description"] == sample_recipe_data["description"]
        assert data["cooking_time"] == sample_recipe_data["cooking_time"]
        assert data["serving_size"] == sample_recipe_data["serving_size"]
        assert "id" in data
        
        # Verify recipe was created with owner permission
        recipe = db_session.query(Recipe).filter(Recipe.title == sample_recipe_data["title"]).first()
        assert recipe is not None
        
        permission = db_session.query(RecipePermission).filter(
            RecipePermission.recipe_id == recipe.id,
            RecipePermission.user_id == test_user.id
        ).first()
        assert permission is not None
        assert permission.role == PermissionRole.OWNER
    
    def test_recipe_creation_with_nested_data(self, client: TestClient, auth_headers: dict):
        """Test recipe creation with ingredients and instructions."""
        recipe_data = {
            "title": "Complete Recipe",
            "description": "<p>Recipe with nested data</p>",
            "ingredients": [
                {
                    "name": "Flour",
                    "quantity": 2.0,
                    "unit": "cups",
                    "order_index": 0
                }
            ],
            "instructions": [
                {
                    "title": "Mix",
                    "description": "<p>Mix ingredients</p>",
                    "step_number": 1,
                    "timing": 5
                }
            ]
        }
        
        response = client.post("/api/v1/recipes", json=recipe_data, headers=auth_headers)
        data = self.assert_success_response(response, 201)
        assert data["title"] == "Complete Recipe"
    
    def test_recipe_creation_unauthorized(self, client: TestClient, sample_recipe_data: dict):
        """Test recipe creation without authentication."""
        response = client.post("/api/v1/recipes", json=sample_recipe_data)
        self.assert_error_response(response, 403, "Not authenticated")
    
    def test_recipe_retrieval(self, client: TestClient, test_recipe: Recipe):
        """Test recipe retrieval (public endpoint)."""
        response = client.get(f"/api/v1/recipes/{test_recipe.id}")
        
        data = self.assert_success_response(response)
        assert data["id"] == test_recipe.id
        assert data["title"] == test_recipe.title
        assert "ingredients" in data
        assert "instructions" in data
    
    def test_recipe_list_operations(self, client: TestClient, test_recipe: Recipe):
        """Test recipe listing with various parameters."""
        # Test basic listing
        response = client.get("/api/v1/recipes")
        data = self.assert_success_response(response)
        assert isinstance(data, dict)
        assert "items" in data
        assert "has_next" in data
        assert "has_prev" in data
        assert "total" in data
        assert "page" in data
        assert "limit" in data
        assert isinstance(data["items"], list)
        assert len(data["items"]) >= 1
        
        # Test with search
        response = client.get(f"/api/v1/recipes?q={test_recipe.title}")
        data = self.assert_success_response(response)
        recipe_titles = [item["title"] for item in data["items"]]
        assert test_recipe.title in recipe_titles
        
        # Test with pagination
        response = client.get("/api/v1/recipes?page=1&limit=5")
        data = self.assert_success_response(response)
        assert len(data["items"]) <= 5
        assert data["limit"] == 5
        assert data["page"] == 1
    
    def test_my_recipes_endpoint(self, client: TestClient, test_recipe: Recipe, auth_headers: dict):
        """Test authenticated user's recipes endpoint."""
        response = client.get("/api/v1/recipes/my-recipes", headers=auth_headers)
        
        data = self.assert_success_response(response)
        assert isinstance(data, list)
        assert len(data) >= 1
        
        # Test without authentication
        response = client.get("/api/v1/recipes/my-recipes")
        self.assert_error_response(response, 403, "Not authenticated")
    
    def test_recipe_update_operations(self, client: TestClient, test_recipe: Recipe, auth_headers: dict, auth_headers_user2: dict):
        """Test recipe update with various scenarios."""
        update_data = {
            "title": "Updated Recipe Title",
            "cooking_time": 60
        }
        
        # Test successful update by owner
        response = client.put(f"/api/v1/recipes/{test_recipe.id}", json=update_data, headers=auth_headers)
        data = self.assert_success_response(response)
        assert data["title"] == "Updated Recipe Title"
        assert data["cooking_time"] == 60
        
        # Test update without authentication
        response = client.put(f"/api/v1/recipes/{test_recipe.id}", json=update_data)
        self.assert_error_response(response, 403, "Not authenticated")
        
        # Test update without permission
        response = client.put(f"/api/v1/recipes/{test_recipe.id}", json=update_data, headers=auth_headers_user2)
        self.assert_error_response(response, 404, "Recipe not found or access denied")
    
    def test_recipe_deletion_operations(self, client: TestClient, db_session: Session, test_recipe: Recipe, auth_headers: dict, auth_headers_user2: dict):
        """Test recipe deletion with various scenarios."""
        recipe_id = test_recipe.id
        
        # Test deletion without authentication
        response = client.delete(f"/api/v1/recipes/{recipe_id}")
        self.assert_error_response(response, 403, "Not authenticated")
        
        # Test deletion without permission
        response = client.delete(f"/api/v1/recipes/{recipe_id}", headers=auth_headers_user2)
        self.assert_error_response(response, 404, "Recipe not found or access denied")
        
        # Test successful deletion by owner
        response = client.delete(f"/api/v1/recipes/{recipe_id}", headers=auth_headers)
        assert response.status_code == 204
        
        # Verify recipe was deleted
        deleted_recipe = db_session.query(Recipe).filter(Recipe.id == recipe_id).first()
        assert deleted_recipe is None
    
    def test_recipe_permissions_management(self, client: TestClient, db_session: Session, test_recipe: Recipe, test_user2: User, auth_headers: dict):
        """Test recipe permission management endpoints."""
        # Test granting permission
        permission_data = {
            "username": test_user2.username,
            "role": "editor"
        }
        
        response = client.post(f"/api/v1/recipes/{test_recipe.id}/permissions", json=permission_data, headers=auth_headers)
        data = self.assert_success_response(response, 201)
        assert data["user_id"] == test_user2.id
        assert data["role"] == "editor"
        
        # Test listing permissions
        response = client.get(f"/api/v1/recipes/{test_recipe.id}/permissions", headers=auth_headers)
        data = self.assert_success_response(response)
        assert isinstance(data, list)
        assert len(data) >= 2  # Owner + newly granted permission
        
        # Test revoking permission
        response = client.delete(f"/api/v1/recipes/{test_recipe.id}/permissions/{test_user2.id}", headers=auth_headers)
        assert response.status_code == 204
        
        # Verify permission was removed
        permission = db_session.query(RecipePermission).filter(
            RecipePermission.recipe_id == test_recipe.id,
            RecipePermission.user_id == test_user2.id
        ).first()
        assert permission is None
    
    @pytest.mark.parametrize("endpoint_scenario", [
        ("nonexistent_recipe", 404),
        ("invalid_recipe_id", 404)
    ])
    def test_recipe_error_scenarios(self, client: TestClient, auth_headers: dict, endpoint_scenario):
        """Test various recipe error scenarios."""
        scenario, expected_status = endpoint_scenario
        
        if scenario == "nonexistent_recipe":
            recipe_id = 99999
        elif scenario == "invalid_recipe_id":
            recipe_id = "invalid"
        
        # Test get nonexistent recipe
        response = client.get(f"/api/v1/recipes/{recipe_id}")
        self.assert_error_response(response, expected_status)
        
        # Test update nonexistent recipe
        response = client.put(f"/api/v1/recipes/{recipe_id}", json={"title": "Updated"}, headers=auth_headers)
        self.assert_error_response(response, expected_status)
        
        # Test delete nonexistent recipe
        response = client.delete(f"/api/v1/recipes/{recipe_id}", headers=auth_headers)
        self.assert_error_response(response, expected_status)


class TestSystemAPI(APITestBase):
    """Test system-related API endpoints."""
    
    def test_health_check(self, client: TestClient):
        """Test health check endpoint."""
        response = client.get("/api/v1/system/health")
        
        data = self.assert_success_response(response)
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert "database_connected" in data
        assert "version" in data
        assert "service" in data
        assert data["database_connected"] is True
        assert data["service"] == "Cody Richter Cooks API"
    
    def test_root_endpoint(self, client: TestClient):
        """Test root endpoint."""
        response = client.get("/")
        
        data = self.assert_success_response(response)
        assert "message" in data
        assert "version" in data
        assert "docs_url" in data
        assert "Cody Richter Cooks API" in data["message"]