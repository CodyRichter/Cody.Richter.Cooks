"""
Unit tests for data models with improved maintainability.
"""
import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.recipe import Recipe
from app.models.recipe_permission import RecipePermission, PermissionRole
from app.models.ingredient import Ingredient
from app.models.instruction import Instruction
from app.utils.password_security import PasswordSecurity


class TestModelValidation:
    """Test model validation and constraints."""
    
    def test_user_creation_valid(self, db_session: Session):
        """Test creating user with valid data."""
        user = User(
            username="testuser",
            email="test@example.com",
            password_hash=PasswordSecurity.hash_password("TestPassword123!")
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        assert user.id is not None
        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert user.created_at is not None
        assert user.updated_at is not None
    
    @pytest.mark.parametrize("field,value1,value2", [
        ("username", "duplicate", "duplicate"),
        ("email", "duplicate@test.com", "duplicate@test.com"),
    ])
    def test_user_unique_constraints(self, db_session: Session, field: str, value1: str, value2: str):
        """Test user unique constraints for username and email."""
        user1_data = {
            "username": "user1",
            "email": "user1@test.com",
            "password_hash": PasswordSecurity.hash_password("TestPassword123!")
        }
        user1_data[field] = value1
        
        user2_data = {
            "username": "user2", 
            "email": "user2@test.com",
            "password_hash": PasswordSecurity.hash_password("TestPassword123!")
        }
        user2_data[field] = value2
        
        user1 = User(**user1_data)
        user2 = User(**user2_data)
        
        db_session.add(user1)
        db_session.commit()
        
        db_session.add(user2)
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_recipe_creation_minimal(self, db_session: Session):
        """Test creating recipe with minimal required data."""
        recipe = Recipe(title="Minimal Recipe")
        db_session.add(recipe)
        db_session.commit()
        db_session.refresh(recipe)
        
        assert recipe.id is not None
        assert recipe.title == "Minimal Recipe"
        assert recipe.description is None
        assert recipe.cooking_time is None
        assert recipe.serving_size is None
    
    def test_recipe_creation_complete(self, db_session: Session):
        """Test creating recipe with all fields."""
        recipe = Recipe(
            title="Complete Recipe",
            description="<p>Full description</p>",
            cooking_time=30,
            serving_size=4
        )
        db_session.add(recipe)
        db_session.commit()
        db_session.refresh(recipe)
        
        assert recipe.title == "Complete Recipe"
        assert recipe.description == "<p>Full description</p>"
        assert recipe.cooking_time == 30
        assert recipe.serving_size == 4


class TestModelRelationships:
    """Test model relationships and cascading behavior."""
    
    def test_recipe_permission_relationship(self, db_session: Session, test_user: User, test_recipe: Recipe):
        """Test recipe permission relationships."""
        # Get existing permission (created by fixture)
        permission = db_session.query(RecipePermission).filter_by(
            user_id=test_user.id,
            recipe_id=test_recipe.id
        ).first()
        
        assert permission is not None
        assert permission.user.id == test_user.id
        assert permission.recipe.id == test_recipe.id
        assert permission in test_user.recipe_permissions
        assert permission in test_recipe.user_permissions
    
    def test_ingredient_recipe_relationship(self, db_session: Session, test_recipe: Recipe):
        """Test ingredient-recipe relationship."""
        ingredient = Ingredient(
            name="Test Ingredient",
            quantity=1.0,
            unit="cup",
            order_index=0,
            recipe_id=test_recipe.id
        )
        db_session.add(ingredient)
        db_session.commit()
        db_session.refresh(ingredient)
        
        assert ingredient.recipe.id == test_recipe.id
        assert ingredient in test_recipe.ingredients
    
    def test_instruction_recipe_relationship(self, db_session: Session, test_recipe: Recipe):
        """Test instruction-recipe relationship."""
        instruction = Instruction(
            title="Test Step",
            step_number=1,
            description="<p>Test instruction</p>",
            recipe_id=test_recipe.id
        )
        db_session.add(instruction)
        db_session.commit()
        db_session.refresh(instruction)
        
        assert instruction.recipe.id == test_recipe.id
        assert instruction in test_recipe.instructions
    
    def test_cascade_delete_user(self, db_session: Session):
        """Test cascading delete when user is removed."""
        # Create user with related data
        user = User(
            username="cascadetest",
            email="cascade@test.com",
            password_hash=PasswordSecurity.hash_password("TestPassword123!")
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        recipe = Recipe(title="Cascade Test Recipe")
        db_session.add(recipe)
        db_session.commit()
        db_session.refresh(recipe)
        
        permission = RecipePermission(
            user_id=user.id,
            recipe_id=recipe.id,
            role=PermissionRole.OWNER
        )
        db_session.add(permission)
        db_session.commit()
        
        # Delete user
        db_session.delete(user)
        db_session.commit()
        
        # Permission should be deleted (cascade)
        remaining_permission = db_session.query(RecipePermission).filter(
            RecipePermission.user_id == user.id
        ).first()
        assert remaining_permission is None
        
        # Recipe should still exist
        remaining_recipe = db_session.query(Recipe).filter(Recipe.id == recipe.id).first()
        assert remaining_recipe is not None
    
    def test_cascade_delete_recipe(self, db_session: Session, test_user: User):
        """Test cascading delete when recipe is removed."""
        recipe = Recipe(title="Delete Test Recipe")
        db_session.add(recipe)
        db_session.commit()
        db_session.refresh(recipe)
        
        # Add related data
        permission = RecipePermission(
            user_id=test_user.id,
            recipe_id=recipe.id,
            role=PermissionRole.OWNER
        )
        ingredient = Ingredient(
            name="Test Ingredient",
            quantity=1.0,
            unit="cup",
            order_index=0,
            recipe_id=recipe.id
        )
        instruction = Instruction(
            title="Test Step",
            step_number=1,
            description="<p>Test</p>",
            recipe_id=recipe.id
        )
        
        db_session.add_all([permission, ingredient, instruction])
        db_session.commit()
        
        # Delete recipe
        db_session.delete(recipe)
        db_session.commit()
        
        # All related data should be deleted (cascade)
        assert db_session.query(RecipePermission).filter(
            RecipePermission.recipe_id == recipe.id
        ).first() is None
        assert db_session.query(Ingredient).filter(
            Ingredient.recipe_id == recipe.id
        ).first() is None
        assert db_session.query(Instruction).filter(
            Instruction.recipe_id == recipe.id
        ).first() is None
        
        # User should still exist
        remaining_user = db_session.query(User).filter(User.id == test_user.id).first()
        assert remaining_user is not None


class TestModelConstraints:
    """Test model constraints and validation."""
    
    def test_recipe_permission_unique_constraint(self, db_session: Session, test_user: User, test_recipe: Recipe):
        """Test unique constraint on user-recipe permission combination."""
        # Remove existing permission
        db_session.query(RecipePermission).filter_by(
            user_id=test_user.id,
            recipe_id=test_recipe.id
        ).delete()
        db_session.commit()
        
        # Create first permission
        permission1 = RecipePermission(
            user_id=test_user.id,
            recipe_id=test_recipe.id,
            role=PermissionRole.OWNER
        )
        db_session.add(permission1)
        db_session.commit()
        
        # Try to create duplicate
        permission2 = RecipePermission(
            user_id=test_user.id,
            recipe_id=test_recipe.id,
            role=PermissionRole.EDITOR
        )
        db_session.add(permission2)
        
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    @pytest.mark.parametrize("role", [
        PermissionRole.OWNER,
        PermissionRole.EDITOR
    ])
    def test_permission_role_enum_values(self, db_session: Session, test_user: User, test_recipe: Recipe, role: PermissionRole):
        """Test all permission role enum values."""
        # Remove existing permission
        db_session.query(RecipePermission).filter_by(
            user_id=test_user.id,
            recipe_id=test_recipe.id
        ).delete()
        db_session.commit()
        
        permission = RecipePermission(
            user_id=test_user.id,
            recipe_id=test_recipe.id,
            role=role
        )
        db_session.add(permission)
        db_session.commit()
        db_session.refresh(permission)
        
        assert permission.role == role


class TestModelRepresentations:
    """Test model string representations."""
    
    def test_user_repr(self, db_session: Session):
        """Test user string representation."""
        user = User(
            username="reprtest",
            email="repr@test.com",
            password_hash=PasswordSecurity.hash_password("TestPassword123!")
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        expected = f"<User(id={user.id}, username='reprtest', email='repr@test.com')>"
        assert repr(user) == expected
    
    def test_recipe_repr(self, db_session: Session):
        """Test recipe string representation."""
        recipe = Recipe(
            title="Repr Test Recipe",
            cooking_time=30
        )
        db_session.add(recipe)
        db_session.commit()
        db_session.refresh(recipe)
        
        expected = f"<Recipe(id={recipe.id}, title='Repr Test Recipe', cooking_time=30)>"
        assert repr(recipe) == expected
    
    def test_recipe_permission_repr(self, db_session: Session, test_user: User, test_recipe: Recipe):
        """Test recipe permission string representation."""
        # Remove existing permission
        db_session.query(RecipePermission).filter_by(
            user_id=test_user.id,
            recipe_id=test_recipe.id
        ).delete()
        db_session.commit()
        
        permission = RecipePermission(
            user_id=test_user.id,
            recipe_id=test_recipe.id,
            role=PermissionRole.EDITOR
        )
        db_session.add(permission)
        db_session.commit()
        db_session.refresh(permission)
        
        expected = f"<RecipePermission(user_id={test_user.id}, recipe_id={test_recipe.id}, role='{PermissionRole.EDITOR}')>"
        assert repr(permission) == expected